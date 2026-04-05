import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  heroImages: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model("Setting", settingsSchema);
