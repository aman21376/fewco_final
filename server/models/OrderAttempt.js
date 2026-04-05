import mongoose from "mongoose";

const orderAttemptSchema = new mongoose.Schema({
  visitorId: { type: String, default: "" },
  productId: { type: String, default: "" },
  productName: { type: String, default: "" },
  productImage: { type: String, default: "" },
  productPrice: { type: Number, default: 0 },
  name: { type: String, default: "" },
  phone: { type: String, default: "" },
  selectedSize: { type: String, default: "" },
  selectedQuantity: { type: Number, default: 1 },
  success: { type: Boolean, default: false },
  failureReason: { type: String, default: "" },
  source: { type: String, default: "product-interest" }
}, { timestamps: true });

export default mongoose.model("OrderAttempt", orderAttemptSchema);
