import jwt from "jsonwebtoken"

const generateAccessToken = async (userId) => {
  const secret = process.env.SECRET_KEY_ACCESS_TOKEN || process.env.JWT_SECRET
  if (!secret) throw new Error("Set SECRET_KEY_ACCESS_TOKEN (or JWT_SECRET for local development)")

  return jwt.sign(
    { id: userId },
    secret,
    { expiresIn: "5h" }
  )
}

export default generateAccessToken
