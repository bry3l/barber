/**
 * Módulo de Presentación / UI
 * Renderiza el catálogo, el drawer del carrito y actualiza atributos ARIA.
 */

export const View = {
  announce(message) {
    const announcer = document.getElementById('aria-announcer');
    if (announcer) {
      announcer.textContent = message;
    }
  },

  renderCatalog(products, onAddToCart) {
    const track = document.getElementById('productsTrack');
    if (!track) return;
    track.innerHTML = '';

    products.forEach(product => {
      const card = document.createElement('article');
      card.className = 'product-item';
      card.setAttribute('aria-labelledby', `prod-title-${product.id}`);

      card.innerHTML = `
        <div class="product-photo">
          <img src="${product.imagen}" alt="Fotografía de ${product.nombre}" loading="lazy">
          ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ''}
        </div>
        <div class="product-info">
          <span class="product-type">${product.categoria}</span>
          <h3 id="prod-title-${product.id}">${product.nombre}</h3>
          <p>${product.descripcion}</p>
          <div class="product-footer">
            <strong>$${product.precio.toFixed(2)}</strong>
            <button type="button" aria-label="Agregar ${product.nombre} al carrito">
              Agregar 🛒
            </button>
          </div>
        </div>
      `;

      card.querySelector('button').addEventListener('click', () => onAddToCart(product));
      track.appendChild(card);
    });
  },

  renderCart(cart, onUpdateQty, onRemoveItem) {
    const container = document.getElementById('cartDrawerItems');
    const badge = document.getElementById('cartBadgeCount');
    const subtotalEl = document.getElementById('cartDrawerSubtotal');
    const taxEl = document.getElementById('cartDrawerTax');
    const totalEl = document.getElementById('cartDrawerTotal');

    if (!container) return;

    badge.textContent = cart.getTotalCount();
    badge.setAttribute('aria-label', `${cart.getTotalCount()} productos en el carrito`);

    if (cart.items.length === 0) {
      container.innerHTML = '<p class="cart-empty-text">Tu carrito está actualmente vacío.</p>';
    } else {
      container.innerHTML = '';
      cart.items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
          <img src="${item.imagen}" alt="${item.nombre}">
          <div>
            <h4 class="cart-item__title">${item.nombre}</h4>
            <span class="cart-item__price">$${item.precio.toFixed(2)} c/u</span>
            <div class="cart-item__controls" role="group" aria-label="Cantidad para ${item.nombre}">
              <button type="button" class="cart-qty-btn btn-dec" aria-label="Restar una unidad">-</button>
              <span class="cart-qty-text" aria-live="polite">${item.quantity}</span>
              <button type="button" class="cart-qty-btn btn-inc" aria-label="Sumar una unidad">+</button>
            </div>
          </div>
          <div>
            <button type="button" class="cart-item__remove" aria-label="Eliminar ${item.nombre} del carrito">✕</button>
          </div>
        `;

        itemEl.querySelector('.btn-dec').addEventListener('click', () => onUpdateQty(item.id, item.quantity - 1));
        itemEl.querySelector('.btn-inc').addEventListener('click', () => onUpdateQty(item.id, item.quantity + 1));
        itemEl.querySelector('.cart-item__remove').addEventListener('click', () => onRemoveItem(item.id));

        container.appendChild(itemEl);
      });
    }

    subtotalEl.textContent = `$${cart.getSubtotal().toFixed(2)}`;
    taxEl.textContent = `$${cart.getTax().toFixed(2)}`;
    totalEl.textContent = `$${cart.getTotal().toFixed(2)}`;
  },

  updateTimestamp(text) {
    const el = document.getElementById('storageTimestamp');
    if (el) el.textContent = text;
  }
};
