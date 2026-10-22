import { supabase, isSupabaseConfigured } from './supabase.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
const setMessage = text => { if ($('loginMessage')) $('loginMessage').textContent = text; };
const rows = (id, html, colspan = 4) => { const node = $(id); if (node) node.innerHTML = html || `<tr><td colspan="${colspan}">Sin registros</td></tr>`; };

async function getAdminProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('usuarios').select('usu_codigo, rol_codigo, usu_nombre').eq('usu_auth_uuid', user.id).maybeSingle();
  if (error) throw error;
  return data?.rol_codigo === 'ROL001' ? data : null;
}

function renderInventory(products, inventory) {
  const byProduct = new Map(inventory.map(item => [item.pro_codigo, item]));
  rows('inventoryBody', products.map(product => {
    const item = byProduct.get(product.pro_codigo);
    const stock = Number(item?.inv_stock_actual ?? 0);
    const minimum = Number(item?.inv_stock_minimo ?? 0);
    const state = stock <= 0 ? ['Agotado', 'stock-out'] : stock <= minimum ? ['Stock bajo', 'stock-low'] : ['Disponible', 'stock-ok'];
    return `<tr><td>${esc(product.pro_sku)}</td><td>${esc(product.pro_nombre)}</td><td>$${Number(product.pro_precio).toFixed(2)}</td><td>${stock}</td><td>${minimum}</td><td class="${state[1]}">${state[0]}</td><td>${item ? `<input class="small-input" type="number" min="0" value="${stock}" data-stock-id="${item.inv_id}" data-stock-min="${minimum}"><button class="btn btn-secondary" data-save-stock="${item.inv_id}">Guardar</button>` : '<span class="muted">Sin registro</span>'}</td></tr>`;
  }).join(''), 7);
  document.querySelectorAll('[data-save-stock]').forEach(button => button.addEventListener('click', () => updateStock(button.dataset.saveStock)));
}

function renderServices(appointments) {
  const services = [
    ['SER001', 'Corte clásico', '$15.00'],
    ['SER002', 'Perfilado de barba', '$10.00'],
    ['SER003', 'Corte y barba', '$22.00']
  ];
  rows('servicesBody', services.map(([code, name, price]) => {
    const count = appointments.filter(appointment => appointment.ser_codigo === code).length;
    return `<tr><td>${name}</td><td>${price}</td><td>${count}</td><td class="status stock-ok">Activo</td></tr>`;
  }).join(''), 4);
}

function renderChart(inventory) {
  if ($('inventoryTotal')) $('inventoryTotal').textContent = inventory.reduce((total, item) => total + Number(item.inv_stock_actual || 0), 0);
  const chart = $('inventoryChart');
  const labels = $('inventoryChartLabels');
  if (!chart || !labels) return;
  const top = [...inventory].sort((a, b) => Number(b.inv_stock_actual) - Number(a.inv_stock_actual)).slice(0, 8);
  const max = Math.max(...top.map(item => Number(item.inv_stock_actual)), 1);
  chart.innerHTML = top.map(item => `<div style="flex:1;height:${Math.max(8, Number(item.inv_stock_actual) / max * 100)}%;background:${Number(item.inv_stock_actual) <= Number(item.inv_stock_minimo) ? '#e8b84e' : '#c9a24a'}" title="${esc(item.pro_codigo)}: ${item.inv_stock_actual}"></div>`).join('');
  labels.innerHTML = top.map(item => `<span style="flex:1;font-size:10px;overflow:hidden">${esc(item.pro_codigo)}</span>`).join('');
}

async function loadDashboard() {
  const results = await Promise.all([
    supabase.from('productos').select('pro_codigo, pro_sku, pro_nombre, pro_precio, pro_activo').order('pro_nombre'),
    supabase.from('pedidos').select('ped_codigo, ped_fecha, epe_codigo').order('ped_fecha', { ascending: false }).limit(50),
    supabase.from('citas').select('cit_codigo, cit_inicio, cit_fin, cit_precio, eci_codigo, ser_codigo, bar_codigo').order('cit_inicio', { ascending: false }).limit(50),
    supabase.from('inventario').select('inv_id, pro_codigo, inv_stock_actual, inv_stock_minimo'),
  ]);
  const failed = results.find(result => result.error);
  if (failed) throw failed.error;
  const [products, orders, appointments, inventory] = results.map(result => result.data || []);

  if ($('productCount')) $('productCount').textContent = products.filter(product => product.pro_activo).length;
  if ($('orderCount')) $('orderCount').textContent = orders.length;
  if ($('appointmentCount')) $('appointmentCount').textContent = appointments.length;
  if ($('lowStockCount')) $('lowStockCount').textContent = inventory.filter(item => Number(item.inv_stock_actual) <= Number(item.inv_stock_minimo)).length;

  renderChart(inventory);
  renderInventory(products, inventory);
  renderServices(appointments);
  rows('ordersBody', orders.map(order => `<tr><td>${esc(order.ped_codigo)}</td><td>${new Date(order.ped_fecha).toLocaleString('es-EC')}</td><td>${esc(order.epe_codigo)}</td></tr>`).join(''), 3);
  rows('appointmentsBody', appointments.map(appointment => `<tr><td>${esc(appointment.cit_codigo)}</td><td>${new Date(appointment.cit_inicio).toLocaleString('es-EC')}</td><td>${esc(appointment.eci_codigo)}</td></tr>`).join(''), 3);
}

async function updateStock(id) {
  const input = document.querySelector(`[data-stock-id="${id}"]`);
  if (!input) return;
  const { error } = await supabase.from('inventario').update({ inv_stock_actual: Number(input.value) }).eq('inv_id', id);
  if ($('inventoryMessage')) $('inventoryMessage').textContent = error ? error.message : 'Inventario actualizado correctamente.';
  if (!error) await loadDashboard();
}

async function showAdmin() {
  $('loginPanel')?.classList.add('hidden');
  $('adminPanel')?.classList.remove('hidden');
  await loadDashboard();
}

async function start() {
  if (!isSupabaseConfigured) return setMessage('Configura la publishable key de Supabase en js/supabase.js.');
  try { if (await getAdminProfile()) await showAdmin(); } catch (error) { setMessage(error.message); }
}

$('loginForm')?.addEventListener('submit', async event => {
  event.preventDefault(); setMessage('Iniciando sesión...');
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
    if (error) throw error;
    if (!(await getAdminProfile())) { await supabase.auth.signOut(); throw new Error('Esta cuenta no tiene rol de administrador.'); }
    await showAdmin();
  } catch (error) { setMessage(error.message); }
});

$('logoutBtn')?.addEventListener('click', async () => { await supabase.auth.signOut(); $('adminPanel')?.classList.add('hidden'); $('loginPanel')?.classList.remove('hidden'); });
$('refreshBtn')?.addEventListener('click', () => loadDashboard().catch(error => setMessage(error.message)));

$('productForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const code = `PRO-${crypto.randomUUID()}`;
  const product = { pro_codigo: code, pro_sku: $('productSku').value.trim(), pro_nombre: $('productName').value.trim(), pro_precio: Number($('productPrice').value), pro_activo: true, pro_vendible: true };
  const { error } = await supabase.from('productos').insert(product);
  if (error) { $('productMessage').textContent = error.message; return; }
  const { error: stockError } = await supabase.from('inventario').insert({ pro_codigo: code, inv_stock_actual: Number($('productStock').value), inv_stock_minimo: Number($('productMinStock').value) });
  $('productMessage').textContent = stockError ? stockError.message : 'Producto e inventario creados correctamente.';
  if (!stockError) { event.target.reset(); await loadDashboard(); }
});

start();
