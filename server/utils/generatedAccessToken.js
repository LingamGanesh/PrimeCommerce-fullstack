import jwt from "jsonwebtoken"

const generateAccessToken = async (userId, tokenVersion = 0) => {
  const secret = process.env.SECRET_KEY_ACCESS_TOKEN || process.env.JWT_SECRET
  if (!secret) throw new Error("Set SECRET_KEY_ACCESS_TOKEN (or JWT_SECRET for local development)")

  return jwt.sign(
    { id: userId, tokenVersion },
    secret,
    { expiresIn: "5h", algorithm: "HS256" }
  )
}

export default generateAccessToken
