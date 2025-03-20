const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const { logger } = require("../utils/logger");

const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate("product", "name price stock")
      .lean();
    res.json(inventory);
  } catch (error) {
    logger.error(`Get inventory error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

const updateInventory = async (req, res) => {
  const { quantity } = req.body;
  try {
    const inventory = await Inventory.findOneAndUpdate(
      { product: req.params.productId },
      { quantity, lastUpdated: Date.now() },
      { new: true, upsert: true }
    );
    await Product.findByIdAndUpdate(req.params.productId, { stock: quantity });
    logger.info(`Inventory updated for product: ${req.params.productId}`);
    res.json(inventory);
  } catch (error) {
    logger.error(`Update inventory error: ${error.message}`);
    res.status(400).json({ message: "Error updating inventory" });
  }
};

module.exports = { getInventory, updateInventory };
