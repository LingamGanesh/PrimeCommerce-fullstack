import mongoose from "mongoose";
import AddressModel from "../models/address.model.js";
import UserModel from "../models/user.model.js";
import { normalizeMobileNumber } from "../utils/mobileNumber.js";
import { normalizeGeoPoint } from "../utils/geoPoint.js";

const fields = ["address_line", "city", "state", "pincode", "country", "mobile"];
const optionalTextFields = ["label", "house", "floor", "landmark", "deliveryInstructions"];

export async function listAddresses(req, res) {
  try {
    const addresses = await AddressModel.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, error: false, data: addresses });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to load addresses" });
  }
}

export async function createAddress(req, res) {
  const session = await mongoose.startSession();
  try {
    const payload = {};
    for (const field of fields) payload[field] = req.body[field];
    const maxLengths = { address_line: 250, city: 80, state: 80, pincode: 6, country: 80 };
    for (const field of ["address_line", "city", "state", "pincode", "country"]) {
      if (typeof payload[field] !== "string" || !payload[field].trim()) {
        return res.status(400).json({ success: false, error: true, message: field + " is required" });
      }
      payload[field] = payload[field].trim();
      if (payload[field].length > maxLengths[field]) {
        return res.status(400).json({ success: false, error: true, message: field + " is too long" });
      }
    }
    const mobile = normalizeMobileNumber(payload.mobile);
    // This checkout currently accepts Indian six-digit PIN codes and mobile numbers.
    if (!/^[6-9]\d{9}$/.test(mobile) || !/^[1-9]\d{5}$/.test(payload.pincode)) {
      return res.status(400).json({ success: false, error: true, message: "Enter a valid Indian mobile number (10 digits) and PIN code (6 digits)" });
    }
    payload.mobile = mobile;
    for (const field of optionalTextFields) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "string" || req.body[field].length > (field === "deliveryInstructions" ? 500 : 120)) {
          return res.status(400).json({ success: false, error: true, message: field + " must be valid text" });
        }
        payload[field] = req.body[field].trim();
      }
    }
    if (payload.label !== undefined && !["Home", "Work", "Other"].includes(payload.label)) {
      return res.status(400).json({ success: false, error: true, message: "Address label must be Home, Work or Other" });
    }
    try { payload.geo = normalizeGeoPoint(req.body.geo); }
    catch (error) { return res.status(400).json({ success: false, error: true, message: error.message }); }
    if (req.body.isDefault !== undefined && typeof req.body.isDefault !== "boolean") {
      return res.status(400).json({ success: false, error: true, message: "isDefault must be true or false" });
    }
    payload.isDefault = req.body.isDefault === true;
    payload.userId = req.userId;
    let address;
    await session.withTransaction(async () => {
      const existingAddressCount = await AddressModel.countDocuments({ userId: req.userId }).session(session);
      const makeDefault = payload.isDefault || existingAddressCount === 0;
      if (makeDefault) await AddressModel.updateMany({ userId: req.userId, isDefault: true }, { $set: { isDefault: false } }, { session });
      payload.isDefault = makeDefault;
      [address] = await AddressModel.create([payload], { session });
      const userUpdate = await UserModel.updateOne(
        { _id: req.userId },
        { $addToSet: { address_details: address._id } },
        { session }
      );
      if (userUpdate.matchedCount !== 1) throw new Error("User account not found");
    });
    return res.status(201).json({ success: true, error: false, message: "Address saved", data: address });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to save address" });
  } finally {
    await session.endSession();
  }
}

export async function updateAddress(req, res) {
  const session = await mongoose.startSession();
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: true, message: "Invalid address id" });
    let updatedAddress;
    await session.withTransaction(async () => {
      const current = await AddressModel.findOne({ _id: req.params.id, userId: req.userId }).session(session);
      if (!current) return;

      const updates = {};
      const unset = {};
      const maxLengths = { address_line: 250, city: 80, state: 80, pincode: 6, country: 80 };
      for (const field of ["address_line", "city", "state", "pincode", "country"]) {
        if (req.body[field] === undefined) continue;
        if (typeof req.body[field] !== "string" || !req.body[field].trim() || req.body[field].trim().length > maxLengths[field]) {
          throw Object.assign(new Error(field + " is invalid"), { statusCode: 400 });
        }
        updates[field] = req.body[field].trim();
      }
      if (updates.pincode !== undefined && !/^[1-9]\\d{5}$/.test(updates.pincode)) {
        throw Object.assign(new Error("Enter a valid six-digit Indian PIN code"), { statusCode: 400 });
      }
      if (req.body.mobile !== undefined) {
        const mobile = normalizeMobileNumber(req.body.mobile);
        if (!/^[6-9]\\d{9}$/.test(mobile)) throw Object.assign(new Error("Enter a valid Indian mobile number"), { statusCode: 400 });
        updates.mobile = mobile;
      }
      for (const field of optionalTextFields) {
        if (req.body[field] === undefined) continue;
        const maxLength = field === "deliveryInstructions" ? 500 : 120;
        if (typeof req.body[field] !== "string" || req.body[field].length > maxLength) {
          throw Object.assign(new Error(field + " must be valid text"), { statusCode: 400 });
        }
        updates[field] = req.body[field].trim();
      }
      if (updates.label !== undefined && !["Home", "Work", "Other"].includes(updates.label)) {
        throw Object.assign(new Error("Address label must be Home, Work or Other"), { statusCode: 400 });
      }
      if (req.body.geo !== undefined) {
        if (req.body.geo === null) unset.geo = "";
        else {
          try { updates.geo = normalizeGeoPoint(req.body.geo); }
          catch (error) { throw Object.assign(error, { statusCode: 400 }); }
        }
      }
      if (req.body.isDefault !== undefined && typeof req.body.isDefault !== "boolean") {
        throw Object.assign(new Error("isDefault must be true or false"), { statusCode: 400 });
      }
      if (req.body.isDefault === true) {
        await AddressModel.updateMany({ userId: req.userId, isDefault: true }, { $set: { isDefault: false } }, { session });
        updates.isDefault = true;
      } else if (req.body.isDefault === false && current.isDefault) {
        const replacement = await AddressModel.findOne({ userId: req.userId, _id: { $ne: current._id } }).sort({ createdAt: -1 }).session(session);
        if (replacement) await AddressModel.updateOne({ _id: replacement._id, userId: req.userId }, { $set: { isDefault: true } }, { session });
        else updates.isDefault = true;
      }
      if (!Object.keys(updates).length && !Object.keys(unset).length) {
        throw Object.assign(new Error("No address changes were provided"), { statusCode: 400 });
      }
      const update = {};
      if (Object.keys(updates).length) update.$set = updates;
      if (Object.keys(unset).length) update.$unset = unset;
      updatedAddress = await AddressModel.findOneAndUpdate({ _id: current._id, userId: req.userId }, update, { new: true, runValidators: true, session });
    });
    if (!updatedAddress) return res.status(404).json({ success: false, error: true, message: "Address not found" });
    return res.json({ success: true, error: false, message: "Address updated", data: updatedAddress });
  } catch (error) {
    const status = Number.isInteger(error.statusCode) ? error.statusCode : 503;
    return res.status(status).json({ success: false, error: true, message: status === 503 ? "Unable to safely update address. Please retry." : error.message });
  } finally {
    await session.endSession();
  }
}

export async function deleteAddress(req, res) {
  const session = await mongoose.startSession();
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: true, message: "Invalid address id" });
    let address;
    await session.withTransaction(async () => {
      address = await AddressModel.findOneAndDelete({ _id: req.params.id, userId: req.userId }, { session });
      if (!address) return;
      if (address.isDefault) {
        const replacement = await AddressModel.findOne({ userId: req.userId }).sort({ createdAt: -1 }).session(session);
        if (replacement) await AddressModel.updateOne({ _id: replacement._id, userId: req.userId }, { $set: { isDefault: true } }, { session });
      }
      await UserModel.updateOne(
        { _id: req.userId },
        { $pull: { address_details: address._id } },
        { session }
      );
    });
    if (!address) return res.status(404).json({ success: false, error: true, message: "Address not found" });
    return res.json({ success: true, error: false, message: "Address deleted" });
  } catch {
    return res.status(503).json({ success: false, error: true, message: "Unable to safely delete address. Please retry." });
  } finally {
    await session.endSession();
  }
}
