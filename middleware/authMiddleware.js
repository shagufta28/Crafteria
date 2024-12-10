const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Token extraction
      token = req.headers.authorization.split(" ")[1];

      // Token verification
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add user data to request object (if needed)
      req.user = decoded;

      next(); // Proceed to the next middleware/controller
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const authenticateUser = async (token) => {
  try {
    if (!token) return null;

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedToken) return null;

    const user = await User.findById(decodedToken.id);

    if (!user) return null;

    return user;
  } catch (error) {
    console.error("Token Authentication Error:", error.message);
    return null;
  }
};



module.exports = { protect, authenticateUser };
