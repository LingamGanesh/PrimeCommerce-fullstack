import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    mobile: {
      type: Number,
      default: null,
    },
    refresh_token: {
      type: String,
      default: "",
      select: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    staffAssignmentVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    verify_email: {
      type: Boolean,
      default: false,
    },
    last_login_date: {
      type: Date,
      default: null,
    },
    status: {
      type: String, // You can use enum if you have fixed accountStatus values
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    address_details: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    shopping_cart: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CartProduct",
      },
    ],
    orderHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    forgot_password_otp: {
      type: String,
      default: "",
      select: false,
    },
    forgot_password_otp_hash: {
      type: String,
      default: "",
      select: false,
    },
    forgot_password_attempts: {
      type: Number,
      default: 0,
      select: false,
    },
    email_verification_token_hash: {
      type: String,
      default: "",
      select: false,
    },
    email_verification_expires_at: {
      type: Date,
      default: null,
      select: false,
    },
    forgot_password_expiry: {
      type: Date,
      default: null,
      select: false,
    },
    password_reset_token_hash: {
      type: String,
      default: "",
      select: false,
    },
    password_reset_expires_at: {
      type: Date,
      default: null,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "store_manager", "support", "marketing", "picker", "rider"],
      default: "user",
      index: true,
    },
    permissions: { type: [String], default: [] },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    walletBalance: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
