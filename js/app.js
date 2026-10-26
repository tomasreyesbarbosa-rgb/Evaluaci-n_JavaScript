import { fetchProducts } from "./api.js";
import { Cart } from "./cart.js";
import { loadCart, saveCart } from "./storage.js";
import "./components/product-card.js";
import "./components/product-list.js";
import "./components/shopping-cart.js";

// Punto de coordinación: carga datos, aplica filtros y conecta los eventos de UI con el carrito.
const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// Referencias a elementos estables del HTML; los componentes se actualizan por sus propiedades.
const elements = {
  appMessage: document.querySelector("#app-message"),
  catalogStatus: document.querySelector("#catalog-status"),
  productList: document.querySelector("#product-list"),
  cart: document.querySelector("#shopping-cart"),
  headerCount: document.querySelector("#header-count"),
  resultCount: document.querySelector("#result-count"),
  search: document.querySelector("#search"),
  category: document.querySelector("#category"),
  sort: document.querySelector("#sort"),
  availableOnly: document.querySelector("#available-only"),
  filters: document.querySelector("#filters"),
  clearFilters: document.querySelector("#clear-filters"),
  orderDialog: document.querySelector("#order-dialog"),
  orderId: document.querySelector("#order-id"),
  orderLines: document.querySelector("#order-lines"),
  orderTotals: document.querySelector("#order-totals"),
  closeOrder: document.querySelector("#close-order"),
};

let catalog = [];
let cart;

// Mensajes accesibles para estados generales y estados específicos del catálogo.
function showMessage(message, type = "info") {
  elements.appMessage.textContent = message;
  elements.appMessage.dataset.type = type;
}

function showCatalogStatus(message, type = "info") {
  elements.catalogStatus.textContent = message;
  elements.catalogStatus.dataset.type = type;
}

// Los filtros se aplican en memoria sobre la copia del catálogo ya cargada.
function renderProducts() {
  // Combina todos los criterios antes de ordenar la lista resultante.
  const term = elements.search.value.trim().toLocaleLowerCase("es");
  const category = elements.category.value;
  const availableOnly = elements.availableOnly.checked;
  const sort = elements.sort.value;

  let filtered = catalog.filter((product) => {
    const searchable = `${product.name} ${product.description}`.toLocaleLowerCase("es");
    const matchesTerm = searchable.includes(term);
    const matchesCategory = !category || product.category === category;
    const matchesAvailability = !availableOnly || (product.active && product.stock > 0);
    return matchesTerm && matchesCategory && matchesAvailability;
  });

  if (sort === "asc") {
    filtered = [...filtered].sort((left, right) => left.price - right.price || left.id - right.id);
  } else if (sort === "desc") {
    filtered = [...filtered].sort((left, right) => right.price - left.price || left.id - right.id);
  }

  elements.productList.products = filtered;
  elements.resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? "producto" : "productos"}`;
}

function renderCart() {
  // El resumen se calcula en Cart para que encabezado, líneas e importes coincidan.
  const summary = cart.getSummary();
  elements.cart.state = summary;
  elements.headerCount.textContent = String(summary.units);
  elements.headerCount.setAttribute("aria-label", `${summary.units} unidades en el carrito`);
}

function persistCart() {
  if (!saveCart(cart.getLines())) {
    showMessage("El carrito sigue disponible en esta sesión, pero no se pudo guardar en este navegador.", "error");
    return false;
  }
  return true;
}

function applyCartChange(operation) {
  try {
    // Los eventos de los componentes siempre pasan por aquí antes de tocar el carrito.
    operation();
    renderCart();
    persistCart();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function populateCategories() {
  // Las opciones proceden de las categorías reales del archivo de catálogo.
  const categories = [...new Set(catalog.map((product) => product.category))]
    .sort((left, right) => left.localeCompare(right, "es"));

  for (const name of categories) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    elements.category.append(option);
  }
}

// Crea un identificador local para distinguir cada pedido simulado.
function createOrderId() {
  // UUID cuando el navegador lo ofrece; alternativa local para navegadores antiguos.
  if (typeof crypto.randomUUID === "function") {
    return `TS-${crypto.randomUUID()}`;
  }
  return `TS-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function appendOrderTotal(label, value) {
  const row = document.createElement("div");
  const title = document.createElement("dt");
  title.textContent = label;
  const amount = document.createElement("dd");
  amount.textContent = value;
  row.append(title, amount);
  elements.orderTotals.append(row);
}

// Valida el carrito y presenta el resumen del pedido sin procesar un pago real.
function confirmOrder() {
  // No se vacía el carrito hasta haber validado todas las líneas y preparado el resumen.
  let summary;
  try {
    summary = cart.validateForCheckout();
  } catch (error) {
    showMessage(error.message, "error");
    return;
  }

  elements.orderId.textContent = `Identificador del pedido: ${createOrderId()}`;
  elements.orderLines.replaceChildren();
  for (const line of summary.lines) {
    const item = document.createElement("li");
    const description = document.createElement("span");
    description.textContent = `${line.product.name} × ${line.quantity}`;
    const amount = document.createElement("strong");
    amount.textContent = currency.format(line.subtotal);
    item.append(description, amount);
    elements.orderLines.append(item);
  }

  elements.orderTotals.replaceChildren();
  appendOrderTotal("Subtotal", currency.format(summary.subtotal));
  appendOrderTotal("Descuento", `−${currency.format(summary.discount)}`);
  appendOrderTotal("Total", currency.format(summary.total));
  elements.orderDialog.showModal();

  // El carrito se vacía solo después de validar y preparar el resumen del pedido.
  cart.clear();
  renderCart();
  const saved = persistCart();
  showMessage(
    saved
      ? "Pedido simulado confirmado. No se realizó ningún pago ni se modificó el inventario."
      : "Pedido simulado confirmado. No se realizó ningún pago ni se modificó el inventario. El carrito se vació en esta sesión, pero el cambio no se pudo guardar en este navegador.",
    saved ? "info" : "error",
  );
}

async function start() {
  // Mantiene visible un estado coherente incluso si falla la solicitud del catálogo.
  if (!cart) {
    cart = new Cart([]);
    renderCart();
  }
  showCatalogStatus("Cargando el catálogo…");
  try {
    catalog = await fetchProducts();
    // Las cantidades almacenadas se recuperan solo después de disponer del catálogo vigente.
    const restored = loadCart(catalog);
    cart = new Cart(catalog, restored.lines);
    populateCategories();
    renderProducts();
    renderCart();

    if (catalog.length === 0) {
      showCatalogStatus("El catálogo se cargó correctamente, pero todavía no tiene productos.");
    } else {
      showCatalogStatus("");
    }
    if (restored.warning) {
      showMessage(restored.warning);
    }
  } catch (error) {
    console.error("No se pudo cargar el catálogo:", error);
    showCatalogStatus(`No fue posible cargar el catálogo. ${error.message} Verifica el servidor local y vuelve a intentarlo.`, "error");
    const retry = document.createElement("button");
    retry.className = "boton boton-secundario";
    retry.type = "button";
    retry.textContent = "Reintentar";
    retry.addEventListener("click", start, { once: true });
    elements.catalogStatus.append(" ", retry);
  }
}

elements.filters.addEventListener("input", renderProducts);
elements.filters.addEventListener("change", renderProducts);
// Limpiar restablece los valores iniciales de los controles y vuelve a filtrar el catálogo original.
elements.clearFilters.addEventListener("click", () => {
  elements.filters.reset();
  renderProducts();
});

// La aplicación centraliza y valida los eventos emitidos por los componentes.
elements.productList.addEventListener("product-add-request", (event) => {
  applyCartChange(() => cart.add(event.detail.productId, event.detail.quantity));
});

elements.cart.addEventListener("cart-quantity-request", (event) => {
  applyCartChange(() => cart.setQuantity(event.detail.productId, event.detail.quantity));
});

elements.cart.addEventListener("cart-remove-request", (event) => {
  applyCartChange(() => cart.remove(event.detail.productId));
});

elements.cart.addEventListener("cart-clear-request", () => {
  applyCartChange(() => cart.clear());
});

// El componente solicita confirmar; esta función comprueba el estado antes de mostrar el diálogo.
elements.cart.addEventListener("checkout-request", confirmOrder);
elements.closeOrder.addEventListener("click", () => elements.orderDialog.close());

start();
