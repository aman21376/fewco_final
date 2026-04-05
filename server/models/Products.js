import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  gender: { type: String, default: "men" },
  category: { type: String, default: "" },
  image: { type: String, required: true },
  images: { type: [String], default: [] },
  sizes: { type: [String], default: ["S", "M", "L"] },
  description: { type: String, default: "" },
  details: { type: String, default: "" },
  story: { type: String, default: "" },
  fabricCare: { type: String, default: "" },
  shipping: { type: String, default: "" },
  fit: { type: String, default: "Relaxed" },
  addedBy: { type: String, default: "" },
  priority: { type: Number, default: 0 },
  listingImage: { type: String, default: "" },
  totalStock: { type: Number, default: 100 },
  remainingStock: { type: Number, default: 100 },
  fixedStock: { type: Number, default: 10 },
  supplierFlexLimit: { type: Number, default: 10 },
  supplierReservedStock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
