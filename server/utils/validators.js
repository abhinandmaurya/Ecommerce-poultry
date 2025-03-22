const Joi = require("joi");

const validatePayment = (data) => {
  const schema = Joi.object({
    orderId: Joi.string().required(),
    userId: Joi.string().required(),
    amount: Joi.number().min(1).required(),
    paymentMethod: Joi.string()
      .valid("credit_card", "paypal", "stripe", "upi", "bank_transfer")
      .required(),
    status: Joi.string().valid("pending", "completed", "failed", "refunded"),
    transactionId: Joi.string().optional(),
  });

  return schema.validate(data);
};

module.exports = { validatePayment };
