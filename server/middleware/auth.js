import jwt from 'jsonwebtoken'

const auth = (request, response, next) => {
  try {
    const token =
      request.cookies?.accessToken ||
      request.headers?.authorization?.split(" ")[1]

    if (!token) {
      return response.status(401).json({
        message: "Token not provided",
        error: true,
        success: false
      })
    }

    const decoded = jwt.verify(
      token,
      process.env.SECRET_KEY_ACCESS_TOKEN
    )

    // 🔥 VERY IMPORTANT FIX
    request.userId = decoded.userId   // ✅ NOT decoded.id

    console.log("AUTH USER ID:", request.userId)

    next()
  } catch (error) {
    return response.status(401).json({
      message: "Unauthorized access",
      error: true,
      success: false
    })
  }
}

export default auth
