import { StorageService } from './storage.js';
import { Cart } from './cart.js';
import { View } from './view.js';
import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  const cart = new Cart();
  console.log('Iniciando conexión con Supabase...');

  // Cargar productos desde Supabase
  const { data, error } = await supabase
  .from('productos')
  .select(`
    pro_codigo,
    pro_nombre,
    pro_descripcion,
    pro_precio,
    pro_precio_promocional,
    pro_activo,
    pro_vendible
  `)
  .eq('pro_activo', true)
  .eq('pro_vendible', true)
  .order('pro_nombre');

console.log('Respuesta de Supabase:', {
  data,
  error
});

if (error) {
  console.error('Error al cargar productos:', error);
  View.announce('No se pudieron cargar los productos.');
  return;
}

const products = data.map(product => ({
  id: product.pro_codigo,
  nombre: product.pro_nombre,
  descripcion: product.pro_descripcion || '',
  precio: Number(
    product.pro_precio_promocional ?? product.pro_precio
  ),
  imagen: '',
  stock: 0
}));

console.log('Productos desde Supabase:', products);

  const renderCart = () => {
    View.renderCart(cart, updateQuantity, removeItem);
    View.updateTimestamp(StorageService.getTimestamp());
  };

  const addToCart = product => {
    cart.addItem(product);
    renderCart();
    View.announce(`Se agregó ${product.nombre} al carrito`);
  };

  const updateQuantity = (productId, quantity) => {
    cart.updateQuantity(productId, quantity);
    renderCart();
  };

  const removeItem = productId => {
    cart.removeItem(productId);
    renderCart();
    View.announce('Producto eliminado del carrito');
  };

  View.renderCatalog(products, addToCart);
  renderCart();

  // Carrito lateral
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const goToCheckoutBtn = document.getElementById('goToCheckoutBtn');

  const toggleCart = open => {
    if (!cartDrawer || !cartOverlay) return;

    cartDrawer.classList.toggle('is-active', open);
    cartOverlay.classList.toggle('is-active', open);
    cartDrawer.setAttribute('aria-hidden', String(!open));

    if (openCartBtn) {
      openCartBtn.setAttribute('aria-expanded', String(open));
    }
  };

  openCartBtn?.addEventListener('click', () => toggleCart(true));
  closeCartBtn?.addEventListener('click', () => toggleCart(false));
  cartOverlay?.addEventListener('click', () => toggleCart(false));
  goToCheckoutBtn?.addEventListener('click', () => toggleCart(false));

  clearCartBtn?.addEventListener('click', () => {
    if (cart.items.length === 0) return;

    if (confirm('¿Seguro que deseas vaciar tu carrito?')) {
      cart.clear();
      renderCart();
      View.announce('El carrito fue vaciado');
    }
  });

  // Carrusel de productos
  const productsWindow = document.getElementById('productsWindow');
  const prodBtnPrev = document.getElementById('prodBtnPrev');
  const prodBtnNext = document.getElementById('prodBtnNext');

  if (productsWindow && prodBtnPrev && prodBtnNext) {
    const getStep = () => {
      const item = productsWindow.querySelector('.product-item');
      return item ? item.offsetWidth + 24 : 294;
    };

    prodBtnNext.addEventListener('click', () => {
      const max = productsWindow.scrollWidth - productsWindow.clientWidth;

      if (productsWindow.scrollLeft >= max - 10) {
        productsWindow.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        productsWindow.scrollBy({
          left: getStep(),
          behavior: 'smooth'
        });
      }
    });

    prodBtnPrev.addEventListener('click', () => {
      const max = productsWindow.scrollWidth - productsWindow.clientWidth;

      if (productsWindow.scrollLeft <= 5) {
        productsWindow.scrollTo({ left: max, behavior: 'smooth' });
      } else {
        productsWindow.scrollBy({
          left: -getStep(),
          behavior: 'smooth'
        });
      }
    });
  }

  // Carrusel de instalaciones
  const track = document.getElementById('carruselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('carruselDots');

  if (track && prevBtn && nextBtn && dotsContainer) {
    const slides = [...track.querySelectorAll('.carrusel-slide')];
    let currentIndex = 0;

    const dots = slides.map((_, index) => {
      const dot = document.createElement('span');
      dot.className = `carrusel-dot ${
        index === 0 ? 'is-active' : ''
      }`;
      dotsContainer.appendChild(dot);
      return dot;
    });

    const showSlide = index => {
      if (slides.length === 0) return;

      currentIndex = (index + slides.length) % slides.length;
      track.style.transform =
        `translateX(-${currentIndex * 100}%)`;

      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === currentIndex);
      });
    };

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => showSlide(index));
    });

    prevBtn.addEventListener('click', () => {
      showSlide(currentIndex - 1);
    });

    nextBtn.addEventListener('click', () => {
      showSlide(currentIndex + 1);
    });

    setInterval(() => showSlide(currentIndex + 1), 5000);
  }

  // Validación del checkout
  const checkoutForm = document.getElementById('checkoutForm');

  if (checkoutForm) {
    const validators = {
      nombre: {
        regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]{2,}(?:\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]{2,})+$/,
        message: 'Ingresa tu nombre y apellido.'
      },
      email: {
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        message: 'Ingresa un correo válido.'
      },
      telefono: {
        regex: /^09\d{8}$/,
        message: 'Debe tener 10 dígitos y comenzar con 09.'
      },
      cedula: {
        regex: /^\d{10}$/,
        message: 'La cédula debe tener 10 dígitos.'
      },
      direccion: {
        regex: /^.{8,}$/,
        message: 'La dirección debe tener mínimo 8 caracteres.'
      }
    };

    const validateField = input => {
      const rule = validators[input.name];
      if (!rule) return true;

      const valid = rule.regex.test(input.value.trim());
      input.setAttribute('aria-invalid', String(!valid));

      return valid;
    };

    Object.keys(validators).forEach(name => {
      const input = checkoutForm.elements[name];

      if (input) {
        input.addEventListener('input', () => validateField(input));
        input.addEventListener('blur', () => validateField(input));
      }
    });

    checkoutForm.addEventListener('submit', async event => {
      event.preventDefault();

      if (cart.items.length === 0) {
        alert('Tu carrito está vacío.');
        return;
      }

      const valid = Object.keys(validators).every(name => {
        const input = checkoutForm.elements[name];
        return input ? validateField(input) : true;
      });

      if (!valid) {
        View.announce('Revisa los campos del formulario.');
        return;
      }

      const customer = {
        nombre: checkoutForm.elements.nombre.value.trim(),
        email: checkoutForm.elements.email.value.trim(),
        telefono: checkoutForm.elements.telefono.value.trim(),
        cedula: checkoutForm.elements.cedula.value.trim(),
        direccion: checkoutForm.elements.direccion.value.trim()
      };

      StorageService.saveSessionCustomer(customer);

      const order = {
        cliente: customer,
        productos: cart.items,
        subtotal: cart.getSubtotal(),
        iva: cart.getTax(),
        total: cart.getTotal()
      };

      await StorageService.saveOrderToIndexedDB(order);

      alert(
        `¡Orden confirmada para ${customer.nombre}! ` +
        `Total: $${cart.getTotal().toFixed(2)}`
      );

      cart.clear();
      renderCart();
      checkoutForm.reset();
    });
  }

  // Modal de citas
  const bookingModal = document.getElementById('bookingModal');
  const bookingForm = document.getElementById('bookingForm');

  document
    .querySelectorAll('[data-open-modal="bookingModal"]')
    .forEach(button => {
      button.addEventListener('click', () => {
        bookingModal?.classList.add('is-open');
        bookingModal?.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    });

  document.querySelectorAll('[data-close-modal]').forEach(button => {
    button.addEventListener('click', () => {
      bookingModal?.classList.remove('is-open');
      bookingModal?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });

  if (bookingForm) {
    bookingForm.addEventListener('submit', event => {
      event.preventDefault();

      const servicio = bookingForm.elements.servicio?.value || '';
      const barbero = bookingForm.elements.barbero?.value || '';
      const fecha = bookingForm.elements.bookingDate?.value || '';
      const hora = bookingForm.elements.bookingTime?.value || '';

      const message =
        `Hola, quiero reservar una cita.%0A` +
        `Servicio: ${encodeURIComponent(servicio)}%0A` +
        `Barbero: ${encodeURIComponent(barbero)}%0A` +
        `Fecha: ${encodeURIComponent(fecha)}%0A` +
        `Hora: ${encodeURIComponent(hora)}`;

      window.open(
        `https://wa.me/593999999999?text=${message}`,
        '_blank'
      );

      bookingModal?.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  }
});
