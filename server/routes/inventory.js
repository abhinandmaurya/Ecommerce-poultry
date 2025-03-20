const express = require("express");
const router = express.Router();
const {
  getInventory,
  updateInventory,
} = require("../controllers/inventoryController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/", authMiddleware, roleMiddleware("admin"), getInventory);
router.put(
  "/:productId",
  authMiddleware,
  roleMiddleware("admin"),
  updateInventory
);

module.exports = router;
