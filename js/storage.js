const STORAGE_KEY = "tecnostock-cart-v1";

export function loadCart(products) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
      return { lines: [], warning: "" };
    }

    // Los datos persistidos son entrada externa: se analizan y validan antes de usarlos.
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return { lines: [], warning: "El carrito guardado tenía un formato incorrecto y se inició vacío." };
    }

    // Se contrasta cada línea con el catálogo actual; el almacenamiento no es fuente de precios.
    const productMap = new Map(products.map((product) => [product.id, product]));
    const quantities = new Map();
    let ignoredLines = 0;

    for (const line of parsed) {
      if (!line || !Number.isInteger(line.productId) || !Number.isInteger(line.quantity) || line.quantity < 1) {
        ignoredLines += 1;
        continue;
      }

      const product = productMap.get(line.productId);
      // También valida cantidades repetidas acumuladas para no superar el inventario.
      const combinedQuantity = (quantities.get(line.productId) ?? 0) + line.quantity;
      if (!product?.active || product.stock < combinedQuantity) {
        ignoredLines += 1;
        continue;
      }
      quantities.set(line.productId, combinedQuantity);
    }

    return {
      lines: Array.from(quantities, ([productId, quantity]) => ({ productId, quantity })),
      warning: ignoredLines > 0
        ? "Se omitieron productos o cantidades no válidos del carrito guardado."
        : "",
    };
  } catch (error) {
    console.error("No se pudo recuperar el carrito guardado:", error);
    return {
      lines: [],
      warning: "No se pudo leer el carrito guardado. Puedes continuar con un carrito vacío.",
    };
  }
}

export function saveCart(lines) {
  try {
    // Solo persistimos el identificador y la cantidad; nunca precios del navegador.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.map(({ productId, quantity }) => ({
      productId,
      quantity,
    }))));
    return true;
  } catch (error) {
    console.error("No se pudo guardar el carrito:", error);
    return false;
  }
}
