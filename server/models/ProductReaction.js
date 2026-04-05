import mongoose from "mongoose";

const productReactionSchema = new mongoose.Schema({
  visitorId: { type: String, required: true },
  productId: { type: String, required: true }
}, { timestamps: true });

productReactionSchema.index({ visitorId: 1, productId: 1 }, { unique: true });

export default mongoose.model("ProductReaction", productReactionSchema);
