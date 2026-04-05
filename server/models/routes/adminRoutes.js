import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import XLSX from "xlsx";
import Product from "../Products.js";
import Setting from "../Settings.js";
import Visitor from "../Visitor.js";
import Customer from "../Customer.js";
import HeroReaction from "../HeroReaction.js";
import ProductReaction from "../ProductReaction.js";

const router = express.Router();
const SETTINGS_KEY = "global";
const upload = multer({ storage: multer.memoryStorage() });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const carouselFolder = path.resolve(__dirname, "../../../client/assets/carousel");

const defaultHeroImages = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80"
];

async function getSettings() {
  let settings = await Setting.findOne({ key: SETTINGS_KEY });
  if (!settings) {
    settings = await Setting.create({ key: SETTINGS_KEY, heroImages: defaultHeroImages });
  }
  return settings;
}

async function getLocalCarouselImages() {
  try {
    const entries = await fs.readdir(carouselFolder, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile() && /\.(png|jpe?g|webp|avif)$/i.test(entry.name))
      .map(entry => entry.name)
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
      .slice(0, 5)
      .map(name => `/assets/carousel/${name}`);
  } catch (error) {
    return [];
  }
}

function parseSizes(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map(item => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "yes", "1"].includes(value.trim().toLowerCase());
  if (typeof value === "number") return value === 1;
  return false;
}

function normalizeImportProduct(row) {
  const images = [row.image, row.image2, row.image3, row.image4].filter(Boolean);
  const listingImage = String(
    row.listingImage || row["listing image"] || row["main page image"] || images[0] || ""
  ).trim();
  return {
    name: String(row.name || "").trim(),
    price: Number(row.price || 0),
    category: String(row.category || row.gender || "men").trim().toLowerCase(),
    gender: String(row.gender || row.category || "men").trim().toLowerCase(),
    sizes: parseSizes(row.sizes),
    fit: String(row.fit || "Relaxed").trim(),
    description: String(row.description || "").trim(),
    details: String(row.details || "").trim(),
    story: String(row.story || "").trim(),
    fabricCare: String(row.fabricCare || row["fabric care"] || "").trim(),
    shipping: String(row.shipping || "").trim(),
    addedBy: String(row.addedBy || row["added by"] || "").trim(),
    priority: Number(row.priority || 0),
    listingImage,
    image: images[0] || "",
    images,
    totalStock: 100,
    remainingStock: Number(row.remainingStock || row["remaining stock"] || 100),
    featured: normalizeBoolean(row.featured)
  };
}

router.get("/settings", async (req, res) => {
  try {
    const settings = await getSettings();
    const localHeroImages = await getLocalCarouselImages();
    res.json({
      ...settings.toObject(),
      heroImages: localHeroImages.length ? localHeroImages : settings.heroImages,
      localHeroImages
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load settings" });
  }
});

router.get("/carousel-folder", async (req, res) => {
  try {
    const localHeroImages = await getLocalCarouselImages();
    res.json({
      folder: "client/assets/carousel",
      heroImages: localHeroImages,
      usingLocalFolder: localHeroImages.length > 0
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load local carousel folder" });
  }
});

router.put("/settings/carousel", async (req, res) => {
  try {
    const heroImages = Array.isArray(req.body.heroImages)
      ? req.body.heroImages.filter(Boolean).slice(0, 5)
      : [];
    const settings = await Setting.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { key: SETTINGS_KEY, heroImages: heroImages.length ? heroImages : defaultHeroImages },
      { upsert: true, new: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: "Failed to update carousel images" });
  }
});

router.post("/track-visit", async (req, res) => {
  try {
    const { visitorId, path = "/", userAgent = "" } = req.body;
    if (!visitorId) {
      return res.status(400).json({ message: "visitorId is required" });
    }

    await Visitor.findOneAndUpdate(
      { visitorId },
      {
        $set: { lastSeenAt: new Date(), path, userAgent },
        $setOnInsert: { firstSeenAt: new Date() },
        $inc: { visitCount: 1 }
      },
      { upsert: true, new: true }
    );

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to track visit" });
  }
});

router.post("/preorder-click", async (req, res) => {
  try {
    const { visitorId } = req.body;
    if (!visitorId) {
      return res.status(400).json({ message: "visitorId is required" });
    }

    await Visitor.findOneAndUpdate(
      { visitorId },
      {
        $set: {
          preOrderClicked: true,
          preOrderClickedAt: new Date(),
          lastSeenAt: new Date()
        },
        $setOnInsert: { firstSeenAt: new Date() }
      },
      { upsert: true, new: true }
    );

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to track preorder click" });
  }
});

router.get("/analytics", async (req, res) => {
  try {
    const [visitorRows, uniqueVisitors, customerRows, customerCount, products, carouselLikes, enquiryVisitors, enquiryCount, preorderClickCount, repeatVisitors] = await Promise.all([
      Visitor.find().sort({ lastSeenAt: -1 }).limit(8),
      Visitor.countDocuments(),
      Customer.find().sort({ createdAt: -1 }).limit(20),
      Customer.countDocuments(),
      Product.countDocuments(),
      HeroReaction.aggregate([
        { $group: { _id: "$imageUrl", likes: { $sum: 1 }, slideIndex: { $first: "$slideIndex" } } },
        { $sort: { slideIndex: 1 } }
      ]),
      Customer.distinct("visitorId", { source: "product-interest", visitorId: { $ne: "" } }),
      Customer.countDocuments({ source: "product-interest" }),
      Visitor.countDocuments({ preOrderClicked: true }),
      Visitor.countDocuments({ visitCount: { $gt: 1 } })
    ]);

    const totalVisitors = visitorRows.reduce((sum, row) => sum + row.visitCount, 0);
    const visitAggregate = await Visitor.aggregate([
      { $group: { _id: null, total: { $sum: "$visitCount" } } }
    ]);
    const allVisitorDurations = await Visitor.aggregate([
      {
        $project: {
          durationMs: {
            $max: [
              { $subtract: ["$lastSeenAt", "$firstSeenAt"] },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageDurationMs: { $avg: "$durationMs" }
        }
      }
    ]);

    const enquiryVisitorSet = new Set(enquiryVisitors);
    const latestCustomerByVisitor = new Map();
    customerRows.forEach(customer => {
      if (customer.visitorId && !latestCustomerByVisitor.has(customer.visitorId)) {
        latestCustomerByVisitor.set(customer.visitorId, customer);
      }
    });

    const recentVisitors = visitorRows.map(visitor => ({
      ...visitor.toObject(),
      durationMs: Math.max(0, new Date(visitor.lastSeenAt).getTime() - new Date(visitor.firstSeenAt).getTime()),
      enquirySent: enquiryVisitorSet.has(visitor.visitorId),
      preOrderClicked: Boolean(visitor.preOrderClicked),
      lead: latestCustomerByVisitor.has(visitor.visitorId)
        ? {
            name: latestCustomerByVisitor.get(visitor.visitorId).name || "",
            phone: latestCustomerByVisitor.get(visitor.visitorId).phone || "",
            email: latestCustomerByVisitor.get(visitor.visitorId).email || "",
            productName: latestCustomerByVisitor.get(visitor.visitorId).productName || "",
            selectedSize: latestCustomerByVisitor.get(visitor.visitorId).selectedSize || "",
            selectedQuantity: latestCustomerByVisitor.get(visitor.visitorId).selectedQuantity || 1
          }
        : null
    }));

    const preorderConversionRate = uniqueVisitors
      ? Math.round((preorderClickCount / uniqueVisitors) * 100)
      : 0;

    res.json({
      totals: {
        totalVisitors: visitAggregate[0]?.total || totalVisitors,
        uniqueVisitors,
        averageDurationMs: Math.round(allVisitorDurations[0]?.averageDurationMs || 0),
        preorderClicks: preorderClickCount,
        repeatVisitors,
        enquiryCount,
        customerCount,
        productCount: products,
        preorderConversionRate
      },
      recentVisitors,
      customers: customerRows,
      carouselLikes
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load analytics" });
  }
});

router.post("/carousel-like", async (req, res) => {
  try {
    const { visitorId, imageUrl, slideIndex } = req.body;
    if (!visitorId || !imageUrl) {
      return res.status(400).json({ message: "visitorId and imageUrl are required" });
    }

    const reaction = await HeroReaction.findOneAndUpdate(
      { visitorId, imageUrl },
      { visitorId, imageUrl, slideIndex: Number(slideIndex ?? 0) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(reaction);
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ ok: true, duplicate: true });
    }
    res.status(400).json({ message: "Failed to save carousel like" });
  }
});

router.post("/products/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    const operations = rows
      .map(normalizeImportProduct)
      .filter(product => product.name && product.image && product.price)
      .map(product => ({
        updateOne: {
          filter: { name: product.name },
          update: { $set: product },
          upsert: true
        }
      }));

    if (!operations.length) {
      return res.status(400).json({ message: "No valid product rows found" });
    }

    const result = await Product.bulkWrite(operations);
    res.json({
      message: "Products imported successfully",
      processed: operations.length,
      upserted: result.upsertedCount || 0,
      modified: result.modifiedCount || 0
    });
  } catch (error) {
    res.status(400).json({ message: "Failed to import products from Excel" });
  }
});

router.get("/customers", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Failed to load customers" });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const orders = await Customer.find({ source: "product-interest" }).sort({ createdAt: -1 });
    const totalOrders = orders.length;
    const totalUnits = orders.reduce((sum, order) => sum + Math.max(1, Number(order.selectedQuantity || 1)), 0);
    const uniqueCustomers = new Set(orders.map(order => order.phone).filter(Boolean)).size;
    const ordersToday = orders.filter(order => {
      const createdAt = new Date(order.createdAt);
      const now = new Date();
      return createdAt.getFullYear() === now.getFullYear()
        && createdAt.getMonth() === now.getMonth()
        && createdAt.getDate() === now.getDate();
    }).length;

    res.json({
      totals: {
        totalOrders,
        totalUnits,
        uniqueCustomers,
        ordersToday,
        lastUpdatedAt: new Date().toISOString()
      },
      orders
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load order details" });
  }
});

router.get("/export-all", async (req, res) => {
  try {
    const [products, visitors, customers, orders, heroLikes, productLikes, settings, visitorTotals] = await Promise.all([
      Product.find().sort({ priority: -1, createdAt: -1, _id: -1 }).lean(),
      Visitor.find().sort({ lastSeenAt: -1 }).lean(),
      Customer.find().sort({ createdAt: -1 }).lean(),
      Customer.find({ source: "product-interest" }).sort({ createdAt: -1 }).lean(),
      HeroReaction.find().sort({ createdAt: -1 }).lean(),
      ProductReaction.find().sort({ createdAt: -1 }).lean(),
      getSettings(),
      Visitor.aggregate([
        {
          $group: {
            _id: null,
            totalVisits: { $sum: "$visitCount" },
            uniqueVisitors: { $sum: 1 },
            averageDurationMs: {
              $avg: {
                $max: [
                  { $subtract: ["$lastSeenAt", "$firstSeenAt"] },
                  0
                ]
              }
            },
            preorderClicks: {
              $sum: {
                $cond: [{ $eq: ["$preOrderClicked", true] }, 1, 0]
              }
            },
            repeatVisitors: {
              $sum: {
                $cond: [{ $gt: ["$visitCount", 1] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    const likeCountByProductId = productLikes.reduce((map, reaction) => {
      const key = String(reaction.productId || "");
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map());

    const workbook = XLSX.utils.book_new();
    const totals = visitorTotals[0] || {};
    const summaryRows = [
      { metric: "Generated At", value: new Date().toISOString() },
      { metric: "Total Visits", value: totals.totalVisits || 0 },
      { metric: "Unique Visitors", value: totals.uniqueVisitors || 0 },
      { metric: "Average Duration (ms)", value: Math.round(totals.averageDurationMs || 0) },
      { metric: "Preorder Clicks", value: totals.preorderClicks || 0 },
      { metric: "Repeat Visitors", value: totals.repeatVisitors || 0 },
      { metric: "Customers / Enquiries", value: customers.length },
      { metric: "Product Interest Orders", value: orders.length },
      { metric: "Hero Likes", value: heroLikes.length },
      { metric: "Product Likes", value: productLikes.length },
      { metric: "Products", value: products.length }
    ];

    const productRows = products.map(product => ({
      id: String(product._id),
      name: product.name || "",
      category: product.category || "",
      gender: product.gender || "",
      price: Number(product.price || 0),
      priority: Number(product.priority || 0),
      remainingStock: Number(product.remainingStock || 0),
      totalStock: Number(product.totalStock || 100),
      likes: likeCountByProductId.get(String(product._id)) || 0,
      sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : "",
      fit: product.fit || "",
      featured: Boolean(product.featured),
      addedBy: product.addedBy || "",
      listingImage: product.listingImage || product.image || "",
      createdAt: product.createdAt || "",
      updatedAt: product.updatedAt || ""
    }));

    const visitorRows = visitors.map(visitor => ({
      visitorId: visitor.visitorId || "",
      path: visitor.path || "",
      visitCount: Number(visitor.visitCount || 0),
      firstSeenAt: visitor.firstSeenAt || "",
      lastSeenAt: visitor.lastSeenAt || "",
      durationMs: Math.max(0, new Date(visitor.lastSeenAt).getTime() - new Date(visitor.firstSeenAt).getTime()),
      preOrderClicked: Boolean(visitor.preOrderClicked),
      preOrderClickedAt: visitor.preOrderClickedAt || "",
      userAgent: visitor.userAgent || ""
    }));

    const customerRows = customers.map(customer => ({
      id: String(customer._id),
      source: customer.source || "",
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      city: customer.city || "",
      pincode: customer.pincode || "",
      visitorId: customer.visitorId || "",
      productId: customer.productId || "",
      productName: customer.productName || "",
      productPrice: Number(customer.productPrice || 0),
      productImage: customer.productImage || "",
      selectedSize: customer.selectedSize || "",
      selectedQuantity: Number(customer.selectedQuantity || 0),
      selectedVariant: customer.selectedVariant || "",
      notes: customer.notes || "",
      createdAt: customer.createdAt || ""
    }));

    const orderRows = orders.map(order => ({
      id: String(order._id),
      createdAt: order.createdAt || "",
      name: order.name || "",
      phone: order.phone || "",
      email: order.email || "",
      city: order.city || "",
      pincode: order.pincode || "",
      visitorId: order.visitorId || "",
      productId: order.productId || "",
      productName: order.productName || "",
      productPrice: Number(order.productPrice || 0),
      selectedSize: order.selectedSize || "",
      selectedQuantity: Number(order.selectedQuantity || 0),
      selectedVariant: order.selectedVariant || "",
      notes: order.notes || ""
    }));

    const heroLikeRows = heroLikes.map(reaction => ({
      id: String(reaction._id),
      visitorId: reaction.visitorId || "",
      imageUrl: reaction.imageUrl || "",
      slideIndex: Number(reaction.slideIndex || 0),
      createdAt: reaction.createdAt || ""
    }));

    const productLikeRows = productLikes.map(reaction => ({
      id: String(reaction._id),
      visitorId: reaction.visitorId || "",
      productId: reaction.productId || "",
      createdAt: reaction.createdAt || ""
    }));

    const settingsRows = [
      {
        key: settings.key || SETTINGS_KEY,
        heroImage1: settings.heroImages?.[0] || "",
        heroImage2: settings.heroImages?.[1] || "",
        heroImage3: settings.heroImages?.[2] || "",
        heroImage4: settings.heroImages?.[3] || "",
        heroImage5: settings.heroImages?.[4] || ""
      }
    ];

    [
      ["Overview", summaryRows],
      ["Products", productRows],
      ["Visitors", visitorRows],
      ["Enquiries", customerRows],
      ["Orders", orderRows],
      ["HeroLikes", heroLikeRows],
      ["ProductLikes", productLikeRows],
      ["Settings", settingsRows]
    ].forEach(([name, rows]) => {
      const sheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, sheet, name);
    });

    const workbookBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const fileName = `fewco-admin-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(workbookBuffer);
  } catch (error) {
    res.status(500).json({ message: "Failed to export admin data" });
  }
});

router.post("/customers", async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || (!phone && !email)) {
      return res.status(400).json({ message: "Name and phone or email are required" });
    }

    const source = req.body.source || "waitlist";
    let customer;

    if (source === "product-interest" && req.body.productId) {
      const quantity = Math.max(1, Number(req.body.selectedQuantity || 1));
      const product = await Product.findOneAndUpdate(
        { _id: req.body.productId, remainingStock: { $gte: quantity } },
        { $inc: { remainingStock: -quantity } },
        { new: true }
      );

      if (!product) {
        return res.status(400).json({ message: "This product no longer has enough stock for that enquiry." });
      }

      customer = await Customer.create({
        ...req.body,
        source,
        productName: req.body.productName || product.name,
        productImage: req.body.productImage || product.image || product.images?.[0] || "",
        productPrice: Number(req.body.productPrice || product.price || 0),
        selectedQuantity: quantity
      });
    } else if (source === "footer-feedback") {
      customer = await Customer.create({
        ...req.body,
        source,
        phone: req.body.phone || "",
        email: req.body.email || "",
        notes: req.body.notes || ""
      });
    } else {
      customer = await Customer.findOneAndUpdate(
        { phone: phone || `email:${email}` },
        { ...req.body, source },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: "Failed to save customer" });
  }
});

export default router;
