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

  if (baSlider && baRange) {
    const updateBaSlider = (value) => {
      baAfterWrap.style.width = `${value}%`;
      baHandle.style.left = `${value}%`;
      const afterImg = baAfterWrap.querySelector('img');
      afterImg.style.setProperty('--ba-img-width', `${baSlider.clientWidth}px`);
    };
    updateBaSlider(baRange.value);
    baRange.addEventListener('input', (e) => updateBaSlider(e.target.value));
    window.addEventListener('resize', () => updateBaSlider(baRange.value));
  }

  /* ---------- 4. Modal de reserva en 3 pasos ---------- */
  const modal = document.getElementById('bookingModal');
  const openTriggers = document.querySelectorAll('[data-open-modal]');
  const closeTriggers = modal ? modal.querySelectorAll('[data-close-modal]') : [];
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

  const openModal = () => {
    if (!modal) return;
    currentStep = 1;
    renderStep();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  openTriggers.forEach((btn) => btn.addEventListener('click', openModal));
  closeTriggers.forEach((el) => el.addEventListener('click', closeModal));

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
      closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});
