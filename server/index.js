import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { Buffer } from "buffer";
import { fileURLToPath } from "url";
import productRoutes from "./models/routes/productRoutes.js";
import adminRoutes from "./models/routes/adminRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, "../client");

dotenv.config({ path: path.resolve(__dirname, "./models/.env") });

const app = express();
const port = process.env.PORT || 5000;
let mongoConnectionPromise = null;

function requireAdminAuth(req, res, next) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return next();
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="FewCo Admin"');
    return res.status(401).send("Authentication required");
  }

  const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  const providedUsername = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : "";
  const providedPassword = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : "";

  if (providedUsername !== username || providedPassword !== password) {
    res.set("WWW-Authenticate", 'Basic realm="FewCo Admin"');
    return res.status(401).send("Invalid credentials");
  }

  return next();
}

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get(["/admin.html", "/admin-product.html", "/orders.html"], requireAdminAuth, (req, res) => {
  res.sendFile(path.join(clientDir, req.path.slice(1)));
});

app.get(["/admin.js", "/admin-product.js", "/orders.js"], requireAdminAuth, (req, res) => {
  res.sendFile(path.join(clientDir, req.path.slice(1)));
});

app.use(express.static(clientDir));

app.use("/api/products", productRoutes);
app.use("/api/admin", requireAdminAuth, adminRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

export async function ensureMongoConnection() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(process.env.MONGO_URI)
      .then(connection => {
        console.log("MongoDB Connected");
        return connection;
      })
      .catch(error => {
        mongoConnectionPromise = null;
        console.log("MongoDB connection error:", error.message);
        throw error;
      });
  }
  return mongoConnectionPromise;
}

export default app;

const isRunningOnVercel = Boolean(process.env.VERCEL);

if (!isRunningOnVercel) {
  ensureMongoConnection().catch(() => {});
  app.listen(port, () => console.log(`Server running on ${port}`));
}
