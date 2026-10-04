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
        tx.objectStore('pedidos').add({ ...order, fecha: new Date().toISOString() });
      };
    }
  };

  /* =========================================================
     2. GESTIÓN DEL CARRITO (Añadir, eliminar, actualizar, totales)
     ========================================================= */
  let cart = Storage.getCart();

  const cartBadge = document.getElementById('cartBadgeCount');
  const cartDrawerItems = document.getElementById('cartDrawerItems');
  const cartDrawerSubtotal = document.getElementById('cartDrawerSubtotal');
  const cartDrawerTax = document.getElementById('cartDrawerTax');
  const cartDrawerTotal = document.getElementById('cartDrawerTotal');

  const updateCartUI = () => {
    Storage.saveCart(cart);

    const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.15; // 15% IVA
    const total = subtotal + tax;

    cartBadge.textContent = totalQty;

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
            <span class="cart-item__price">$${item.price.toFixed(2)} c/u</span>
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

    cartDrawerSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    cartDrawerTax.textContent = `$${tax.toFixed(2)}`;
    cartDrawerTotal.textContent = `$${total.toFixed(2)}`;
  };

  // Botones de agregar al carrito en productos
  document.querySelectorAll('.product-item').forEach(card => {
    const btn = card.querySelector('.btn-add-cart');
    btn.addEventListener('click', () => {
      const id = card.dataset.id;
      const name = card.dataset.name;
      const price = parseFloat(card.dataset.price);
      const img = card.dataset.img;

      const existing = cart.find(i => i.id === id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ id, name, price, img, quantity: 1 });
      }

      updateCartUI();
      toggleCart(true);
    });
  });

  // Delegación de eventos en el drawer del carrito (+, -, eliminar)
  cartDrawerItems.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains('btn-inc')) {
      const item = cart.find(i => i.id === id);
      if (item) item.quantity += 1;
    } else if (e.target.classList.contains('btn-dec')) {
      const item = cart.find(i => i.id === id);
      if (item) {
        item.quantity -= 1;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
      }
    } else if (e.target.classList.contains('cart-item__remove')) {
      cart = cart.filter(i => i.id !== id);
    }
    updateCartUI();
  });

  // Vaciar carrito
  document.getElementById('clearCartBtn').addEventListener('click', () => {
    if (cart.length === 0) return;
    if (confirm('¿Deseas vaciar tu carrito?')) {
      cart = [];
      updateCartUI();
    }
  });

  /* =========================================================
     3. APERTURA Y CIERRE DEL DRAWER
     ========================================================= */
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const goToCheckoutBtn = document.getElementById('goToCheckoutBtn');

  const toggleCart = (isOpen) => {
    cartDrawer.classList.toggle('is-active', isOpen);
    cartOverlay.classList.toggle('is-active', isOpen);
    cartDrawer.setAttribute('aria-hidden', String(!isOpen));
    openCartBtn.setAttribute('aria-expanded', String(isOpen));
  };

  openCartBtn.addEventListener('click', () => toggleCart(true));
  closeCartBtn.addEventListener('click', () => toggleCart(false));
  cartOverlay.addEventListener('click', () => toggleCart(false));
  if (goToCheckoutBtn) goToCheckoutBtn.addEventListener('click', () => toggleCart(false));

  /* =========================================================
     4. CARRUSEL DE PRODUCTOS (DESPLAZAMIENTO DIRECCIONAL)
     ========================================================= */
  const prodWindow = document.getElementById('productsWindow');
  const prodBtnPrev = document.getElementById('prodBtnPrev');
  const prodBtnNext = document.getElementById('prodBtnNext');

  if (prodWindow && prodBtnPrev && prodBtnNext) {
    const getStep = () => {
      const item = prodWindow.querySelector('.product-item');
      return item ? item.offsetWidth + 24 : 294;
    };

    prodBtnNext.addEventListener('click', () => {
      const step = getStep();
      const maxScroll = prodWindow.scrollWidth - prodWindow.clientWidth;
      if (prodWindow.scrollLeft >= maxScroll - 10) {
        prodWindow.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        prodWindow.scrollBy({ left: step, behavior: 'smooth' });
      }
    });

    prodBtnPrev.addEventListener('click', () => {
      const step = getStep();
      const maxScroll = prodWindow.scrollWidth - prodWindow.clientWidth;
      if (prodWindow.scrollLeft <= 5) {
        prodWindow.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        prodWindow.scrollBy({ left: -step, behavior: 'smooth' });
      }
    });
  }

  /* =========================================================
     5. CARRUSEL DE INSTALACIONES
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
     6. VALIDACIONES DE FORMULARIO CON REGEX
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

    // Guardar en sessionStorage e IndexedDB
    Storage.saveSession(cliente);
    Storage.saveToIndexedDB({ cliente, productos: cart });

    alert(`¡Orden confirmada para ${cliente.nombre}! Registrada en Base de Datos Local.`);
    cart = [];
    updateCartUI();
    form.reset();
  });

  /* =========================================================
     7. MODAL DE CITAS
     ========================================================= */
  const bookingModal = document.getElementById('bookingModal');
  const openBookingBtns = document.querySelectorAll('[data-open-modal="bookingModal"]');
  const closeModals = document.querySelectorAll('[data-close-modal]');

  openBookingBtns.forEach(b => b.addEventListener('click', () => {
    bookingModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }));

  closeModals.forEach(b => b.addEventListener('click', () => {
    bookingModal.classList.remove('is-open');
    document.body.style.overflow = '';
  }));

  // Inicializar UI del carrito
  updateCartUI();
});
