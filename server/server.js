const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");
const { logger } = require("./utils/logger");

// Load environment variables first
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/webhooks", require("./routes/webhook"));

// Root Route
app.get("/", (req, res) => {
  res.send("🐔 Poultry E-commerce Backend is running 🚀");
});

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`✅ Server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  logger.warn("🚨 Shutting down server...");
  await mongoose.connection.close();
  server.close(() => {
    logger.info("✅ Server shutdown complete.");
    process.exit(0);
  });
});
