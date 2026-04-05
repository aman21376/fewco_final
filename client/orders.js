const ADMIN_API_URL = "/api/admin";
const statusText = document.getElementById("ordersStatus");
const refreshButton = document.getElementById("refreshOrdersButton");
const POLL_INTERVAL_MS = 10000;

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN");
}

function setStatus(message) {
  statusText.textContent = message;
}

function renderOrders(data) {
  document.getElementById("ordersTotal").textContent = data.totals?.totalOrders || data.totals?.enquiryCount || 0;
  document.getElementById("unitsTotal").textContent = data.totals?.totalUnits || 0;
  document.getElementById("uniqueCustomers").textContent = data.totals?.uniqueCustomers || 0;
  document.getElementById("ordersToday").textContent = data.totals?.ordersToday || 0;
  document.getElementById("lastUpdatedAt").textContent = formatDate(data.totals?.lastUpdatedAt);

  const container = document.getElementById("ordersList");
  const orders = data.orders || [];

  if (!orders.length) {
    container.innerHTML = `<div class="empty-state">No product enquiries yet.</div>`;
    return;
  }

  container.innerHTML = orders.map(order => `
    <article class="order-card">
      <div class="order-card-media" style="background-image:url('${order.productImage || ""}')"></div>
      <div class="order-card-body">
        <div class="order-card-head">
          <div>
            <p class="eyebrow">Product</p>
            <h3>${order.productName || "FewCo Piece"}</h3>
          </div>
          <span class="badge">${order.selectedSize || "-"} · Qty ${order.selectedQuantity || 1}</span>
        </div>
        <div class="order-grid">
          <div class="order-block">
            <p class="eyebrow">Customer</p>
            <p class="product-copy"><strong>${order.name || "-"}</strong></p>
            <p class="product-copy">${order.phone || "-"}</p>
            <p class="product-copy">${order.email || "-"}</p>
          </div>
          <div class="order-block">
            <p class="eyebrow">Location</p>
            <p class="product-copy">${order.city || "-"}</p>
            <p class="product-copy">${order.pincode || "-"}</p>
            <p class="product-copy">Visitor: ${order.visitorId || "-"}</p>
          </div>
          <div class="order-block">
            <p class="eyebrow">Selection</p>
            <p class="product-copy">Variant: ${order.selectedVariant || "-"}</p>
            <p class="product-copy">Price: ${order.productPrice ? `₹${Number(order.productPrice).toLocaleString("en-IN")}` : "-"}</p>
            <p class="product-copy">${order.notes || "-"}</p>
          </div>
          <div class="order-block">
            <p class="eyebrow">Saved</p>
            <p class="product-copy">${formatDate(order.createdAt)}</p>
            <p class="product-copy">Source: ${order.source || "-"}</p>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

async function loadOrders(showStatus = true) {
  if (showStatus) setStatus("Refreshing order details...");
  const response = await fetch(`${ADMIN_API_URL}/orders`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Unable to load order details");
  }
  renderOrders(data);
  setStatus(`Live dashboard updated at ${new Date().toLocaleTimeString("en-IN")}.`);
}

refreshButton?.addEventListener("click", () => {
  loadOrders().catch(error => setStatus(error.message || "Unable to refresh order details."));
});

loadOrders().catch(error => setStatus(error.message || "Unable to load order details."));
setInterval(() => {
  loadOrders(false).catch(() => {
    setStatus("Unable to auto-refresh right now.");
  });
}, POLL_INTERVAL_MS);
