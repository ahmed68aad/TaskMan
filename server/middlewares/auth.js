const jwt = require("jsonwebtoken");

const authMiddleware = async (request, response, next) => {
  const authHeader = request.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";
  const token = bearerToken || request.headers.token;

  if (!token) {
    return response.status(401).json({
      success: false,
      message: "Not Authorized, Login Again",
    });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    request.userId = tokenDecode.id;
    next();
  } catch (error) {
    console.log(error);
    response.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
