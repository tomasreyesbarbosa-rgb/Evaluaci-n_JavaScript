const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// La tarjeta muestra un producto y comunica solicitudes; no conoce el estado global.
export class ProductCard extends HTMLElement {
  set product(value) {
    this._product = value;
    this.render();
  }

  render() {
    if (!this._product) {
      this.replaceChildren();
      return;
    }

    // Este componente presenta el producto y solo comunica la intención de agregarlo.
    const product = this._product;
    const available = product.active && product.stock > 0;
    const article = document.createElement("article");
    article.className = "tarjeta-producto";

    const top = document.createElement("div");
    top.className = "encabezado-tarjeta-producto";
    const category = document.createElement("span");
    category.className = "categoria-producto";
    category.textContent = product.category;
    const availability = document.createElement("span");
    availability.className = `disponibilidad${available ? "" : " no-disponible"}`;
    availability.textContent = available ? "Disponible" : "No disponible";
    top.append(category, availability);

    const name = document.createElement("h3");
    name.textContent = product.name;
    const description = document.createElement("p");
    description.className = "descripcion-producto";
    description.textContent = product.description;

    const bottom = document.createElement("div");
    bottom.className = "pie-tarjeta-producto";
    const priceAndStock = document.createElement("div");
    const price = document.createElement("span");
    price.className = "precio-producto";
    price.textContent = currency.format(product.price);
    const stock = document.createElement("span");
    stock.className = "existencias-producto";
    stock.textContent = available ? `${product.stock} en inventario` : "Agotado";
    priceAndStock.append(price, stock);

    const addButton = document.createElement("button");
    addButton.className = "boton boton-principal boton-pequeno";
    addButton.type = "button";
    addButton.textContent = "Agregar";
    addButton.disabled = !available;
    addButton.setAttribute("aria-label", `Agregar ${product.name} al carrito`);
    addButton.addEventListener("click", () => {
      // La aplicación escucha el evento y valida la operación antes de modificar el carrito.
      // bubbles y composed permiten que el evento llegue al responsable fuera del componente.
      this.dispatchEvent(new CustomEvent("product-add-request", {
        bubbles: true,
        composed: true,
        detail: { productId: product.id, quantity: 1 },
      }));
    });

    bottom.append(priceAndStock, addButton);
    article.append(top, name, description, bottom);
    this.replaceChildren(article);
  }
}
