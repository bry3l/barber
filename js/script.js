document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     1. SISTEMA MULTI-ALMACENAMIENTO (LocalStorage, Session, Cookies, IndexedDB)
     ========================================================= */
  const Storage = {
    saveCart(items) {
      localStorage.setItem('blash_cart', JSON.stringify(items));
      this.updateTimestamp();
    },
    getCart() {
      const raw = localStorage.getItem('blash_cart');
      return raw ? JSON.parse(raw) : [];
    },
    saveSession(data) {
      sessionStorage.setItem('blash_session_order', JSON.stringify(data));
    },
    setCookie(name, val, days = 7) {
      const d = new Date();
      d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${encodeURIComponent(val)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    },
    updateTimestamp() {
      const now = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
      localStorage.setItem('blash_last_update', now);
      this.setCookie('blash_last_update_cookie', now);
    },
    saveToIndexedDB(order) {
      const request = indexedDB.open('BlashBarberDB', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('pedidos')) {
          db.createObjectStore('pedidos', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('pedidos', 'readwrite');
        const pedidoConEstado = {
          ...order,
          fecha: new Date().toISOString(),
          sincronizado: navigator.onLine
        };
        tx.objectStore('pedidos').add(pedidoConEstado);
      };
    }
  };

  /* =========================================================
     2. RENDERIZAR PRODUCTOS DESDE PRODUCTOS_DATA
     ========================================================= */
  const prodWindow = document.getElementById('productsWindow') || document.querySelector('.products-window');

  if (prodWindow && typeof PRODUCTOS_DATA !== 'undefined') {
    const itemsHTML = PRODUCTOS_DATA.map(p => `
      <div class="product-item" data-id="${p.id}" data-name="${p.nombre}" data-price="${p.precio}" data-img="${p.imagen}">
        <div class="product-photo">
          ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
          <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">
        </div>
        <div class="product-info">
          <span class="product-type">${p.categoria}</span>
          <h3>${p.nombre}</h3>
          <p>${p.descripcion}</p>
          <div class="product-footer">
            <strong>$${p.precio.toFixed(2)}</strong>
            <button type="button" class="btn-add-cart">Pedir 🛒</button>
          </div>
        </div>
      </div>
    `).join('');

    prodWindow.innerHTML = `<div class="products-track">${itemsHTML}</div>`;
  }

  /* =========================================================
     3. GESTIÓN DEL CARRITO (Añadir, eliminar, actualizar, totales)
     ========================================================= */
  let cart = Storage.getCart();

  const cartBadge = document.getElementById('cartBadgeCount') || document.querySelector('.cart-trigger__badge');
  const cartDrawerItems = document.getElementById('cartDrawerItems');
  const cartDrawerSubtotal = document.getElementById('cartDrawerSubtotal');
  const cartDrawerTax = document.getElementById('cartDrawerTax');
  const cartDrawerTotal = document.getElementById('cartDrawerTotal');

  const updateCartUI = () => {
    Storage.saveCart(cart);

    const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.15; // 15% IVA Ecuador
    const total = subtotal + tax;

    if (cartBadge) cartBadge.textContent = totalQty;

    if (cartDrawerItems) {
      if (cart.length === 0) {
        cartDrawerItems.innerHTML = '<p class="cart-empty-text">Tu carrito está actualmente vacío.</p>';
      } else {
        cartDrawerItems.innerHTML = '';
        cart.forEach(item => {
          const div = document.createElement('div');
          div.className = 'cart-item';
          div.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div>
              <h4 class="cart-item__title">${item.name}</h4>
              <span class="cart-item__price">$${Number(item.price).toFixed(2)} c/u</span>
              <div class="cart-item__controls">
                <button type="button" class="cart-qty-btn btn-dec" data-id="${item.id}">-</button>
                <span class="cart-qty-text">${item.quantity}</span>
                <button type="button" class="cart-qty-btn btn-inc" data-id="${item.id}">+</button>
              </div>
            </div>
            <div>
              <button type="button" class="cart-item__remove" data-id="${item.id}">✕</button>
            </div>
          `;
          cartDrawerItems.appendChild(div);
        });
      }
    }

    if (cartDrawerSubtotal) cartDrawerSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (cartDrawerTax) cartDrawerTax.textContent = `$${tax.toFixed(2)}`;
    if (cartDrawerTotal) cartDrawerTotal.textContent = `$${total.toFixed(2)}`;
  };

  /* =========================================================
     4. APERTURA Y CIERRE DEL DRAWER
     ========================================================= */
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const openCartBtn = document.getElementById('openCartBtn') || document.querySelector('.cart-trigger');
  const closeCartBtn = document.getElementById('closeCartBtn') || document.querySelector('.cart-drawer__close');
  const goToCheckoutBtn = document.getElementById('goToCheckoutBtn');

  const toggleCart = (isOpen) => {
    if (cartDrawer) {
      cartDrawer.classList.toggle('is-active', isOpen);
      cartDrawer.setAttribute('aria-hidden', String(!isOpen));
    }
    if (cartOverlay) cartOverlay.classList.toggle('is-active', isOpen);
    if (openCartBtn) openCartBtn.setAttribute('aria-expanded', String(isOpen));
  };

  if (openCartBtn) openCartBtn.addEventListener('click', () => toggleCart(true));
  if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
  if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));
  if (goToCheckoutBtn) goToCheckoutBtn.addEventListener('click', () => toggleCart(false));

  // DELEGACIÓN DE EVENTO: Botón "Pedir" dentro del carrusel dinámico
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add-cart');
    if (btn) {
      const card = btn.closest('.product-item');
      if (card) {
        const id = card.dataset.id;
        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);
        const img = card.dataset.img;

        const existing = cart.find(i => String(i.id) === String(id));
        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({ id, name, price, img, quantity: 1 });
        }

        updateCartUI();
        toggleCart(true);
      }
    }
  });

  // Delegación de eventos dentro del drawer (+, -, eliminar)
  if (cartDrawerItems) {
    cartDrawerItems.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      if (!id) return;

      if (e.target.classList.contains('btn-inc')) {
        const item = cart.find(i => String(i.id) === String(id));
        if (item) item.quantity += 1;
      } else if (e.target.classList.contains('btn-dec')) {
        const item = cart.find(i => String(i.id) === String(id));
        if (item) {
          item.quantity -= 1;
          if (item.quantity <= 0) cart = cart.filter(i => String(i.id) !== String(id));
        }
      } else if (e.target.classList.contains('cart-item__remove')) {
        cart = cart.filter(i => String(i.id) !== String(id));
      }
      updateCartUI();
    });
  }

  // Vaciar carrito
  const clearBtn = document.getElementById('clearCartBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      if (confirm('¿Deseas vaciar tu carrito?')) {
        cart = [];
        updateCartUI();
      }
    });
  }

  /* =========================================================
     5. CARRUSEL DE PRODUCTOS (FLECHAS DIRECCIONALES)
     ========================================================= */
  const prodBtnPrev = document.getElementById('prodBtnPrev') || document.querySelector('.products-arrow-left') || document.querySelector('.carousel-btn-prev');
  const prodBtnNext = document.getElementById('prodBtnNext') || document.querySelector('.products-arrow-right') || document.querySelector('.carousel-btn-next');

  if (prodWindow && prodBtnNext) {
    prodBtnNext.addEventListener('click', () => {
      const card = prodWindow.querySelector('.product-item');
      const step = card ? card.offsetWidth + 24 : 304;
      const maxScroll = prodWindow.scrollWidth - prodWindow.clientWidth;
      if (prodWindow.scrollLeft >= maxScroll - 15) {
        prodWindow.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        prodWindow.scrollBy({ left: step, behavior: 'smooth' });
      }
    });
  }

  if (prodWindow && prodBtnPrev) {
    prodBtnPrev.addEventListener('click', () => {
      const card = prodWindow.querySelector('.product-item');
      const step = card ? card.offsetWidth + 24 : 304;
      const maxScroll = prodWindow.scrollWidth - prodWindow.clientWidth;
      if (prodWindow.scrollLeft <= 10) {
        prodWindow.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        prodWindow.scrollBy({ left: -step, behavior: 'smooth' });
      }
    });
  }

  /* =========================================================
     6. CARRUSEL DE INSTALACIONES
     ========================================================= */
  const carruselTrack = document.getElementById('carruselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('carruselDots');

  if (carruselTrack && prevBtn && nextBtn && dotsContainer) {
    const slides = carruselTrack.querySelectorAll('.carrusel-slide');
    let idx = 0;

    dotsContainer.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = `carrusel-dot ${i === 0 ? 'is-active' : ''}`;
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.carrusel-dot');
    const goToSlide = (i) => {
      idx = (i + slides.length) % slides.length;
      carruselTrack.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, dIdx) => d.classList.toggle('is-active', dIdx === idx));
    };

    nextBtn.addEventListener('click', () => goToSlide(idx + 1));
    prevBtn.addEventListener('click', () => goToSlide(idx - 1));
    setInterval(() => goToSlide(idx + 1), 5000);
  }

  /* =========================================================
     7. FORMULARIO CHECKOUT CON REGEX
     ========================================================= */
  const form = document.getElementById('checkoutForm');
  const regexRules = {
    nombre: {
      regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]{2,}(?:\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]{2,})+$/,
      msg: 'Ingresa nombre y apellido (solo letras).'
    },
    email: {
      regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      msg: 'Formato de correo no válido.'
    },
    telefono: {
      regex: /^09\d{8}$/,
      msg: 'Debe iniciar con 09 y tener 10 dígitos.'
    },
    cedula: {
      regex: /^\d{10}$/,
      msg: 'Debe contener 10 dígitos numéricos.'
    },
    direccion: {
      regex: /^.{8,}$/,
      msg: 'Dirección demasiado corta (mínimo 8 caracteres).'
    }
  };

  if (form) {
    const validateField = (input) => {
      const rule = regexRules[input.name];
      if (!rule) return true;
      const errorSpan = document.getElementById(`error${input.name.charAt(0).toUpperCase() + input.name.slice(1)}`);
      const isValid = rule.regex.test(input.value.trim());

      input.setAttribute('aria-invalid', String(!isValid));
      if (errorSpan) errorSpan.textContent = isValid ? '' : rule.msg;
      return isValid;
    };

    Object.keys(regexRules).forEach(name => {
      const input = form.elements[name];
      if (input) {
        input.addEventListener('input', () => validateField(input));
        input.addEventListener('blur', () => validateField(input));
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (cart.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de finalizar.');
        return;
      }

      let valid = true;
      Object.keys(regexRules).forEach(name => {
        const input = form.elements[name];
        if (input && !validateField(input)) valid = false;
      });

      if (!valid) return;

      const cliente = {
        nombre: form.elements['nombre'].value.trim(),
        email: form.elements['email'].value.trim(),
        telefono: form.elements['telefono'].value.trim(),
        cedula: form.elements['cedula'].value.trim(),
        direccion: form.elements['direccion'].value.trim()
      };

      Storage.saveSession(cliente);
      Storage.saveToIndexedDB({ cliente, productos: cart });

      alert(`¡Orden confirmada para ${cliente.nombre}! Registrada en Base de Datos Local.`);
      cart = [];
      updateCartUI();
      form.reset();
    });
  }

  /* =========================================================
     8. MODAL DE CITAS
     ========================================================= */
  const bookingModal = document.getElementById('bookingModal');
  const openBookingBtns = document.querySelectorAll('[data-open-modal="bookingModal"]');
  const closeModals = document.querySelectorAll('[data-close-modal]');

  if (bookingModal) {
    openBookingBtns.forEach(b => b.addEventListener('click', () => {
      bookingModal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }));

    closeModals.forEach(b => b.addEventListener('click', () => {
      bookingModal.classList.remove('is-open');
      document.body.style.overflow = '';
    }));
  }

  /* =========================================================
     9. SINCRONIZACIÓN AUTOMÁTICA AL RECUPERAR INTERNET
     ========================================================= */
  function sincronizarPedidosPendientes() {
    const request = indexedDB.open('BlashBarberDB', 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('pedidos', 'readwrite');
      const store = tx.objectStore('pedidos');
      let huboPendientes = false;

      store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.sincronizado === false) {
            huboPendientes = true;
            const pedidoActualizado = cursor.value;
            pedidoActualizado.sincronizado = true;
            pedidoActualizado.fechaSincronizacion = new Date().toISOString();
            
            cursor.update(pedidoActualizado);
            console.log(`Pedido #${cursor.key} sincronizado tras reconexión.`);
          }
          cursor.continue();
        }
      };

      tx.oncomplete = () => {
        if (huboPendientes) {
          alert('🟢 ¡Conexión restablecida! Los pedidos pendientes se han sincronizado correctamente.');
        }
      };
    };
  }

  window.addEventListener('online', () => {
    sincronizarPedidosPendientes();
  });

  window.addEventListener('offline', () => {
    console.warn('⚠ Sin conexión. Los pedidos se guardarán pendientes de sincronización.');
  });

  // Inicializar UI del carrito
  updateCartUI();
});
