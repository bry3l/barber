import { ProductRepository } from './repo.js';
import { StorageService } from './storage.js';
import { Cart } from './cart.js';
import { View } from './view.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  const cart = new Cart();
  const products = await ProductRepository.getProducts();
  const renderCart = () => { View.renderCart(cart, updateQuantity, removeItem); View.updateTimestamp(StorageService.getTimestamp()); };
  const addToCart = product => { cart.addItem(product); renderCart(); View.announce(`Se agregó ${product.nombre} al carrito`); };
  const updateQuantity = (id, qty) => { cart.updateQuantity(id, qty); renderCart(); };
  const removeItem = id => { cart.removeItem(id); renderCart(); View.announce('Producto eliminado del carrito'); };
  View.renderCatalog(products, addToCart); renderCart();

  const open = document.getElementById('openCartBtn'), close = document.getElementById('closeCartBtn'), drawer = document.getElementById('cartDrawer'), overlay = document.getElementById('cartOverlay');
  const toggle = value => { drawer?.classList.toggle('is-active', value); overlay?.classList.toggle('is-active', value); drawer?.setAttribute('aria-hidden', String(!value)); open?.setAttribute('aria-expanded', String(value)); };
  open?.addEventListener('click', () => toggle(true)); close?.addEventListener('click', () => toggle(false)); overlay?.addEventListener('click', () => toggle(false));
  document.getElementById('goToCheckoutBtn')?.addEventListener('click', () => toggle(false));
  document.getElementById('clearCartBtn')?.addEventListener('click', () => { if (cart.items.length && confirm('¿Vaciar carrito?')) { cart.clear(); renderCart(); } });

  const checkoutForm = document.getElementById('checkoutForm');
  checkoutForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!cart.items.length) return alert('Tu carrito está vacío.');
    const customer = Object.fromEntries(new FormData(checkoutForm).entries());
    try {
      if (!isSupabaseConfigured) throw new Error('Configura Supabase antes de registrar pedidos.');
      const userCode = `USU-${crypto.randomUUID()}`;
      const clientCode = `CLI-${crypto.randomUUID()}`;
      const { error: userError } = await supabase.from('usuarios').insert({ usu_codigo: userCode, rol_codigo: 'ROL002', usu_nombre: customer.nombre, usu_email: customer.email.toLowerCase().trim(), usu_telefono: customer.telefono });
      if (userError) throw userError;
      const { error: clientError } = await supabase.from('clientes').insert({ cli_codigo: clientCode, usu_codigo: userCode, cli_nombre: customer.nombre });
      if (clientError) throw clientError;
      const orderCode = `PED-${crypto.randomUUID()}`;
      const { error: orderError } = await supabase.from('pedidos').insert({ ped_codigo: orderCode, usu_codigo: userCode, epe_codigo: 'PEN', ten_codigo: 'RET' });
      if (orderError) throw orderError;
      const lines = cart.items.map(item => ({ ped_codigo: orderCode, pro_codigo: item.id, dpe_cantidad: item.quantity, dpe_precio_unitario: item.precio, dpe_porcentaje_iva: 15, dpe_descuento: 0 }));
      const { error: linesError } = await supabase.from('detalles_pedidos').insert(lines);
      if (linesError) throw linesError;
      StorageService.saveSessionCustomer(customer); cart.clear(); renderCart(); checkoutForm.reset(); alert(`Pedido ${orderCode} creado correctamente.`);
    } catch (error) { console.error('Error registrando pedido:', error); alert(`No se pudo registrar el pedido: ${error.message}`); }
  });

  const bookingForm = document.getElementById('bookingForm');
  const bookingModal = document.getElementById('bookingModal');
  document.querySelectorAll('[data-open-modal="bookingModal"]').forEach(btn => btn.addEventListener('click', () => bookingModal?.classList.add('is-open')));
  document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => bookingModal?.classList.remove('is-open')));
  bookingForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(bookingForm).entries());
    try {
      if (isSupabaseConfigured) {
        const { data: service } = await supabase.from('servicios').select('ser_codigo,ser_duracion_minutos,ser_precio').ilike('ser_nombre', `%${values.servicio.split(' (')[0]}%`).maybeSingle();
        const { data: barber } = await supabase.from('barberos').select('bar_codigo').eq('bar_activo', true).limit(1).maybeSingle();
        const { data: client } = await supabase.from('clientes').select('cli_codigo').limit(1).maybeSingle();
        if (service && barber && client && values.fecha && values.hora) {
          const start = new Date(`${values.fecha}T${values.hora}:00`); const end = new Date(start.getTime() + Number(service.ser_duracion_minutos || 30) * 60000);
          const { error } = await supabase.from('citas').insert({ cit_codigo: `CIT-${crypto.randomUUID()}`, cli_codigo: client.cli_codigo, bar_codigo: barber.bar_codigo, ser_codigo: service.ser_codigo, cit_inicio: start.toISOString(), cit_fin: end.toISOString(), cit_precio: service.ser_precio, eci_codigo: 'PEN', cit_observaciones: `${values.servicio} | ${values.barbero}` });
          if (error) throw error;
        }
      }
      const msg = `Hola BLASH! Quiero confirmar cita.%0A- Servicio: ${encodeURIComponent(values.servicio)}%0A- Barbero: ${encodeURIComponent(values.barbero)}%0A- Fecha: ${encodeURIComponent(values.fecha)}%0A- Hora: ${encodeURIComponent(values.hora)}`;
      window.open(`https://wa.me/593999999999?text=${msg}`, '_blank'); bookingModal?.classList.remove('is-open');
    } catch (error) { console.error('Error registrando cita:', error); alert(`No se pudo registrar la cita: ${error.message}`); }
  });
});
