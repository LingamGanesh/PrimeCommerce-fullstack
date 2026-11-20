import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    const authorization = req.headers?.authorization || "";
    const bearerToken = /^Bearer\s+(.+)$/i.exec(authorization)?.[1];
    const token = req.cookies?.accessToken || bearerToken;

    if (!token) {
      return res.status(401).json({
        message: "Token not provided",
        error: true,
        success: false,
      });
    }

    const secret = process.env.SECRET_KEY_ACCESS_TOKEN || process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        message: "Authentication secret is not configured",
        error: true,
        success: false,
      });
    }

    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized access",
      error: true,
      success: false,
    });
  }
};

export default auth;
