const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    const token =
      req.cookies?.token ||
      (auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null);

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
    });
  }
};

module.exports = protect;
