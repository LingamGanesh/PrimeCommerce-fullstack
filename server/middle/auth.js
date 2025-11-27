import jwt from 'jsonwebtoken'

// ===============================================
// AUTH MIDDLEWARE (Protect Routes)
// ===============================================
const auth = async (request, response, next) => {
  try {
    // Get token from cookies
    const accessToken = request.cookies?.accessToken;

    // If no token → unauthorized
    if (!accessToken) {
      return response.status(401).json({
        message: 'Unauthorized - Please Login',
        error: true,
        success: false
      });
    }

    // Verify token
    const decoded = jwt.verify(
      accessToken,
      process.env.SECRET_KEY_ACCESS_TOKEN
    );

    // Attach userId to request object
    request.userId = decoded.id;

    next(); // Continue to next controller

  } catch (error) {
    return response.status(401).json({
      message: 'Invalid or Expired Token',
      error: true,
      success: false
    });
  }
};

export default auth;
