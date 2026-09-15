/* =========================================================
   BLASH - Interacciones front-end (vanilla JS, sin dependencias)
   ========================================================= */

/* Evita que el navegador restaure un scroll anterior y "esconda" el hero */
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Header con sombra al hacer scroll ---------- */
  const header = document.getElementById('header');
  const onScrollHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- 2. Reveal on scroll (fade + slide up) ---------- */
  const revealItems = document.querySelectorAll('.reveal-item:not(.hero .reveal-item)');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealItems.forEach((el) => revealObserver.observe(el));

  /* ---------- 3. Slider "Antes y Después" ---------- */
  const baSlider = document.getElementById('baSlider');
  const baRange = document.getElementById('baRange');
  const baAfterWrap = document.getElementById('baAfterWrap');
  const baHandle = document.getElementById('baHandle');
  let updateBaSlider = () => {};

  if (baSlider && baRange) {
    updateBaSlider = (value = baRange.value) => {
      baAfterWrap.style.width = `${value}%`;
      baHandle.style.left = `${value}%`;
      const afterImg = baAfterWrap.querySelector('img');
      afterImg.style.setProperty('--ba-img-width', `${baSlider.clientWidth}px`);
    };
    updateBaSlider(baRange.value);
    baRange.addEventListener('input', (e) => updateBaSlider(e.target.value));
    window.addEventListener('resize', () => updateBaSlider(baRange.value));
  }

  /* ---------- 4. Acordeón de preguntas frecuentes ---------- */
  document.querySelectorAll('.faq__item').forEach((item) => {
    const question = item.querySelector('.faq__question');
    const answer = item.querySelector('.faq__answer');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq__item.is-open').forEach((openItem) => {
        openItem.classList.remove('is-open');
        openItem.querySelector('.faq__answer').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('is-open');
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  });

  /* ---------- 5. Contadores animados de estadísticas ---------- */
  const statNumbers = document.querySelectorAll('.stat__number');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.countTo);
    const decimals = Number(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = target * progress;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  statNumbers.forEach((el) => statsObserver.observe(el));

  /* ---------- 6. Sistema genérico de modales ---------- */
  const modals = document.querySelectorAll('.modal');
  const openTriggers = document.querySelectorAll('[data-open-modal]');

  const openModalById = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.classList.add('is-open');
    target.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (id === 'transformModal') {
      requestAnimationFrame(() => updateBaSlider());
    }
  };

  const closeModal = (modalEl) => {
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const closeAllModals = () => modals.forEach(closeModal);

  openTriggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.openModal === 'bookingModal') {
        currentStep = 1;
        renderStep();
      }
      openModalById(btn.dataset.openModal);
    });
  });

  modals.forEach((modalEl) => {
    modalEl.querySelectorAll('[data-close-modal]').forEach((el) => {
      el.addEventListener('click', () => closeModal(modalEl));
    });
  });

  /* ---------- 7. Pasos del modal de reserva ---------- */
  const modal = document.getElementById('bookingModal');
  const steps = modal ? modal.querySelectorAll('.modal__step') : [];
  const panels = modal ? modal.querySelectorAll('.modal__panel') : [];
  const prevBtn = document.getElementById('modalPrev');
  const nextBtn = document.getElementById('modalNext');
  const submitBtn = document.getElementById('modalSubmit');
  const bookingForm = document.getElementById('bookingForm');
  let currentStep = 1;
  const totalSteps = panels.length;

  const renderStep = () => {
    steps.forEach((s) => s.classList.toggle('is-active', Number(s.dataset.stepIndicator) === currentStep));
    panels.forEach((p) => p.classList.toggle('is-active', Number(p.dataset.panel) === currentStep));
    prevBtn.disabled = currentStep === 1;
    nextBtn.hidden = currentStep === totalSteps;
    submitBtn.hidden = currentStep !== totalSteps;
  };

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentStep < totalSteps) {
        currentStep += 1;
        renderStep();
      }
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep -= 1;
        renderStep();
      }
    });
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(bookingForm);
      const servicio = data.get('servicio');
      const barbero = data.get('barbero');
      const fecha = data.get('fecha');
      const hora = data.get('hora');

      const mensaje = `Hola, quiero reservar una cita en BLASH.%0AServicio: ${servicio}%0ABarbero: ${barbero}%0AFecha: ${fecha}%0AHora: ${hora}`;
      window.open(`https://wa.me/593999999999?text=${mensaje}`, '_blank', 'noopener');
      closeModal(modal);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
});
