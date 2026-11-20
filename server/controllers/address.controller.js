import mongoose from "mongoose";
import AddressModel from "../models/address.model.js";
import UserModel from "../models/user.model.js";

const fields = ["address_line", "city", "state", "pincode", "country", "mobile"];

export async function listAddresses(req, res) {
  try {
    const addresses = await AddressModel.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, error: false, data: addresses });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to load addresses" });
  }
}

export async function createAddress(req, res) {
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
    const mobile = String(payload.mobile ?? "").replace(/\D/g, "");
    // This checkout currently accepts Indian six-digit PIN codes and mobile numbers.
    if (!/^[6-9]\d{9}$/.test(mobile) || !/^[1-9]\d{5}$/.test(payload.pincode)) {
      return res.status(400).json({ success: false, error: true, message: "Enter a valid Indian mobile number (10 digits) and PIN code (6 digits)" });
    }
    payload.mobile = Number(mobile);
    payload.userId = req.userId;
    const address = await AddressModel.create(payload);
    await UserModel.findByIdAndUpdate(req.userId, { $addToSet: { address_details: address._id } });
    return res.status(201).json({ success: true, error: false, message: "Address saved", data: address });
  } catch {
    return res.status(400).json({ success: false, error: true, message: "Unable to save address" });
  }
}

export async function deleteAddress(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: true, message: "Invalid address id" });
    const address = await AddressModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!address) return res.status(404).json({ success: false, error: true, message: "Address not found" });
    await UserModel.findByIdAndUpdate(req.userId, { $pull: { address_details: address._id } });
    return res.json({ success: true, error: false, message: "Address deleted" });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to delete address" });
  }
}
