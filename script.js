document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     1. CARRUSEL DE PRODUCTOS (Flechas funcionales)
     ========================================================= */
  const productsTrack = document.getElementById('productsTrack');
  const productsPrev = document.getElementById('productsPrev');
  const productsNext = document.getElementById('productsNext');

  if (productsTrack && productsPrev && productsNext) {
    let currentProductIndex = 0;

    const getScrollStep = () => {
      const firstItem = productsTrack.querySelector('.product-item');
      if (!firstItem) return 304;
      // Ancho del item + gap (24px)
      return firstItem.offsetWidth + 24;
    };

    const getMaxIndex = () => {
      const items = productsTrack.querySelectorAll('.product-item');
      const windowWidth = productsTrack.parentElement.offsetWidth;
      const totalWidth = items.length * getScrollStep();
      const visibleItems = Math.floor(windowWidth / getScrollStep());
      return Math.max(0, items.length - (visibleItems > 0 ? visibleItems : 1));
    };

    const updateProductPosition = () => {
      const step = getScrollStep();
      productsTrack.style.transform = `translateX(-${currentProductIndex * step}px)`;
    };

    productsNext.addEventListener('click', () => {
      const maxIndex = getMaxIndex();
      if (currentProductIndex < maxIndex) {
        currentProductIndex++;
      } else {
        currentProductIndex = 0; // Regresa al inicio
      }
      updateProductPosition();
    });

    productsPrev.addEventListener('click', () => {
      if (currentProductIndex > 0) {
        currentProductIndex--;
      } else {
        currentProductIndex = getMaxIndex(); // Va al final
      }
      updateProductPosition();
    });

    window.addEventListener('resize', () => {
      currentProductIndex = 0;
      updateProductPosition();
    });
  }

  /* =========================================================
     2. CARRUSEL DE INSTALACIONES (Slider con Dots y Flechas)
     ========================================================= */
  const carruselTrack = document.getElementById('carruselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('carruselDots');

  if (carruselTrack && prevBtn && nextBtn && dotsContainer) {
    const slides = carruselTrack.querySelectorAll('.carrusel-slide');
    let currentIndex = 0;
    let autoPlayTimer = null;

    // Crear dots dinámicamente según la cantidad de imágenes
    dotsContainer.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.classList.add('carrusel-dot');
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', () => {
        goToSlide(i);
        restartAutoPlay();
      });
      dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.carrusel-dot');

    const goToSlide = (index) => {
      currentIndex = (index + slides.length) % slides.length;
      carruselTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach((d, idx) => d.classList.toggle('is-active', idx === currentIndex));
    };

    nextBtn.addEventListener('click', () => {
      goToSlide(currentIndex + 1);
      restartAutoPlay();
    });

    prevBtn.addEventListener('click', () => {
      goToSlide(currentIndex - 1);
      restartAutoPlay();
    });

    const startAutoPlay = () => {
      autoPlayTimer = setInterval(() => goToSlide(currentIndex + 1), 4500);
    };

    const restartAutoPlay = () => {
      clearInterval(autoPlayTimer);
      startAutoPlay();
    };

    startAutoPlay();
  }

  /* =========================================================
     3. SLIDER ANTES Y DESPUÉS (Arrastre interactivo)
     ========================================================= */
  const baRange = document.getElementById('baRange');
  const baAfterWrap = document.getElementById('baAfterWrap');
  const baHandle = document.getElementById('baHandle');
  const baSlider = document.getElementById('baSlider');

  if (baRange && baAfterWrap && baHandle && baSlider) {
    const syncSlider = () => {
      const val = baRange.value;
      baAfterWrap.style.width = `${val}%`;
      baHandle.style.left = `${val}%`;
      // Ajusta la imagen recortada para evitar distorsión
      baAfterWrap.querySelector('.ba-slider__img').style.width = `${baSlider.offsetWidth}px`;
    };

    baRange.addEventListener('input', syncSlider);
    window.addEventListener('resize', syncSlider);
    syncSlider();
  }

  /* =========================================================
     4. CONTROL DE MODALES (Abrir / Cerrar)
     ========================================================= */
  const openButtons = document.querySelectorAll('[data-open-modal]');
  const closeElements = document.querySelectorAll('[data-close-modal]');

  const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Si abre el modal de antes y después, recalcular medidas
    if (modalId === 'transformModal' && baRange) {
      setTimeout(() => {
        baRange.dispatchEvent(new Event('input'));
      }, 50);
    }
  };

  const closeModal = (modal) => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  openButtons.forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.openModal));
  });

  closeElements.forEach(el => {
    el.addEventListener('click', () => closeModal(el.closest('.modal')));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openM = document.querySelector('.modal.is-open');
      if (openM) closeModal(openM);
    }
  });

  /* =========================================================
     5. LÓGICA DE RESERVA EN 3 PASOS & CALENDARIO
     ========================================================= */
  const bookingModal = document.getElementById('bookingModal');
  if (bookingModal) {
    let currentStep = 1;
    const maxStep = 3;

    const panels = bookingModal.querySelectorAll('.modal__panel');
    const stepIndicators = bookingModal.querySelectorAll('.modal__step');
    const btnPrev = document.getElementById('modalPrev');
    const btnNext = document.getElementById('modalNext');
    const btnSubmit = document.getElementById('modalSubmit');
    const bookingForm = document.getElementById('bookingForm');
    const bookingTimes = document.getElementById('bookingTimes');
    const calendarDays = document.getElementById('calendarDays');
    const calendarTitle = document.getElementById('calendarTitle');
    const inputFecha = document.getElementById('bookingDate');
    const inputHora = document.getElementById('bookingTime');

    // Horas disponibles por defecto
    const availableHours = ['09:30', '10:30', '11:30', '12:30', '14:30', '15:30', '16:30', '17:30', '18:30'];
    bookingTimes.innerHTML = '';
    availableHours.forEach((hour, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `time-option ${i === 1 ? 'is-selected' : ''}`;
      btn.textContent = hour;
      if (i === 1) inputHora.value = hour;
      btn.addEventListener('click', () => {
        bookingTimes.querySelectorAll('.time-option').forEach(t => t.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        inputHora.value = hour;
      });
      bookingTimes.appendChild(btn);
    });

    // Calendario simple actual
    const today = new Date();
    let displayMonth = today.getMonth();
    let displayYear = today.getFullYear();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const renderCalendar = () => {
      calendarTitle.textContent = `${months[displayMonth]} ${displayYear}`;
      calendarDays.innerHTML = '';
      const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'calendar-day';
        btn.textContent = day;

        const isToday = day === today.getDate() && displayMonth === today.getMonth();
        if (isToday) {
          btn.classList.add('is-selected');
          inputFecha.value = `${day} de ${months[displayMonth]}`;
        }

        btn.addEventListener('click', () => {
          calendarDays.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('is-selected'));
          btn.classList.add('is-selected');
          inputFecha.value = `${day} de ${months[displayMonth]}`;
        });
        calendarDays.appendChild(btn);
      }
    };
    renderCalendar();

    const updateStep = (step) => {
      currentStep = step;
      panels.forEach((p, idx) => p.classList.toggle('is-active', idx + 1 === currentStep));
      stepIndicators.forEach((s, idx) => s.classList.toggle('is-active', idx + 1 === currentStep));

      btnPrev.disabled = currentStep === 1;
      if (currentStep === maxStep) {
        btnNext.hidden = true;
        btnSubmit.hidden = false;
      } else {
        btnNext.hidden = false;
        btnSubmit.hidden = true;
      }
    };

    btnNext.addEventListener('click', () => {
      if (currentStep < maxStep) updateStep(currentStep + 1);
    });

    btnPrev.addEventListener('click', () => {
      if (currentStep > 1) updateStep(currentStep - 1);
    });

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const servicio = bookingForm.elements['servicio'].value;
      const barbero = bookingForm.elements['barbero'].value;
      const fecha = inputFecha.value || 'Por definir';
      const hora = inputHora.value || 'Por definir';

      const texto = `Hola BLASH! Quiero agendar una cita.%0A- Servicio: ${encodeURIComponent(servicio)}%0A- Barbero: ${encodeURIComponent(barbero)}%0A- Fecha: ${encodeURIComponent(fecha)}%0A- Hora: ${encodeURIComponent(hora)}`;
      window.open(`https://wa.me/593999999999?text=${texto}`, '_blank');
      closeModal(bookingModal);
    });
  }

  /* =========================================================
     6. FAQ ACORDEÓN & HEADER CON SCROLL
     ========================================================= */
  const faqQuestions = document.querySelectorAll('.faq__question');
  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const answer = item.querySelector('.faq__answer');
      const isOpen = item.classList.contains('is-open');

      document.querySelectorAll('.faq__item').forEach(other => {
        other.classList.remove('is-open');
        other.querySelector('.faq__answer').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('is-open');
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  });

  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  });

  // Animación de aparición en scroll
  const reveals = document.querySelectorAll('.reveal-item:not(.hero .reveal-item)');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  reveals.forEach(el => observer.observe(el));
});
