import mongoose from "mongoose";

const geoPointSchema = new mongoose.Schema({
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: coordinates => Array.isArray(coordinates) && coordinates.length === 2 && coordinates.every(Number.isFinite)
        && coordinates[0] >= -180 && coordinates[0] <= 180 && coordinates[1] >= -90 && coordinates[1] <= 90,
      message: "GeoJSON coordinates must be [longitude, latitude] within valid ranges"
    }
  }
}, { _id: false });

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
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    label: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
    house: { type: String, trim: true, default: "" },
    floor: { type: String, trim: true, default: "" },
    landmark: { type: String, trim: true, default: "" },
    geo: { type: geoPointSchema, default: undefined },
    isDefault: { type: Boolean, default: false },
    deliveryInstructions: { type: String, trim: true, maxlength: 500, default: "" },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    autoIndex: false,
  }
);

addressSchema.index({ userId: 1 }, { name: "address_user_id_idx" });
addressSchema.index({ geo: "2dsphere" }, { name: "address_geo_2dsphere_idx" });
addressSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { isDefault: true }, name: "one_default_address_per_user" });

const AddressModel = mongoose.model("Address", addressSchema);

export default AddressModel;
