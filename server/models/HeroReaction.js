import mongoose from "mongoose";

const heroReactionSchema = new mongoose.Schema({
  visitorId: { type: String, required: true },
  imageUrl: { type: String, required: true },
  slideIndex: { type: Number, required: true }
}, { timestamps: true });

heroReactionSchema.index({ visitorId: 1, imageUrl: 1 }, { unique: true });

export default mongoose.model("HeroReaction", heroReactionSchema);
