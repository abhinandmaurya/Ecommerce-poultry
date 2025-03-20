const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const { logger } = require("../utils/logger");

const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const query = category ? { category } : {};
    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    const total = await Product.countDocuments(query);
    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error(`Get products error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    logger.error(`Get product error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

const createProduct = async (req, res) => {
  const { name, description, price, stock, image, category } = req.body;
  try {
    const product = new Product({
      name,
      description,
      price,
      stock,
      image,
      category,
    });
    await product.save();
    await Inventory.create({ product: product._id, quantity: stock });
    logger.info(`Product created: ${name}`);
    res.status(201).json(product);
  } catch (error) {
    logger.error(`Create product error: ${error.message}`);
    res.status(400).json({ message: "Error creating product" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (req.body.stock !== undefined) {
      await Inventory.findOneAndUpdate(
        { product: product._id },
        { quantity: req.body.stock }
      );
    }
    logger.info(`Product updated: ${product.name}`);
    res.json(product);
  } catch (error) {
    logger.error(`Update product error: ${error.message}`);
    res.status(400).json({ message: "Error updating product" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await Inventory.deleteOne({ product: product._id });
    logger.info(`Product deleted: ${product.name}`);
    res.json({ message: "Product deleted" });
  } catch (error) {
    logger.error(`Delete product error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
