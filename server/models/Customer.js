import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: "" },
  city: { type: String, default: "" },
  pincode: { type: String, default: "" },
  visitorId: { type: String, default: "" },
  source: { type: String, default: "waitlist" },
  productId: { type: String, default: "" },
  productName: { type: String, default: "" },
  productImage: { type: String, default: "" },
  productPrice: { type: Number, default: 0 },
  selectedSize: { type: String, default: "" },
  selectedQuantity: { type: Number, default: 1 },
  selectedVariant: { type: String, default: "" },
  notes: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Customer", customerSchema);
