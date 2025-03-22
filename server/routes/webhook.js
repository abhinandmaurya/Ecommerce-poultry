const express = require("express");
const axios = require("axios");
const { logger } = require("../utils/logger");
const Payment = require("../models/Payment");

const router = express.Router();

// PayPal Webhook Route
router.post("/paypal", async (req, res) => {
  const webhookEvent = req.body;

  try {
    // Verify the webhook event with PayPal
    const isValid = await verifyPayPalWebhook(req.headers, webhookEvent);
    if (!isValid) {
      logger.warn("🚨 Invalid PayPal Webhook Signature");
      return res.status(400).send("Invalid Webhook");
    }

    logger.info(`✅ PayPal Webhook received: ${webhookEvent.event_type}`);

    // Handle different event types
    switch (webhookEvent.event_type) {
      case "PAYMENT.SALE.COMPLETED":
        await handlePaymentSuccess(webhookEvent.resource);
        break;

      case "PAYMENT.SALE.DENIED":
        await handlePaymentFailure(webhookEvent.resource);
        break;

      default:
        logger.warn(`Unhandled event type: ${webhookEvent.event_type}`);
    }

    res.sendStatus(200); // Acknowledge receipt
  } catch (error) {
    logger.error(`❌ Webhook processing error: ${error.message}`);
    res.status(500).send("Webhook Processing Error");
  }
});

// Function to verify PayPal webhook signature
async function verifyPayPalWebhook(headers, body) {
  try {
    const response = await axios.post(
      "https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature",
      {
        auth_algo: headers["paypal-auth-algo"],
        cert_url: headers["paypal-cert-url"],
        transmission_id: headers["paypal-transmission-id"],
        transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID, // Webhook ID from PayPal Dashboard
        webhook_event: body,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PAYPAL_ACCESS_TOKEN}`,
        },
      }
    );

    return response.data.verification_status === "SUCCESS";
  } catch (error) {
    logger.error(`🚨 PayPal Webhook Verification Failed: ${error.message}`);
    return false;
  }
}

// Function to handle successful payment
async function handlePaymentSuccess(resource) {
  try {
    const payment = new Payment({
      orderId: resource.invoice_number,
      userId: resource.custom, // Custom field from PayPal metadata
      amount: resource.amount.total,
      currency: resource.amount.currency,
      paymentMethod: "PayPal",
      status: "completed",
      transactionId: resource.id,
    });

    await payment.save();
    logger.info(`✅ Payment successful: ${resource.id}`);
  } catch (error) {
    logger.error(`❌ Error saving payment: ${error.message}`);
  }
}

// Function to handle failed payment
async function handlePaymentFailure(resource) {
  try {
    await Payment.findOneAndUpdate(
      { transactionId: resource.id },
      { status: "failed" }
    );
    logger.warn(`❌ Payment failed: ${resource.id}`);
  } catch (error) {
    logger.error(`❌ Error updating failed payment: ${error.message}`);
  }
}

module.exports = router;
