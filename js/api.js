// Obtiene y valida el catálogo remoto servido desde la carpeta local del proyecto.
const CATALOG_URL = "./data/products.json";

// Valida cada registro antes de que otras partes de la aplicación lo utilicen.
function isValidProduct(product) {
  return product !== null
    && typeof product === "object"
    && Number.isInteger(product.id)
    && typeof product.name === "string"
    && product.name.trim().length > 0
    && typeof product.category === "string"
    && product.category.trim().length > 0
    && Number.isFinite(product.price)
    && product.price > 0
    && Number.isInteger(product.stock)
    && product.stock >= 0
    && typeof product.description === "string"
    && typeof product.active === "boolean";
}

export async function fetchProducts() {
  // El catálogo se solicita una vez desde el servidor HTTP local.
  const response = await fetch(CATALOG_URL, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`El servidor respondió con el error HTTP ${response.status}.`);
  }

  // Distingue una respuesta HTTP correcta de un archivo JSON mal formado.
  let products;
  try {
    products = await response.json();
  } catch {
    throw new Error("El catálogo no contiene un JSON válido.");
  }

  if (!Array.isArray(products) || !products.every(isValidProduct)) {
    throw new Error("Los datos del catálogo tienen una estructura inválida.");
  }

  const ids = products.map((product) => product.id);
  // Los IDs duplicados harían ambiguas las líneas del carrito y el almacenamiento.
  if (new Set(ids).size !== ids.length) {
    throw new Error("El catálogo contiene identificadores de producto duplicados.");
  }

  return products.map((product) => ({ ...product }));
}
