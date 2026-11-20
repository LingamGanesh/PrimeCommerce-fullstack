import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";

const generateRefreshToken = async (userId) => {
  const secret = process.env.SECRET_KEY_REFRESH_TOKEN || process.env.JWT_SECRET;
  if (!secret) throw new Error("Set SECRET_KEY_REFRESH_TOKEN (or JWT_SECRET for local development)");

  const token = jwt.sign(
    { id: userId },
    secret,
    { expiresIn: "7d" }
  );

  await UserModel.updateOne(
    { _id: userId },
    { refresh_token: token }
  );

  return token;
};

export default generateRefreshToken;
