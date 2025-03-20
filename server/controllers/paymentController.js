const Order = require("../models/Order");
const { logger } = require("../utils/logger");
const { sendEmail } = require("../utils/email");

// Placeholder for payment gateway (e.g., Stripe)
const processPayment = async (req, res) => {
  const { orderId, paymentMethod } = req.body;
  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    // Simulate payment processing
    order.paymentStatus = "paid";
    await order.save();

    const user = await User.findById(req.user.id);
    await sendEmail(
      user.email,
      "Payment Successful",
      `Payment for order #${order._id} was successful`
    );
    logger.info(`Payment processed for order: ${order._id}`);
    res.json({ message: "Payment processed successfully", order });
  } catch (error) {
    logger.error(`Payment error: ${error.message}`);
    res.status(500).json({ message: "Payment processing failed" });
  }
};

module.exports = { processPayment };
