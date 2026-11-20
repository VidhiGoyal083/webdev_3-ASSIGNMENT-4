const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  let token = null;

  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token && req.headers["cookie"]) {
    const cookies = req.headers["cookie"].split(";").map((c) => c.trim());
    const tokenCookie = cookies.find((c) => c.startsWith("token="));
    if (tokenCookie) {
      token = tokenCookie.slice("token=".length);
    }
  }

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, username, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };