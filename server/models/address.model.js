import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    address_line: {
      type: String,
      required: [true, "Address line is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    mobile: {
      type: Number,
      required: [true, "Mobile number is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
    house: { type: String, trim: true, default: "" },
    floor: { type: String, trim: true, default: "" },
    landmark: { type: String, trim: true, default: "" },
    geo: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined }
    },
    isDefault: { type: Boolean, default: false, index: true },
    deliveryInstructions: { type: String, trim: true, maxlength: 500, default: "" },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const AddressModel = mongoose.model("Address", addressSchema);

export default AddressModel;
