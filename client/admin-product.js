const PRODUCT_API_URL = "/api/products";

const form = document.getElementById("productEditorForm");
const statusText = document.getElementById("editorStatus");
const titleText = document.getElementById("editorTitle");
const preview = document.getElementById("listingPreview");
const imageOptions = document.getElementById("supplierImageOptions");
const productId = new URLSearchParams(window.location.search).get("product");

function setStatus(message) {
  statusText.textContent = message;
}

function parseSizes(value) {
  return value.split(",").map(size => size.trim()).filter(Boolean);
}

function getImagesFromForm() {
  return [
    document.getElementById("image").value.trim(),
    document.getElementById("image2").value.trim(),
    document.getElementById("image3").value.trim(),
    document.getElementById("image4").value.trim()
  ].filter(Boolean);
}

function updateListingPreview() {
  const images = getImagesFromForm();
  const activeListingImage = document.getElementById("listingImage").value.trim() || images[0] || "";
  preview.style.backgroundImage = activeListingImage ? `url('${activeListingImage}')` : "none";

  imageOptions.innerHTML = images.map((image, index) => `
    <button class="supplier-image-option ${activeListingImage === image ? "active" : ""}" type="button" data-listing-image="${image}">
      Image ${index + 1}
    </button>
  `).join("") || `<p class="form-note">Add product images to choose the main page image.</p>`;
}

function getProductPayload() {
  const images = getImagesFromForm();
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
    remainingStock: Number(document.getElementById("remaining").value),
    featured: document.getElementById("featured").checked
  };
}

function fillForm(product) {
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
  titleText.textContent = product.name || "Product editor";
  updateListingPreview();
}

async function loadProduct() {
  if (!productId) {
    setStatus("No product selected.");
    titleText.textContent = "No product selected";
    return;
  }

  setStatus("Loading product...");
  const response = await fetch(`${PRODUCT_API_URL}/${productId}`);
  if (!response.ok) {
    throw new Error("Unable to load product");
  }
  const product = await response.json();
  fillForm(product);
  setStatus("Product loaded.");
}

async function saveProduct(event) {
  event.preventDefault();
  setStatus("Saving product...");

  const response = await fetch(`${PRODUCT_API_URL}/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getProductPayload())
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Unable to save product");
  }

  const product = await response.json();
  fillForm(product);
  setStatus("Product updated.");
}

form.addEventListener("submit", event => {
  saveProduct(event).catch(error => setStatus(error.message || "Unable to save product."));
});

document.addEventListener("input", event => {
  if (event.target.closest("#productEditorForm")) {
    updateListingPreview();
  }
});

document.addEventListener("click", event => {
  const button = event.target.closest("[data-listing-image]");
  if (!button) return;
  document.getElementById("listingImage").value = button.dataset.listingImage;
  updateListingPreview();
});

loadProduct().catch(error => {
  setStatus(error.message || "Unable to load product.");
  titleText.textContent = "Product unavailable";
});
