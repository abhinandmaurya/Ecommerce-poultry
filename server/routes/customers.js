const express = require("express");
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  updateCustomer,
} = require("../controllers/customerController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/", authMiddleware, roleMiddleware("admin"), getCustomers);
router.get("/:id", authMiddleware, roleMiddleware("admin"), getCustomerById);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateCustomer);

module.exports = router;
