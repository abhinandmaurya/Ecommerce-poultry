const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    unique: true,
  },
  quantity: { type: Number, required: true, min: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Inventory", inventorySchema);
