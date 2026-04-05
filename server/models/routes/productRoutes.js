import express from "express";
import Product from "../Products.js";

const router = express.Router();

// get all
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ priority: -1, createdAt: -1, _id: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// add product (admin)
router.post("/", async (req, res) => {
  try {
    const payload = {
      ...req.body,
      image: req.body.image || req.body.images?.[0] || "",
      images: Array.isArray(req.body.images) ? req.body.images.filter(Boolean).slice(0, 4) : [],
      sizes: Array.isArray(req.body.sizes) ? req.body.sizes.filter(Boolean) : [],
      addedBy: String(req.body.addedBy || "").trim(),
      priority: Number(req.body.priority || 0),
      listingImage: String(req.body.listingImage || req.body.image || req.body.images?.[0] || "").trim(),
      totalStock: 100,
      remainingStock: Number(req.body.remainingStock || 100)
    };

    const product = new Product(payload);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: "Failed to add product" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: "Failed to fetch product" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const result = await Product.deleteMany({});
    res.json({ ok: true, deletedCount: result.deletedCount || 0, message: "All products deleted" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete all products" });
  }
});

// update stock
router.put("/:id", async (req, res) => {
  try {
    const payload = {
      ...req.body,
      image: req.body.image || req.body.images?.[0] || req.body.image,
      images: Array.isArray(req.body.images) ? req.body.images.filter(Boolean).slice(0, 4) : req.body.images,
      sizes: Array.isArray(req.body.sizes) ? req.body.sizes.filter(Boolean) : req.body.sizes,
      addedBy: String(req.body.addedBy || "").trim(),
      priority: Number(req.body.priority || 0),
      listingImage: String(req.body.listingImage || req.body.image || req.body.images?.[0] || "").trim(),
      totalStock: 100,
      remainingStock: Number(req.body.remainingStock || 100)
    };
    const updated = await Product.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Failed to update product" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ ok: true, message: "Product deleted" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete product" });
  }
});

export default router;
