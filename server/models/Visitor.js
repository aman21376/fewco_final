import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, unique: true },
  firstSeenAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  visitCount: { type: Number, default: 1 },
  path: { type: String, default: "/" },
  userAgent: { type: String, default: "" },
  preOrderClicked: { type: Boolean, default: false },
  preOrderClickedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("Visitor", visitorSchema);
