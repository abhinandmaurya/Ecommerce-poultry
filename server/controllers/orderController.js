const Order = require("../models/Order");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const { logger } = require("../utils/logger");
const { sendEmail } = require("../utils/email");

const createOrder = async (req, res) => {
  const { products, shippingAddress } = req.body;
  try {
    const productIds = products.map((p) => p.product);
    const productDocs = await Product.find({ _id: { $in: productIds } });
    if (productDocs.length !== productIds.length)
      return res.status(400).json({ message: "Invalid products" });

    const orderProducts = products.map((p) => {
      const product = productDocs.find((pd) => pd._id.toString() === p.product);
      if (product.stock < p.quantity)
        throw new Error(`Insufficient stock for ${product.name}`);
      return { product: p.product, quantity: p.quantity, price: product.price };
    });

    const total = orderProducts.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    );
    const order = new Order({
      user: req.user.id,
      products: orderProducts,
      total,
      shippingAddress,
    });
    await order.save();

    await Promise.all(
      orderProducts.map((p) =>
        Product.findByIdAndUpdate(p.product, { $inc: { stock: -p.quantity } })
      )
    );
    await Promise.all(
      orderProducts.map((p) =>
        Inventory.findOneAndUpdate(
          { product: p.product },
          { $inc: { quantity: -p.quantity } }
        )
      )
    );

    const user = await User.findById(req.user.id);
    await sendEmail(
      user.email,
      "Order Confirmation",
      `Your order #${order._id} has been placed!`
    );
    logger.info(`Order created: ${order._id}`);
    res.status(201).json(order);
  } catch (error) {
    logger.error(`Create order error: ${error.message}`);
    res.status(400).json({ message: error.message || "Error creating order" });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find(
      req.user.role === "admin" ? {} : { user: req.user.id }
    )
      .populate("products.product", "name price")
      .populate("user", "name email")
      .lean();
    res.json(orders);
  } catch (error) {
    logger.error(`Get orders error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne(
      req.user.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, user: req.user.id }
    )
      .populate("products.product", "name price")
      .populate("user", "name email")
      .lean();
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    logger.error(`Get order error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    const user = await User.findById(order.user);
    await sendEmail(
      user.email,
      "Order Update",
      `Your order #${order._id} is now ${status}`
    );
    logger.info(`Order status updated: ${order._id} to ${status}`);
    res.json(order);
  } catch (error) {
    logger.error(`Update order status error: ${error.message}`);
    res.status(400).json({ message: "Error updating order status" });
  }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus };
