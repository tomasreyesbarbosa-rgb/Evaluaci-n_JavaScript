const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export class ShoppingCart extends HTMLElement {
  set state(value) {
    this._state = value;
    this.render();
  }

  render() {
    // Recibe un resumen calculado por la aplicación; el componente no mantiene el estado global.
    const state = this._state ?? {
      lines: [],
      units: 0,
      subtotal: 0,
      discount: 0,
      total: 0,
    };
    const layout = document.createElement("div");
    layout.className = "disposicion-carrito";
    const linesContainer = document.createElement("div");
    linesContainer.className = "lineas-carrito";
    linesContainer.setAttribute("aria-label", "Productos en el carrito");

    if (!state.lines.length) {
      const empty = document.createElement("p");
      empty.className = "carrito-vacio";
      empty.textContent = "Tu carrito está vacío. Agrega productos del catálogo para comenzar.";
      linesContainer.append(empty);
    } else {
      for (const line of state.lines) {
        linesContainer.append(this.#createLine(line));
      }
    }

    const summary = document.createElement("aside");
    summary.className = "resumen-carrito";
    const heading = document.createElement("h3");
    heading.textContent = "Resumen del pedido";
    const units = this.#summaryRow("Unidades", String(state.units));
    const subtotal = this.#summaryRow("Subtotal", currency.format(state.subtotal));
    const discount = this.#summaryRow("Descuento", `−${currency.format(state.discount)}`);
    const total = this.#summaryRow("Total", currency.format(state.total), true);
    const hint = document.createElement("p");
    hint.className = "aviso-descuento";
    hint.textContent = "Obtén 10 % de descuento en compras desde $300.000 COP.";

    const actions = document.createElement("div");
    actions.className = "acciones-resumen";
    const checkout = document.createElement("button");
    checkout.className = "boton boton-principal";
    checkout.type = "button";
    checkout.textContent = "Confirmar pedido";
    checkout.disabled = state.lines.length === 0;
    checkout.addEventListener("click", () => {
      // Las acciones se delegan a la aplicación mediante eventos personalizados.
      this.dispatchEvent(new CustomEvent("checkout-request", {
        bubbles: true,
        composed: true,
      }));
    });

    const clear = document.createElement("button");
    clear.className = "boton boton-secundario";
    clear.type = "button";
    clear.textContent = "Vaciar carrito";
    clear.disabled = state.lines.length === 0;
    clear.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("cart-clear-request", {
        bubbles: true,
        composed: true,
      }));
    });

    actions.append(checkout, clear);
    summary.append(heading, units, subtotal, discount, total, hint, actions);
    layout.append(linesContainer, summary);
    this.replaceChildren(layout);
  }

  #createLine(line) {
    const row = document.createElement("article");
    row.className = "linea-carrito";
    const info = document.createElement("div");
    const name = document.createElement("h3");
    name.className = "nombre-linea-carrito";
    name.textContent = line.product.name;
    const price = document.createElement("span");
    price.className = "precio-linea-carrito";
    price.textContent = `${currency.format(line.product.price)} por unidad`;
    info.append(name, price);

    const quantityControl = document.createElement("div");
    quantityControl.className = "control-cantidad";
    const decrease = document.createElement("button");
    decrease.className = "boton boton-secundario boton-pequeno";
    decrease.type = "button";
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", `Disminuir cantidad de ${line.product.name}`);
    decrease.disabled = line.quantity <= 1;
    decrease.addEventListener("click", () => this.#requestQuantity(line, line.quantity - 1));

    const quantity = document.createElement("span");
    quantity.className = "valor-cantidad";
    quantity.setAttribute("aria-label", "Cantidad");
    quantity.textContent = String(line.quantity);

    const increase = document.createElement("button");
    increase.className = "boton boton-secundario boton-pequeno";
    increase.type = "button";
    increase.textContent = "+";
    increase.setAttribute("aria-label", `Aumentar cantidad de ${line.product.name}`);
    increase.disabled = line.quantity >= line.product.stock;
    increase.addEventListener("click", () => this.#requestQuantity(line, line.quantity + 1));
    quantityControl.append(decrease, quantity, increase);

    const subtotal = document.createElement("span");
    subtotal.className = "subtotal-linea-carrito";
    subtotal.textContent = currency.format(line.subtotal);

    const remove = document.createElement("button");
    remove.className = "boton boton-peligro boton-pequeno";
    remove.type = "button";
    remove.textContent = "Eliminar";
    remove.setAttribute("aria-label", `Eliminar ${line.product.name} del carrito`);
    remove.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("cart-remove-request", {
        bubbles: true,
        composed: true,
        detail: { productId: line.productId },
      }));
    });

    row.append(info, quantityControl, subtotal, remove);
    return row;
  }

  #requestQuantity(line, quantity) {
    this.dispatchEvent(new CustomEvent("cart-quantity-request", {
      bubbles: true,
      composed: true,
      detail: { productId: line.productId, quantity },
    }));
  }

  #summaryRow(label, value, isTotal = false) {
    const row = document.createElement("div");
    row.className = `fila-resumen${isTotal ? " total-resumen" : ""}`;
    const title = document.createElement("span");
    title.textContent = label;
    const amount = document.createElement("strong");
    amount.textContent = value;
    row.append(title, amount);
    return row;
  }
}

customElements.define("shopping-cart", ShoppingCart);
