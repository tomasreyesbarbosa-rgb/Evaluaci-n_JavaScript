const DISCOUNT_THRESHOLD = 300_000;
const DISCOUNT_RATE = 0.1;

export class Cart {
  constructor(products, initialLines = []) {
    // El carrito guarda cantidades por ID y obtiene siempre el precio del catálogo.
    this.products = new Map(products.map((product) => [product.id, product]));
    this.quantities = new Map();

    for (const line of initialLines) {
      if (this.#isValidLine(line)) {
        this.quantities.set(line.productId, line.quantity);
      }
    }
  }

  add(productId, quantity = 1) {
    // Primero valida el producto y la cantidad; solo escribe en el estado si todo es válido.
    const product = this.#getAvailableProduct(productId);
    this.#assertQuantity(quantity);

    const nextQuantity = (this.quantities.get(productId) ?? 0) + quantity;
    if (nextQuantity > product.stock) {
      throw new Error(`Solo hay ${product.stock} unidades disponibles de ${product.name}.`);
    }

    this.quantities.set(productId, nextQuantity);
  }

  setQuantity(productId, quantity) {
    const product = this.#getAvailableProduct(productId);
    this.#assertQuantity(quantity);

    if (quantity > product.stock) {
      throw new Error(`Solo hay ${product.stock} unidades disponibles de ${product.name}.`);
    }

    this.quantities.set(productId, quantity);
  }

  remove(productId) {
    if (!this.quantities.has(productId)) {
      throw new Error("El producto ya no está en el carrito.");
    }
    this.quantities.delete(productId);
  }

  clear() {
    this.quantities.clear();
  }

  getLines() {
    return Array.from(this.quantities, ([productId, quantity]) => {
      const product = this.products.get(productId);
      // Los importes se calculan siempre con el precio actual del catálogo.
      return {
        product,
        productId,
        quantity,
        subtotal: product.price * quantity,
      };
    });
  }

  getSummary() {
    // Todos los importes se derivan de las líneas y los precios vigentes del catálogo.
    const lines = this.getLines();
    const units = lines.reduce((total, line) => total + line.quantity, 0);
    const subtotal = lines.reduce((total, line) => total + line.subtotal, 0);
    // El umbral se incluye: un subtotal de exactamente $300.000 también recibe descuento.
    const discount = subtotal >= DISCOUNT_THRESHOLD ? Math.round(subtotal * DISCOUNT_RATE) : 0;

    return {
      lines,
      units,
      subtotal,
      discount,
      total: subtotal - discount,
    };
  }

  validateForCheckout() {
    const lines = this.getLines();
    if (lines.length === 0) {
      throw new Error("Agrega al menos un producto antes de confirmar el pedido.");
    }

    // Se revisa otra vez el estado completo antes de generar una confirmación.
    for (const line of lines) {
      const product = this.products.get(line.productId);
      if (!product || !product.active || product.stock < 1) {
        throw new Error(`${line.product?.name ?? "Un producto"} ya no está disponible.`);
      }
      if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > product.stock) {
        throw new Error(`La cantidad de ${product.name} ya no es válida para el inventario disponible.`);
      }
    }

    return this.getSummary();
  }

  #getAvailableProduct(productId) {
    const product = this.products.get(productId);
    if (!product || !product.active || product.stock < 1) {
      throw new Error("Este producto no está disponible para agregar al carrito.");
    }
    return product;
  }

  #assertQuantity(quantity) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("La cantidad debe ser un número entero igual o mayor que 1.");
    }
  }

  #isValidLine(line) {
    if (!line || !Number.isInteger(line.productId) || !Number.isInteger(line.quantity) || line.quantity < 1) {
      return false;
    }
    const product = this.products.get(line.productId);
    return Boolean(product?.active && product.stock >= line.quantity);
  }
}
