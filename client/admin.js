const PRODUCT_API_URL = "/api/products";
const ADMIN_API_URL = "/api/admin";

const statusText = document.getElementById("adminStatus");
const carouselFolderStatus = document.getElementById("carouselFolderStatus");
const form = document.getElementById("adminForm");
const carouselForm = document.getElementById("carouselForm");
const importForm = document.getElementById("importForm");
const resetButton = document.getElementById("resetProductForm");
const deleteAllProductsButton = document.getElementById("deleteAllProductsButton");

let products = [];

function setStatus(message) {
  statusText.textContent = message;
}

function parseSizes(value) {
  return value.split(",").map(size => size.trim()).filter(Boolean);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN");
}

function formatDuration(durationMs = 0) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function getProductPayload() {
  const images = [
    document.getElementById("image").value.trim(),
    document.getElementById("image2").value.trim(),
    document.getElementById("image3").value.trim(),
    document.getElementById("image4").value.trim()
  ].filter(Boolean);

  const remainingStock = Number(document.getElementById("remaining").value);

  return {
    name: document.getElementById("name").value.trim(),
    price: Number(document.getElementById("price").value),
    category: document.getElementById("category").value,
    gender: document.getElementById("gender").value,
    sizes: parseSizes(document.getElementById("sizes").value),
    addedBy: document.getElementById("addedBy").value.trim(),
    priority: Number(document.getElementById("priority").value) || 0,
    fit: document.getElementById("fit").value,
    description: document.getElementById("description").value.trim(),
    details: document.getElementById("details").value.trim(),
    story: document.getElementById("story").value.trim(),
    fabricCare: document.getElementById("fabricCare").value.trim(),
    shipping: document.getElementById("shipping").value.trim(),
    image: images[0] || "",
    images,
    listingImage: document.getElementById("listingImage").value.trim() || images[0] || "",
    totalStock: 100,
    remainingStock,
    featured: document.getElementById("featured").checked
  };
}

function resetForm() {
  form.reset();
  document.getElementById("productId").value = "";
  document.getElementById("remaining").value = 100;
  document.getElementById("priority").value = 0;
  document.getElementById("listingImage").value = "";
  document.getElementById("submitProductButton").textContent = "Save Product";
}

function fillProductForm(product) {
  document.getElementById("productId").value = product._id;
  document.getElementById("name").value = product.name || "";
  document.getElementById("price").value = product.price || "";
  document.getElementById("category").value = product.category || product.gender || "men";
  document.getElementById("gender").value = product.gender || "men";
  document.getElementById("sizes").value = Array.isArray(product.sizes) ? product.sizes.join(",") : "";
  document.getElementById("addedBy").value = product.addedBy || "";
  document.getElementById("priority").value = product.priority ?? 0;
  document.getElementById("fit").value = product.fit || "Relaxed";
  document.getElementById("description").value = product.description || "";
  document.getElementById("details").value = product.details || "";
  document.getElementById("story").value = product.story || "";
  document.getElementById("fabricCare").value = product.fabricCare || "";
  document.getElementById("shipping").value = product.shipping || "";
  document.getElementById("image").value = product.images?.[0] || product.image || "";
  document.getElementById("image2").value = product.images?.[1] || "";
  document.getElementById("image3").value = product.images?.[2] || "";
  document.getElementById("image4").value = product.images?.[3] || "";
  document.getElementById("listingImage").value = product.listingImage || product.image || "";
  document.getElementById("remaining").value = product.remainingStock || 100;
  document.getElementById("featured").checked = Boolean(product.featured);
  document.getElementById("submitProductButton").textContent = "Update Product";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProductList() {
  const container = document.getElementById("productAdminList");
  if (!products.length) {
    container.innerHTML = `<div class="empty-state">No products yet.</div>`;
    return;
  }

  container.innerHTML = products.map(product => `
    <article class="admin-product-card">
      <div class="admin-product-thumb" style="background-image:url('${product.listingImage || product.image || product.images?.[0] || ""}')"></div>
      <div class="admin-product-copy">
        <p class="eyebrow">${product.category || product.gender || "drop piece"}</p>
        <h4>${product.name}</h4>
        <p class="product-copy">₹${Number(product.price || 0).toLocaleString("en-IN")}</p>
        <p class="product-copy">Priority ${product.priority || 0} · ${product.remainingStock || 0}/${product.totalStock || 100} stock</p>
      </div>
      <div class="admin-product-actions">
        <button class="button button-secondary" data-edit-product="${product._id}">Edit</button>
        <a class="button button-secondary" href="/admin-product.html?product=${product._id}">Open Editor</a>
        <button class="button button-danger" data-delete-product="${product._id}">Delete</button>
      </div>
    </article>
  `).join("");
}

function renderAnalytics(data) {
  document.getElementById("totalVisitors").textContent = data.totals?.totalVisitors || 0;
  document.getElementById("uniqueVisitors").textContent = data.totals?.uniqueVisitors || 0;
  document.getElementById("customerCount").textContent = formatDuration(data.totals?.averageDurationMs || 0);
  document.getElementById("productCount").textContent = data.totals?.preorderClicks || 0;
  document.getElementById("repeatVisitors").textContent = data.totals?.repeatVisitors || 0;
  document.getElementById("preorderRate").textContent = `${data.totals?.preorderConversionRate || 0}%`;

  document.getElementById("visitorTableBody").innerHTML = (data.recentVisitors || []).map(visitor => `
    <tr>
      <td>${visitor.visitorId}</td>
      <td>${visitor.lead ? `${visitor.lead.name || "-"}<br>${visitor.lead.phone || visitor.lead.email || "-"}` : "-"}</td>
      <td>${visitor.visitCount}</td>
      <td>${formatDuration(visitor.durationMs || 0)}</td>
      <td>${visitor.lead?.productName ? `${visitor.lead.productName}<br>${visitor.lead.selectedSize || "-"} / ${visitor.lead.selectedQuantity || 1}` : "-"}</td>
      <td>${visitor.preOrderClicked ? "Yes" : "No"}</td>
      <td>${visitor.enquirySent ? "Yes" : "No"}</td>
      <td>${formatDate(visitor.lastSeenAt)}</td>
    </tr>
  `).join("") || `<tr><td colspan="8">No visitor data yet.</td></tr>`;

  document.getElementById("customerTableBody").innerHTML = (data.customers || []).map(customer => `
    <tr>
      <td>${customer.productImage ? `<div class="table-product-image" style="background-image:url('${customer.productImage}')"></div>` : "-"}</td>
      <td>${customer.name || "-"}</td>
      <td>${customer.phone || "-"}</td>
      <td>${customer.productName || "-"}</td>
      <td>${customer.selectedSize || "-"} / ${customer.selectedQuantity || 1}</td>
      <td>${customer.selectedVariant || "-"}</td>
      <td>${customer.productPrice ? `₹${Number(customer.productPrice).toLocaleString("en-IN")}` : "-"}</td>
      <td>${customer.email || "-"}</td>
      <td>${[customer.city || "-", customer.pincode || "-"].join(" / ")}</td>
      <td>${formatDate(customer.createdAt)}</td>
    </tr>
  `).join("") || `<tr><td colspan="10">No customer data yet.</td></tr>`;
}

async function loadProducts() {
  const response = await fetch(PRODUCT_API_URL);
  products = await response.json();
  renderProductList();
}

async function loadSettings() {
  const response = await fetch(`${ADMIN_API_URL}/settings`);
  const settings = await response.json();
  if (carouselFolderStatus) {
    const localCount = settings.localHeroImages?.length || 0;
    carouselFolderStatus.textContent = localCount
      ? `Local carousel folder active: ${localCount} image${localCount === 1 ? "" : "s"} found in client/assets/carousel`
      : "Local carousel folder is empty. URL fields below are being used.";
  }
  (settings.heroImages || []).slice(0, 5).forEach((image, index) => {
    const input = document.getElementById(`carousel${index + 1}`);
    if (input) input.value = image;
  });
}

async function loadAnalytics() {
  const response = await fetch(`${ADMIN_API_URL}/analytics`);
  const data = await response.json();
  renderAnalytics(data);
}

async function saveProduct(event) {
  event.preventDefault();
  const payload = getProductPayload();
  const productId = document.getElementById("productId").value;
  const method = productId ? "PUT" : "POST";
  const url = productId ? `${PRODUCT_API_URL}/${productId}` : PRODUCT_API_URL;

  setStatus(productId ? "Updating product..." : "Publishing product...");

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Unable to save product");

    resetForm();
    await Promise.all([loadProducts(), loadAnalytics()]);
    setStatus(productId ? "Product updated." : "Product added to the drop.");
  } catch (error) {
    setStatus("Unable to save product right now.");
  }
}

async function saveCarousel(event) {
  event.preventDefault();
  const heroImages = [1, 2, 3, 4, 5].map(index => document.getElementById(`carousel${index}`).value.trim()).filter(Boolean);
  setStatus("Saving carousel images...");

  try {
    const response = await fetch(`${ADMIN_API_URL}/settings/carousel`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heroImages })
    });
    if (!response.ok) throw new Error("Unable to save carousel");
    setStatus("Carousel updated.");
  } catch (error) {
    setStatus("Unable to update carousel right now.");
  }
}

async function importProducts(event) {
  event.preventDefault();
  const fileInput = document.getElementById("importFile");
  const file = fileInput?.files?.[0];

  if (!file) {
    setStatus("Choose an Excel file first.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  setStatus("Importing products from Excel...");

  try {
    const response = await fetch(`${ADMIN_API_URL}/products/import`, {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Import failed");

    importForm.reset();
    await Promise.all([loadProducts(), loadAnalytics()]);
    setStatus(`Import complete. Processed ${data.processed} rows.`);
  } catch (error) {
    setStatus(error.message || "Unable to import products right now.");
  }
}

async function deleteProduct(productId) {
  const product = products.find(item => item._id === productId);
  if (!product) return;

  const confirmed = window.confirm(`Delete "${product.name}"? This cannot be undone.`);
  if (!confirmed) return;

  setStatus("Deleting product...");

  try {
    const response = await fetch(`${PRODUCT_API_URL}/${productId}`, {
      method: "DELETE"
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to delete product");

    if (document.getElementById("productId").value === productId) {
      resetForm();
    }

    await Promise.all([loadProducts(), loadAnalytics()]);
    setStatus("Product deleted.");
  } catch (error) {
    setStatus(error.message || "Unable to delete product right now.");
  }
}

async function deleteAllProducts() {
  if (!products.length) {
    setStatus("There are no products to delete.");
    return;
  }

  const confirmed = window.confirm("Delete all product listings? This will remove every existing product and cannot be undone.");
  if (!confirmed) return;

  setStatus("Deleting all products...");

  try {
    const response = await fetch(PRODUCT_API_URL, {
      method: "DELETE"
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to delete all products");

    resetForm();
    await Promise.all([loadProducts(), loadAnalytics()]);
    setStatus(`Deleted ${data.deletedCount || 0} product listings.`);
  } catch (error) {
    setStatus(error.message || "Unable to delete all products right now.");
  }
}

function bindEvents() {
  form?.addEventListener("submit", saveProduct);
  carouselForm?.addEventListener("submit", saveCarousel);
  importForm?.addEventListener("submit", importProducts);
  resetButton?.addEventListener("click", resetForm);
  deleteAllProductsButton?.addEventListener("click", deleteAllProducts);

  document.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-product]");
    const deleteButton = event.target.closest("[data-delete-product]");

    if (editButton) {
      const product = products.find(item => item._id === editButton.dataset.editProduct);
      if (product) fillProductForm(product);
      return;
    }

    if (deleteButton) {
      deleteProduct(deleteButton.dataset.deleteProduct);
    }
  });
}

async function init() {
  bindEvents();
  resetForm();
  setStatus("Loading admin data...");
  try {
    await Promise.all([loadProducts(), loadSettings(), loadAnalytics()]);
    setStatus("Dashboard ready.");
  } catch (error) {
    setStatus("Some admin data failed to load.");
  }
}

init();
