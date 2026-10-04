/**
 * Controlador Principal
 * Inicializa la aplicación, coordina el catálogo, gestiona el carrito drawer,
 * maneja el carrusel y ejecuta validaciones con Expresiones Regulares (Regex).
 */

import { ProductRepository } from './repo.js';
import { StorageService } from './storage.js';
import { Cart } from './cart.js';
import { View } from './view.js';

document.addEventListener('DOMContentLoaded', async () => {
  const cart = new Cart();

  // 1. CARGA INICIAL DE CATÁLOGO DESDE JSON
  const products = await ProductRepository.getProducts();

  const handleAddToCart = (product) => {
    cart.addItem(product);
    View.renderCart(cart, handleUpdateQty, handleRemoveItem);
    View.updateTimestamp(StorageService.getTimestamp());
    View.announce(`Se agregó ${product.nombre} al carrito de compras`);
  };

  const handleUpdateQty = (productId, qty) => {
    cart.updateQuantity(productId, qty);
    View.renderCart(cart, handleUpdateQty, handleRemoveItem);
    View.updateTimestamp(StorageService.getTimestamp());
  };

  const handleRemoveItem = (productId) => {
    cart.removeItem(productId);
    View.renderCart(cart, handleUpdateQty, handleRemoveItem);
    View.updateTimestamp(StorageService.getTimestamp());
    View.announce('Producto eliminado del carrito');
  };

  View.renderCatalog(products, handleAddToCart);
  View.renderCart(cart, handleUpdateQty, handleRemoveItem);
  View.updateTimestamp(StorageService.getTimestamp());

  // 2. PANEL LATERAL DEL CARRITO (DRAWER ACCESIBLE)
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const goToCheckoutBtn = document.getElementById('goToCheckoutBtn');

  const toggleCartDrawer = (isOpen) => {
    cartDrawer.classList.toggle('is-active', isOpen);
    cartOverlay.classList.toggle('is-active', isOpen);
    cartDrawer.setAttribute('aria-hidden', String(!isOpen));
    openCartBtn.setAttribute('aria-expanded', String(isOpen));
  };

  openCartBtn.addEventListener('click', () => toggleCartDrawer(true));
  closeCartBtn.addEventListener('click', () => toggleCartDrawer(false));
  cartOverlay.addEventListener('click', () => toggleCartDrawer(false));
  if (goToCheckoutBtn) {
    goToCheckoutBtn.addEventListener('click', () => toggleCartDrawer(false));
  }

  clearCartBtn.addEventListener('click', () => {
    if (cart.items.length === 0) return;
    if (confirm('¿Seguro que deseas vaciar tu carrito?')) {
      cart.clear();
      View.renderCart(cart, handleUpdateQty, handleRemoveItem);
      View.updateTimestamp(StorageService.getTimestamp());
      View.announce('El carrito ha sido vaciado por completo');
    }
  });

  // 3. CARRUSEL DIRECCIONAL DE PRODUCTOS
  const prodWindow = document.getElementById('productsWindow');
  const prodBtnPrev = document.getElementById('prodBtnPrev');
  const prodBtnNext = document.getElementById('prodBtnNext');

  if (prodWindow && prodBtnPrev && prodBtnNext) {
    const getScrollStep = () => {
      const item = prodWindow.querySelector('.product-item');
      return item ? item.offsetWidth + 24 : 294;
    };

    prodBtnNext.addEventListener('click', () => {
      const step = getScrollStep();
      const maxScroll = prodWindow.scrollWidth - prodWindow.clientWidth;
      if (prodWindow.scrollLeft >= maxScroll - 10) {
        prodWindow.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        prodWindow.scrollBy({ left: step, behavior: 'smooth' });
      }
    });

    prodBtnPrev.addEventListener('click', () => {
      const step = getScrollStep();
      const maxScroll = prodWindow.scrollWidth - prodWindow.clientWidth;
      if (prodWindow.scrollLeft <= 5) {
        prodWindow.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        prodWindow.scrollBy({ left: -step, behavior: 'smooth' });
      }
    });
  }

  // 4. CARRUSEL DE INSTALACIONES
  const carruselTrack = document.getElementById('carruselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('carruselDots');

  if (carruselTrack && prevBtn && nextBtn && dotsContainer) {
    const slides = carruselTrack.querySelectorAll('.carrusel-slide');
    let currentIndex = 0;

    dotsContainer.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = `carrusel-dot ${i === 0 ? 'is-active' : ''}`;
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.carrusel-dot');
    const goToSlide = (idx) => {
      currentIndex = (idx + slides.length) % slides.length;
      carruselTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === currentIndex));
    };

    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    setInterval(() => goToSlide(currentIndex + 1), 5000);
  }

  // 5. VALIDACIÓN DEL FORMULARIO CON EXPRESIONES REGULARES (REGEX)
  const checkoutForm = document.getElementById('checkoutForm');

  const validators = {
    // Nombre y Apellido: al menos dos palabras de 2 a 30 caracteres alfabéticos
    nombre: {
      regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]{2,}(?:\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]{2,})+$/,
      msg: 'Ingresa tu nombre y apellido completos (solo letras).'
    },
    // Correo: formato estándar RFC 5322 simplificado
    email: {
      regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      msg: 'Ingresa un correo electrónico válido (ejemplo@dominio.com).'
    },
    // Teléfono: celulares de Ecuador iniciando con 09 y 10 dígitos numéricos en total
    telefono: {
      regex: /^09\d{8}$/,
      msg: 'El número celular debe iniciar con 09 y tener exactamente 10 dígitos.'
    },
    // Cédula: 10 dígitos numéricos
    cedula: {
      regex: /^\d{10}$/,
      msg: 'La cédula debe contener exactamente 10 dígitos numéricos.'
    },
    // Dirección: mínimo 8 caracteres alfanuméricos con letras y números
    direccion: {
      regex: /^.{8,}$/,
      msg: 'La dirección debe tener al menos 8 caracteres.'
    }
  };

  const validateField = (input) => {
    const name = input.name;
    const rule = validators[name];
    if (!rule) return true;

    const errorSpan = document.getElementById(`error${name.charAt(0).toUpperCase() + name.slice(1)}`);
    const isValid = rule.regex.test(input.value.trim());

    if (!isValid) {
      input.setAttribute('aria-invalid', 'true');
      if (errorSpan) errorSpan.textContent = rule.msg;
    } else {
      input.setAttribute('aria-invalid', 'false');
      if (errorSpan) errorSpan.textContent = '';
    }

    return isValid;
  };

  Object.keys(validators).forEach(fieldName => {
    const input = checkoutForm.elements[fieldName];
    if (input) {
      input.addEventListener('input', () => validateField(input));
      input.addEventListener('blur', () => validateField(input));
    }
  });

  // Envío del Checkout
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (cart.items.length === 0) {
      alert('Tu carrito está vacío. Añade productos antes de procesar el pago.');
      return;
    }

    let isFormValid = true;
    Object.keys(validators).forEach(fieldName => {
      const input = checkoutForm.elements[fieldName];
      if (input && !validateField(input)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      View.announce('Hay errores en el formulario. Por favor revisa los campos en rojo.');
      return;
    }

    const customerData = {
      nombre: checkoutForm.elements['nombre'].value.trim(),
      email: checkoutForm.elements['email'].value.trim(),
      telefono: checkoutForm.elements['telefono'].value.trim(),
      cedula: checkoutForm.elements['cedula'].value.trim(),
      direccion: checkoutForm.elements['direccion'].value.trim()
    };

    // 1. Guardar en SessionStorage
    StorageService.saveSessionCustomer(customerData);

    // 2. Guardar orden en IndexedDB
    const orderData = {
      cliente: customerData,
      productos: cart.items,
      subtotal: cart.getSubtotal(),
      iva: cart.getTax(),
      total: cart.getTotal()
    };
    await StorageService.saveOrderToIndexedDB(orderData);

    // 3. Confirmación accesible y limpieza
    View.announce('Orden procesada con éxito y registrada en base de datos local');
    alert(`¡Orden confirmada para ${customerData.nombre}! Se ha guardado en IndexedDB con un total de $${cart.getTotal().toFixed(2)}.`);

    cart.clear();
    View.renderCart(cart, handleUpdateQty, handleRemoveItem);
    View.updateTimestamp(StorageService.getTimestamp());
    checkoutForm.reset();

    Object.keys(validators).forEach(fieldName => {
      const input = checkoutForm.elements[fieldName];
      if (input) input.removeAttribute('aria-invalid');
    });
  });

  // 6. MODAL DE RESERVA DE CITA
  const bookingModal = document.getElementById('bookingModal');
  const openBookingBtns = document.querySelectorAll('[data-open-modal="bookingModal"]');
  const closeModals = document.querySelectorAll('[data-close-modal]');

  openBookingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      bookingModal.classList.add('is-open');
      bookingModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  closeModals.forEach(btn => {
    btn.addEventListener('click', () => {
      bookingModal.classList.remove('is-open');
      bookingModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });

  // Paso a paso modal
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    let currentStep = 1;
    const panels = bookingModal.querySelectorAll('.modal__panel');
    const steps = bookingModal.querySelectorAll('.modal__step');
    const modalPrev = document.getElementById('modalPrev');
    const modalNext = document.getElementById('modalNext');
    const modalSubmit = document.getElementById('modalSubmit');

    const updateModalStep = (step) => {
      currentStep = step;
      panels.forEach((p, idx) => p.classList.toggle('is-active', idx + 1 === currentStep));
      steps.forEach((s, idx) => s.classList.toggle('is-active', idx + 1 === currentStep));
      modalPrev.disabled = currentStep === 1;

      if (currentStep === 3) {
        modalNext.hidden = true;
        modalSubmit.hidden = false;
      } else {
        modalNext.hidden = false;
        modalSubmit.hidden = true;
      }
    };

    modalNext.addEventListener('click', () => {
      if (currentStep < 3) updateModalStep(currentStep + 1);
    });
    modalPrev.addEventListener('click', () => {
      if (currentStep > 1) updateModalStep(currentStep - 1);
    });

    // Generar horas
    const bookingTimes = document.getElementById('bookingTimes');
    const bookingTimeInput = document.getElementById('bookingTime');
    const hours = ['09:30', '10:30', '11:30', '14:30', '15:30', '16:30', '17:30', '18:30'];
    bookingTimes.innerHTML = '';
    hours.forEach((h, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `time-option ${i === 0 ? 'is-selected' : ''}`;
      btn.textContent = h;
      if (i === 0) bookingTimeInput.value = h;
      btn.addEventListener('click', () => {
        bookingTimes.querySelectorAll('.time-option').forEach(t => t.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        bookingTimeInput.value = h;
      });
      bookingTimes.appendChild(btn);
    });

    // Generar días
    const calendarDays = document.getElementById('calendarDays');
    const bookingDateInput = document.getElementById('bookingDate');
    calendarDays.innerHTML = '';
    for (let day = 1; day <= 30; day++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `calendar-day ${day === 5 ? 'is-selected' : ''}`;
      b.textContent = day;
      if (day === 5) bookingDateInput.value = `Día ${day}`;
      b.addEventListener('click', () => {
        calendarDays.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('is-selected'));
        b.classList.add('is-selected');
        bookingDateInput.value = `Día ${day}`;
      });
      calendarDays.appendChild(b);
    }

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const servicio = bookingForm.elements['servicio'].value;
      const barbero = bookingForm.elements['barbero'].value;
      const fecha = bookingDateInput.value;
      const hora = bookingTimeInput.value;
      const msg = `Hola BLASH! Quiero confirmar cita.%0A- Servicio: ${encodeURIComponent(servicio)}%0A- Barbero: ${encodeURIComponent(barbero)}%0A- Fecha: ${encodeURIComponent(fecha)}%0A- Hora: ${encodeURIComponent(hora)}`;
      window.open(`https://wa.me/593999999999?text=${msg}`, '_blank');
      bookingModal.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  }
});
