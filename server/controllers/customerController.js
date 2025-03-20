const User = require("../models/User");
const { logger } = require("../utils/logger");

const getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" })
      .select("-password")
      .lean();
    res.json(customers);
  } catch (error) {
    logger.error(`Get customers error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)
      .select("-password")
      .lean();
    if (!customer || customer.role !== "customer")
      return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (error) {
    logger.error(`Get customer error: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer || customer.role !== "customer")
      return res.status(404).json({ message: "Customer not found" });
    logger.info(`Customer updated: ${customer.email}`);
    res.json(customer);
  } catch (error) {
    logger.error(`Update customer error: ${error.message}`);
    res.status(400).json({ message: "Error updating customer" });
  }
};

module.exports = { getCustomers, getCustomerById, updateCustomer };
