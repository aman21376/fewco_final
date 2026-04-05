const PRODUCT_API_URL = "/api/products";
const ADMIN_API_URL = "/api/admin";

const fallbackHeroImages = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80"
];

let heroImages = [...fallbackHeroImages];
let allProducts = [];
let shopMode = "common";
let selectedProductId = null;
let selectedSize = "M";
let selectedQuantity = 1;
let selectedTab = "details";
let selectedImageIndex = 0;
let heroIndex = 0;
let heroTimer = null;
let currentVisitorId = "";
let hasTrackedPreorderClick = false;
const isProductPage = window.location.pathname.toLowerCase().endsWith("/product.html") || window.location.pathname.toLowerCase().endsWith("product.html");
const instagramProfileUrl = "https://www.instagram.com/fewco.in?igsh=MWxnZ3F2d2trd28zNA%3D%3D&utm_source=qr";
const productScrollKey = "fewco-product-scroll";
let detailFormState = {
  name: "",
  phone: "",
  email: "",
  city: "",
  pincode: ""
};
let detailSuccessState = null;

function captureDetailFormState() {
  const form = document.getElementById("productInterestForm");
  if (!form) return;
  detailFormState = {
    name: form.elements.name?.value || "",
    phone: form.elements.phone?.value || "",
    email: form.elements.email?.value || "",
    city: form.elements.city?.value || "",
    pincode: form.elements.pincode?.value || ""
  };
}

function injectImageStyles(id, selector, images) {
  document.querySelector(`style[data-dynamic-style="${id}"]`)?.remove();
  const style = document.createElement("style");
  style.dataset.dynamicStyle = id;
  style.textContent = images.map((image, index) => `${selector}:nth-child(${index + 1})::before { background-image: url('${image}'); }`).join("\n");
  if (id === "detail-main-image" && images[0]) {
    style.textContent = `#productDetail .detail-main-image::before { background-image: url('${images[0]}'); }`;
  }
  document.head.appendChild(style);
}

function capitalize(value = "") {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function deriveCategory(product) {
  if (product.category) return product.category.toLowerCase();
  const source = `${product.gender || ""} ${product.name || ""}`.toLowerCase();
  if ((product.gender || "").toLowerCase() === "women") return "women";
  return "men";
}

function normalizeSizes(sizes, category) {
  if (Array.isArray(sizes) && sizes.length) return sizes;
  return ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
}

function buildProduct(product, index) {
  const category = deriveCategory(product);
  const totalStock = 100;
  const remainingStock = Math.max(0, Number(product.remainingStock) || totalStock);
  const remainingRatio = Math.max(0, Math.min(100, (remainingStock / totalStock) * 100));
  const images = (Array.isArray(product.images) ? product.images.filter(Boolean) : []).slice(0, 4);
  const normalizedImages = (images.length ? images : [product.image]).filter(Boolean);
  const listingImage = product.listingImage || product.image || normalizedImages[0];

  return {
    id: product._id || `${product.name}-${index}`,
    name: product.name || "FewCo Piece",
    price: Number(product.price) || 0,
    image: listingImage,
    mainImage: product.image || normalizedImages[0],
    images: normalizedImages,
    listingImage,
    priority: Number(product.priority || 0),
    gender: (product.gender || "men").toLowerCase(),
    category,
    sizes: normalizeSizes(product.sizes, category),
    fit: product.fit || "Relaxed",
    description: product.description || "Limited-edition FewCo release.",
    details: product.details || "Premium release with small-batch production and collectible intent.",
    story: product.story || `${product.name || "This piece"} was designed around contrast, restraint, and deliberate rarity.`,
    fabricCare: product.fabricCare || "Cold wash inside out. Dry flat and steam lightly.",
    shipping: product.shipping || "Dispatch begins within 48 hours. Exchange only for size issues, subject to stock availability in this limited-edition drop.",
    totalStock,
    remainingStock,
    remainingRatio,
    lowStock: remainingStock > 0 && remainingStock <= 25,
    soldOut: remainingStock <= 0,
    dropLabel: `Drop ${String(7 - (index % 4)).padStart(2, "0")}`
  };
}

function getFallbackProducts() {
  return [
    {
      _id: "fallback-1",
      name: "Onyx Layered Tee",
      price: 2490,
      gender: "men",
      category: "men",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80"
      ],
      description: "Boxy premium tee with layered hem construction.",
      details: "Small-batch tee with structured shoulders and tonal embroidery.",
      story: "Built for quiet statement dressing across the full drop.",
      totalStock: 100,
      remainingStock: 42,
      sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
      fit: "Boxy"
    },
    {
      _id: "fallback-2",
      name: "Midnight Pleated Kurti",
      price: 3290,
      gender: "women",
      category: "women",
      image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?auto=format&fit=crop&w=1200&q=80"
      ],
      description: "Pleated limited kurti with fluid movement.",
      details: "Clean placket, tonal finish, and shaped sleeve volume.",
      story: "A darker ceremonial silhouette for the FewCo archive line.",
      totalStock: 100,
      remainingStock: 18,
      sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
      fit: "Tailored"
    }
  ];
}

async function bootstrap() {
  await Promise.all([loadProducts(), loadSettings(), trackVisit()]);
  renderAll();
  if (isProductPage && sessionStorage.getItem(productScrollKey) === "detail") {
    sessionStorage.removeItem(productScrollKey);
    window.setTimeout(() => {
      document.getElementById("product")?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 60);
  }
}

async function loadProducts() {
  try {
    const response = await fetch(PRODUCT_API_URL);
    if (!response.ok) throw new Error("Request failed");
    const data = await response.json();
    allProducts = (Array.isArray(data) && data.length ? data : getFallbackProducts())
      .map(buildProduct)
      .sort((left, right) => {
        if ((right.priority || 0) !== (left.priority || 0)) return (right.priority || 0) - (left.priority || 0);
        return right.price - left.price;
      });
  } catch (error) {
    allProducts = getFallbackProducts()
      .map(buildProduct)
      .sort((left, right) => (right.priority || 0) - (left.priority || 0));
  }

  const requestedProductId = new URLSearchParams(window.location.search).get("product");
  selectedProductId = allProducts.find(item => item.id === requestedProductId)?.id || allProducts[0]?.id || null;
}

async function loadSettings() {
  try {
    const response = await fetch(`${ADMIN_API_URL}/settings`);
    if (!response.ok) throw new Error("Request failed");
    const data = await response.json();
    if (Array.isArray(data.localHeroImages) && data.localHeroImages.length) {
      heroImages = data.localHeroImages;
      return;
    }
    if (Array.isArray(data.heroImages) && data.heroImages.length) {
      heroImages = data.heroImages;
    }
  } catch (error) {
    heroImages = [...fallbackHeroImages];
  }
}

async function trackVisit() {
  const key = "fewco-visitor-id";
  currentVisitorId = localStorage.getItem(key);
  if (!currentVisitorId) {
    currentVisitorId = `visitor-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
    localStorage.setItem(key, currentVisitorId);
  }

  try {
    await fetch(`${ADMIN_API_URL}/track-visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: currentVisitorId,
        path: window.location.pathname,
        userAgent: navigator.userAgent
      })
    });
  } catch (error) {
    // Non-blocking analytics call.
  }
}

async function trackPreorderClick() {
  if (!currentVisitorId || hasTrackedPreorderClick) return;
  hasTrackedPreorderClick = true;

  try {
    await fetch(`${ADMIN_API_URL}/preorder-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: currentVisitorId })
    });
  } catch (error) {
    hasTrackedPreorderClick = false;
  }
}

function renderHero() {
  const carousel = document.getElementById("heroCarousel");
  if (!carousel) return;
  carousel.querySelectorAll(".hero-slide").forEach(slide => slide.remove());
  heroImages.forEach((image, index) => {
    const slide = document.createElement("div");
    slide.className = `hero-slide${index === heroIndex ? " active" : ""}`;
    slide.style.backgroundImage = `url('${image}')`;
    carousel.prepend(slide);
  });
  document.getElementById("heroDots").innerHTML = heroImages.map((_, index) => `
    <button class="hero-dot ${index === heroIndex ? "active" : ""}" data-hero-dot="${index}" aria-label="Go to slide ${index + 1}"></button>
  `).join("");
  const likeStatus = document.getElementById("heroLikeStatus");
  if (likeStatus) likeStatus.textContent = "";
}

function getModeFilteredProducts() {
  if (shopMode === "male") return allProducts.filter(product => product.gender === "men");
  if (shopMode === "female") return allProducts.filter(product => product.gender === "women");
  return allProducts;
}

function renderProductCards(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!products.length) {
    container.innerHTML = `<div class="empty-state">No pieces match this filter right now.</div>`;
    return;
  }

  container.innerHTML = products.map(product => `
    <article class="product-card" data-view-product="${product.id}" tabindex="0">
      <div class="product-image" style="--card-image:url('${product.image}')">
        <div class="image-stock-badge ${product.lowStock ? "low" : ""} ${product.soldOut ? "soldout" : ""}">
          ${product.soldOut ? "Sold Out" : `${product.remainingStock} / 100 remaining`}
        </div>
      </div>
      <div class="product-body">
        <div class="product-topline">
          <span class="badge ${product.soldOut ? "soldout" : ""}">${product.soldOut ? "Sold Out" : "Limited Edition"}</span>
          <span class="tag">${capitalize(product.category)}</span>
        </div>
        <h3>${product.name}</h3>
        <p class="price">₹${product.price.toLocaleString("en-IN")}</p>
        <div class="card-actions">
          <button class="button button-secondary card-cta-button" data-view-product="${product.id}">Pre Order Now</button>
        </div>
      </div>
    </article>
  `).join("");
}

function getShopProducts() {
  let filtered = getModeFilteredProducts();

  const size = document.getElementById("sizeFilter")?.value || "all";
  const availability = document.getElementById("availabilityFilter")?.value || "all";
  const sort = document.getElementById("sortFilter")?.value || "newest";

  if (size !== "all") filtered = filtered.filter(product => product.sizes.includes(size));
  if (availability === "low") filtered = filtered.filter(product => product.lowStock);
  if (availability === "in") filtered = filtered.filter(product => !product.soldOut);
  if (availability === "out") filtered = filtered.filter(product => product.soldOut);
  if (sort === "lowstock") filtered = filtered.slice().sort((a, b) => a.remainingStock - b.remainingStock);
  if (sort === "priceasc") filtered = filtered.slice().sort((a, b) => a.price - b.price);
  return filtered;
}

function renderShopModeToggle() {
  const container = document.getElementById("shopModeToggle");
  if (!container) return;
  container.innerHTML = [
    { key: "common", label: "Common" },
    { key: "male", label: "Male" },
    { key: "female", label: "Female" }
  ].map(item => `
    <button class="toggle-pill ${shopMode === item.key ? "active" : ""}" data-shop-mode="${item.key}">
      ${item.label}
    </button>
  `).join("");
}

function getIndianSizeChart(product) {
  const isWomen = product.gender === "women" || product.category === "women";
  const chart = isWomen
    ? [
        { size: "XS", bust: "32", waist: "26", hip: "34" },
        { size: "S", bust: "34", waist: "28", hip: "36" },
        { size: "M", bust: "36", waist: "30", hip: "38" },
        { size: "L", bust: "38", waist: "32", hip: "40" },
        { size: "XL", bust: "40", waist: "34", hip: "42" },
        { size: "XXL", bust: "42", waist: "36", hip: "44" },
        { size: "3XL", bust: "44", waist: "38", hip: "46" }
      ]
    : [
        { size: "S", chest: "38", waist: "32", shoulder: "17" },
        { size: "M", chest: "40", waist: "34", shoulder: "17.5" },
        { size: "L", chest: "42", waist: "36", shoulder: "18" },
        { size: "XL", chest: "44", waist: "38", shoulder: "18.5" },
        { size: "XXL", chest: "46", waist: "40", shoulder: "19" },
        { size: "3XL", chest: "48", waist: "42", shoulder: "19.5" }
      ];

  const availableSizes = new Set(product.sizes);
  const visibleRows = chart.filter(row => availableSizes.has(row.size));
  const rows = visibleRows.length ? visibleRows : chart;

  if (isWomen) {
    return `
      <div class="size-guide">
        <p class="size-guide-copy">Indian women size chart in inches. Match your closest body measurements for the best fit.</p>
        <div class="size-table-wrap">
          <table class="size-table">
            <thead>
              <tr>
                <th>Size</th>
                <th>Bust</th>
                <th>Waist</th>
                <th>Hip</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  <td>${row.size}</td>
                  <td>${row.bust}</td>
                  <td>${row.waist}</td>
                  <td>${row.hip}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        <p class="size-guide-note">Fit: ${product.fit}. If you are between sizes, choose the larger size for a more relaxed feel.</p>
      </div>
    `;
  }

  return `
    <div class="size-guide">
      <p class="size-guide-copy">Indian men size chart in inches. Compare your body measurements to pick the right size.</p>
      <div class="size-table-wrap">
        <table class="size-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>Chest</th>
              <th>Waist</th>
              <th>Shoulder</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td>${row.size}</td>
                <td>${row.chest}</td>
                <td>${row.waist}</td>
                <td>${row.shoulder}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <p class="size-guide-note">Fit: ${product.fit}. If you want an easier fit, go one size up.</p>
    </div>
  `;
}

function getProductTabContent(product) {
  return {
    details: product.details,
    care: product.fabricCare,
    shipping: `
      <div class="policy-copy">
        <p>${product.shipping}</p>
        <p><strong>Exchange policy:</strong> This collection is exchange only. Since FewCo is a limited-edition drop, returns are not available, and size exchanges can be offered only if the required size is still in stock.</p>
      </div>
    `,
    sizing: getIndianSizeChart(product)
  };
}

function renderProductDetail() {
  const container = document.getElementById("productDetail");
  const product = allProducts.find(item => item.id === selectedProductId) || allProducts[0];
  if (!container) return;
  if (!product) {
    container.innerHTML = `<div class="empty-state">Product detail will appear here once a piece is available.</div>`;
    return;
  }

  if (detailSuccessState?.productId === product.id) {
    container.innerHTML = `
      <div class="thankyou-panel">
        <p class="eyebrow">Interest Saved</p>
        <h2>Thanks for showing interest.</h2>
        <p class="product-copy">Your preorder interest for <strong>${product.name}</strong> has been saved with size ${detailSuccessState.selectedSize} and quantity ${detailSuccessState.selectedQuantity}.</p>
        <p class="product-copy">We will reach out with the next update on this piece.</p>
        <div class="thankyou-actions">
          <a class="button button-primary" href="/#shop">Back to Shopping</a>
          <button class="button button-secondary" type="button" id="followInstagramButton">Follow Us on Instagram</button>
        </div>
      </div>
    `;
    return;
  }

  const image = product.images[selectedImageIndex] || product.images[0];
  const tabs = getProductTabContent(product);

  container.innerHTML = `
    <div class="detail-gallery">
      <div class="thumb-list">
        ${product.images.map((_, index) => `<button class="thumb ${index === selectedImageIndex ? "active" : ""}" data-thumb-index="${index}" aria-label="View image ${index + 1}"></button>`).join("")}
      </div>
      <div class="detail-main-image"></div>
    </div>
    <div class="detail-info">
      <div class="detail-utility-row">
        <a class="text-button" href="/#shop">Back to shop</a>
      </div>
      <div class="detail-header">
        <div class="meta-row">
          <span class="badge ${product.soldOut ? "soldout" : ""}">${product.soldOut ? "Sold Out" : "Limited Edition"}</span>
          <span class="tag">${product.dropLabel}</span>
        </div>
        <h2>${product.name}</h2>
        <p class="price">₹${product.price.toLocaleString("en-IN")}</p>
        <p class="product-copy">${product.description}</p>
        <div class="stock-line ${product.lowStock ? "low" : ""}">
          <span>${product.remainingStock} / 100 remaining</span>
          <span>${product.lowStock ? "Low Stock" : "Current release"}</span>
        </div>
        <div class="stock-bar ${product.lowStock ? "low" : ""}"><span style="width:${product.remainingRatio}%"></span></div>
        <p class="product-copy premium-note">Premium limited-edition piece with elevated construction, small-batch production, and a more exclusive finish.</p>
      </div>
      <div>
        <p class="eyebrow">Size</p>
        <div class="pill-row size-row">${product.sizes.map(size => `<button class="size-pill ${selectedSize === size ? "active" : ""}" data-size="${size}">${size}</button>`).join("")}</div>
      </div>
      <div>
        <p class="eyebrow">Quantity</p>
        <div class="pill-row quantity-row">
          <button class="qty-button" data-qty="-1">-</button>
          <span class="qty-value">${selectedQuantity}</span>
          <button class="qty-button" data-qty="1">+</button>
        </div>
      </div>
      <form class="interest-form" id="productInterestForm">
        <p class="eyebrow">Show Interest</p>
        <label>Name<input type="text" name="name" placeholder="Your name" value="${detailFormState.name}" required></label>
        <label>Phone number<input type="tel" name="phone" placeholder="+91 98765 43210" value="${detailFormState.phone}" required></label>
        <label>Email<input type="email" name="email" placeholder="name@example.com" value="${detailFormState.email}"></label>
        <label>City<input type="text" name="city" placeholder="Your city" value="${detailFormState.city}"></label>
        <label>Pincode<input type="text" name="pincode" placeholder="400001" value="${detailFormState.pincode}"></label>
        <div class="detail-actions">
          <button class="button button-primary interest-submit-button" type="submit">Pre Order Now</button>
        </div>
        <p class="form-note interest-cta-copy">This is a preorder interest request. Once you submit it, our team will call you back with the next steps.</p>
        <p class="form-note policy-note">Exchange only. Size exchanges depend on stock availability because this is a limited-edition collection.</p>
        <p class="form-note">Your interest will be saved with the selected size and quantity. No payment is collected now.</p>
      </form>
      <div>
        <p class="eyebrow">Behind the Piece</p>
        <p class="product-copy">${product.story}</p>
      </div>
      <div class="detail-tabs">
        <div class="tab-header">
          ${Object.keys(tabs).map(tab => `<button class="tab-button ${selectedTab === tab ? "active" : ""}" data-tab="${tab}">${tab === "care" ? "Fabric & Care" : capitalize(tab)}</button>`).join("")}
        </div>
        <div class="tab-content">${tabs[selectedTab] || tabs.details}</div>
      </div>
    </div>
  `;

  injectImageStyles("detail-thumbs", "#productDetail .thumb", product.images);
  injectImageStyles("detail-main-image", "#productDetail .detail-main-image", [image]);
}

function renderSuggestedProducts() {
  const container = document.getElementById("suggestedProducts");
  if (!container) return;
  const currentProduct = allProducts.find(item => item.id === selectedProductId);
  const suggested = allProducts
    .filter(item => item.id !== selectedProductId)
    .filter(item => !currentProduct || item.gender === currentProduct.gender)
    .slice(0, 4);
  renderProductCards("suggestedProducts", suggested);
}

function renderAll() {
  renderHero();
  renderShopModeToggle();
  renderProductCards("shopProducts", getShopProducts());
  renderProductDetail();
  renderSuggestedProducts();
}

function updateCountdown() {
  const targetDate = new Date("2026-04-18T20:00:00+05:30");
  const now = new Date();
  const diff = Math.max(0, targetDate - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const text = `${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  const countdown = document.getElementById("heroCountdown");
  if (countdown) countdown.textContent = text;
}

function setHeroSlide(index) {
  heroIndex = (index + heroImages.length) % heroImages.length;
  renderHero();
}

function startHeroTimer() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => setHeroSlide(heroIndex + 1), 5000);
}

function openProduct(productId) {
  selectedProductId = productId;
  selectedImageIndex = 0;
  selectedQuantity = 1;
  selectedTab = "details";
  detailFormState = { name: "", phone: "", email: "", city: "", pincode: "" };
  detailSuccessState = null;
  sessionStorage.setItem(productScrollKey, "detail");
  window.location.href = `/product.html?product=${productId}`;
}

function openInstagramProfile() {
  const appUrl = "instagram://user?username=fewco.in";
  const openedAt = Date.now();
  window.location.href = appUrl;
  window.setTimeout(() => {
    if (Date.now() - openedAt < 1800) {
      window.open(instagramProfileUrl, "_blank", "noopener,noreferrer");
    }
  }, 900);
}

function getFooterFeedbackPayload(form) {
  const formData = new FormData(form);
  const contact = String(formData.get("contact") || "").trim();
  const feedbackType = String(formData.get("feedbackType") || "enquiry").trim();
  const isEmail = contact.includes("@");

  return {
    name: String(formData.get("name") || "").trim(),
    phone: isEmail ? "" : contact,
    email: isEmail ? contact : "",
    source: "footer-feedback",
    selectedVariant: feedbackType,
    notes: String(formData.get("message") || "").trim(),
    visitorId: currentVisitorId
  };
}

async function likeCurrentHeroIdea() {
  const imageUrl = heroImages[heroIndex];
  const likeStatus = document.getElementById("heroLikeStatus");
  if (!imageUrl || !currentVisitorId || !likeStatus) return;

  likeStatus.textContent = "Saving your like...";
  try {
    await fetch(`${ADMIN_API_URL}/carousel-like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: currentVisitorId,
        imageUrl,
        slideIndex: heroIndex
      })
    });
    likeStatus.textContent = "Idea liked.";
  } catch (error) {
    likeStatus.textContent = "Unable to save like right now.";
  }
}

function bindEvents() {
  document.addEventListener("click", event => {
    const modeButton = event.target.closest("[data-shop-mode]");
    const viewButton = event.target.closest("[data-view-product]");
    const scrollButton = event.target.closest("[data-scroll]");
    const heroDot = event.target.closest("[data-hero-dot]");
    const thumbButton = event.target.closest("[data-thumb-index]");
    const sizeButton = event.target.closest("[data-size]");
    const qtyButton = event.target.closest("[data-qty]");
    const tabButton = event.target.closest("[data-tab]");

    if (modeButton) {
      shopMode = modeButton.dataset.shopMode;
      renderShopModeToggle();
      renderProductCards("shopProducts", getShopProducts());
    }
    if (viewButton) openProduct(viewButton.dataset.viewProduct);
    if (scrollButton) document.querySelector(scrollButton.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (heroDot) {
      setHeroSlide(Number(heroDot.dataset.heroDot));
      startHeroTimer();
    }
    if (thumbButton) {
      captureDetailFormState();
      selectedImageIndex = Number(thumbButton.dataset.thumbIndex);
      renderProductDetail();
    }
    if (sizeButton) {
      captureDetailFormState();
      selectedSize = sizeButton.dataset.size;
      renderProductDetail();
    }
    if (qtyButton) {
      captureDetailFormState();
      selectedQuantity = Math.min(5, Math.max(1, selectedQuantity + Number(qtyButton.dataset.qty)));
      renderProductDetail();
    }
    if (tabButton) {
      captureDetailFormState();
      selectedTab = tabButton.dataset.tab;
      renderProductDetail();
    }
    if (event.target.id === "likeHeroButton") likeCurrentHeroIdea();
    if (event.target.id === "prevHero") {
      setHeroSlide(heroIndex - 1);
      startHeroTimer();
    }
    if (event.target.id === "nextHero") {
      setHeroSlide(heroIndex + 1);
      startHeroTimer();
    }
    if (event.target.id === "followInstagramButton") {
      openInstagramProfile();
    }
    if (event.target.closest("[data-feedback-type]")) {
      const selectedType = event.target.closest("[data-feedback-type]").dataset.feedbackType;
      const form = event.target.closest("#footerFeedbackForm");
      if (form) {
        form.querySelectorAll("[data-feedback-type]").forEach(button => {
          button.classList.toggle("active", button.dataset.feedbackType === selectedType);
        });
        const hiddenInput = form.querySelector("#footerFeedbackType");
        if (hiddenInput) hiddenInput.value = selectedType;
      }
    }
    if (event.target.closest("#filterToggleButton")) {
      const toolbar = document.querySelector(".shop-toolbar");
      const button = document.getElementById("filterToggleButton");
      toolbar?.classList.toggle("filters-open");
      if (button) {
        const expanded = toolbar?.classList.contains("filters-open");
        button.setAttribute("aria-expanded", expanded ? "true" : "false");
      }
    }
  });

  document.addEventListener("keydown", event => {
    const openable = event.target.closest("[data-view-product]");
    if (openable && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openProduct(openable.dataset.viewProduct);
    }
  });

  document.addEventListener("submit", async event => {
    if (event.target.id === "productInterestForm") {
      event.preventDefault();
      const product = allProducts.find(item => item.id === selectedProductId);
      if (!product) return;

      const formData = new FormData(event.target);
      const payload = {
        visitorId: currentVisitorId,
        productId: product.id,
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        city: formData.get("city"),
        pincode: formData.get("pincode"),
        source: "product-interest",
        productName: product.name,
        productImage: product.image,
        productPrice: product.price,
        selectedSize,
        selectedQuantity: Math.min(5, selectedQuantity),
        selectedVariant: `${capitalize(product.gender)} / ${capitalize(product.category)}`,
        notes: `Interest for ${product.name} | size ${selectedSize} | quantity ${Math.min(5, selectedQuantity)}`
      };

      try {
        const response = await fetch(`${ADMIN_API_URL}/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to save enquiry");
        await loadProducts();
        detailSuccessState = {
          productId: product.id,
          selectedSize,
          selectedQuantity: Math.min(5, selectedQuantity)
        };
        detailFormState = { name: "", phone: "", email: "", city: "", pincode: "" };
        renderAll();
        window.setTimeout(() => {
          document.getElementById("product")?.scrollIntoView({ behavior: "auto", block: "start" });
        }, 40);
      } catch (error) {
        alert(error.message || "Unable to save your product interest right now.");
      }
      return;
    }

    if (event.target.id === "footerFeedbackForm") {
      event.preventDefault();
      const payload = getFooterFeedbackPayload(event.target);
      try {
        const response = await fetch(`${ADMIN_API_URL}/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to save feedback");
        event.target.reset();
        const typeInput = event.target.querySelector("#footerFeedbackType");
        if (typeInput) typeInput.value = "enquiry";
        event.target.querySelectorAll("[data-feedback-type]").forEach(button => {
          button.classList.toggle("active", button.dataset.feedbackType === "enquiry");
        });
        alert("Thanks for sharing your feedback.");
      } catch (error) {
        alert(error.message || "Unable to save feedback right now.");
      }
    }
  });

  document.addEventListener("focusin", event => {
    if (event.target.closest("#productInterestForm")) {
      trackPreorderClick();
    }
  });

  document.addEventListener("click", event => {
    if (event.target.closest("#productInterestForm")) {
      trackPreorderClick();
    }
  });

  ["sizeFilter", "availabilityFilter", "sortFilter"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", () => renderProductCards("shopProducts", getShopProducts()));
  });

  window.addEventListener("scroll", () => {
    document.getElementById("siteHeader")?.classList.toggle("scrolled", window.scrollY > 24);
  });
}

bindEvents();
updateCountdown();
setInterval(updateCountdown, 60000);
bootstrap();
startHeroTimer();
