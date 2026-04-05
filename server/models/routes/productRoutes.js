import express from "express";
import Product from "../Products.js";
import ProductReaction from "../ProductReaction.js";

const router = express.Router();

async function serializeProduct(product, visitorId = "") {
  const likeCount = await ProductReaction.countDocuments({ productId: String(product._id) });
  const viewerHasLiked = visitorId
    ? Boolean(await ProductReaction.findOne({ productId: String(product._id), visitorId }).lean())
    : false;

  return {
    ...product.toObject(),
    likeCount,
    viewerHasLiked
  };
}

// get all
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ priority: -1, createdAt: -1, _id: -1 });
    const visitorId = String(req.query.visitorId || "").trim();
    const serialized = await Promise.all(products.map(product => serializeProduct(product, visitorId)));
    res.json(serialized);
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
    const visitorId = String(req.query.visitorId || "").trim();
    res.json(await serializeProduct(product, visitorId));
  } catch (error) {
    res.status(400).json({ message: "Failed to fetch product" });
  }
});

router.post("/:id/like", async (req, res) => {
  try {
    const visitorId = String(req.body.visitorId || "").trim();
    if (!visitorId) {
      return res.status(400).json({ message: "visitorId is required" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingReaction = await ProductReaction.findOne({ visitorId, productId: String(product._id) });
    let viewerHasLiked = true;

    if (existingReaction) {
      await ProductReaction.deleteOne({ _id: existingReaction._id });
      viewerHasLiked = false;
    } else {
      await ProductReaction.create({ visitorId, productId: String(product._id) });
    }

    const likeCount = await ProductReaction.countDocuments({ productId: String(product._id) });
    res.status(200).json({ ok: true, likeCount, viewerHasLiked });
  } catch (error) {
    if (error.code === 11000) {
      const likeCount = await ProductReaction.countDocuments({ productId: String(req.params.id) });
      return res.json({ ok: true, duplicate: true, likeCount, viewerHasLiked: true });
    }
    res.status(400).json({ message: "Failed to save product like" });
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
