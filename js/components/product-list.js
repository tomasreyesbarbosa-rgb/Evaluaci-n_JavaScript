export class ProductList extends HTMLElement {
  set products(value) {
    this._products = Array.isArray(value) ? value : [];
    this.render();
  }

  render() {
    // Crea tarjetas a partir del arreglo filtrado que entrega la aplicación.
    const grid = document.createElement("div");
    grid.className = "rejilla-productos";
    grid.setAttribute("aria-label", "Lista de productos");

    // La lista recibe los resultados ya filtrados y muestra un estado vacío cuando corresponde.
    if (!this._products?.length) {
      const empty = document.createElement("p");
      empty.className = "estado-vacio";
      empty.textContent = "No hay productos que coincidan con los filtros seleccionados.";
      grid.append(empty);
    } else {
      for (const product of this._products) {
        const card = document.createElement("product-card");
        card.product = product;
        grid.append(card);
      }
    }

    this.replaceChildren(grid);
  }
}

customElements.define("product-list", ProductList);
