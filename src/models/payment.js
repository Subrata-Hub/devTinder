const { default: mongoose } = require("mongoose");

// --- SUB-SCHEMAS FOR PURCHASE UNITS ---
const itemSchema = new mongoose.Schema(
  {
    name: { type: String },
    unit_amount: {
      currency_code: { type: String },
      value: { type: String },
    },
    quantity: { type: Number },
    description: { type: String },
  },
  { _id: false }
);

const purchaseUnitSchema = new mongoose.Schema(
  {
    reference_id: { type: String },
    amount: {
      currency_code: { type: String },
      value: { type: String },
      breakdown: {
        item_total: {
          currency_code: { type: String },
          value: { type: String },
        },
      },
    },
    payee: {
      email_address: { type: String },
      merchant_id: { type: String },
      display_data: {
        brand_name: { type: String },
      },
    },
    items: [itemSchema],
  },
  { _id: false }
);

// --- NEW SUB-SCHEMA FOR PAYER ---
const payerSchema = new mongoose.Schema(
  {
    email_address: { type: String },
    payer_id: {
      type: String,
    },
    name: {
      given_name: { type: String },
      surname: { type: String },
    },
    phone: {
      phone_number: {
        national_number: { type: String },
      },
    },
    address: {
      country_code: { type: String },
    },
  },
  { _id: false }
);

// --- NEW SUB-SCHEMA FOR PAYPAL PAYMENT SOURCE ---
const paypalSchema = new mongoose.Schema(
  {
    account_id: { type: String },
    account_status: { type: String },
    address: {
      country_code: { type: String },
    },
    email_address: { type: String },
    name: {
      given_name: { type: String },
      surname: { type: String },
    },
  },
  { _id: false }
);

// --- NEW SUB-SCHEMA FOR GENERAL PAYMENT SOURCE ---
const paymentSourceSchema = new mongoose.Schema(
  {
    paypal: paypalSchema, // Embed the paypal schema here
    // Add other payment methods here if needed in the future (e.g., card: cardSchema)
  },
  { _id: false }
);

// --- SUB-SCHEMA FOR LINKS ---
const linkSchema = new mongoose.Schema(
  {
    href: { type: String },
    rel: { type: String },
    method: { type: String },
  },
  { _id: false } // Prevents Mongoose from creating an _id for each link
);

// --- MAIN PAYMENT SCHEMA ---
const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    membershipType: {
      type: String,
    },
    // Field for purchase units array
    purchase_units: [purchaseUnitSchema],
    // Existing field for the payer object
    payer: payerSchema,
    // Newly added field for the payment source object
    payment_source: paymentSourceSchema,
    links: {
      type: [linkSchema],
    },
  },
  { timestamps: true }
);

const Payment = new mongoose.model("Payment", paymentSchema);

module.exports = Payment;
