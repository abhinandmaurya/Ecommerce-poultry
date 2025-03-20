const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { logger } = require("../utils/logger");
const { sendEmail } = require("../utils/email");

const register = async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({ name, email, password, phone, address });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    await sendEmail(
      email,
      "Welcome to Poultry E-commerce",
      "Thank you for registering!"
    );
    logger.info(`User registered: ${email}`);
    res.status(201).json({ token });
  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    logger.info(`User logged in: ${email}`);
    res.json({ token });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login };
