/**
 * Módulo de Persistencia Multi-Capa
 * Implementa localStorage, sessionStorage, Cookies e IndexedDB.
 */

const DB_NAME = 'BlashStoreDB';
const DB_VERSION = 1;
const STORE_NAME = 'ordenes_compra';

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export const StorageService = {
  // 1. LOCALSTORAGE: Carrito persistente
  saveCart(items) {
    localStorage.setItem('blash_cart', JSON.stringify(items));
    this.updateTimestamp();
  },

  getCart() {
    const raw = localStorage.getItem('blash_cart');
    return raw ? JSON.parse(raw) : [];
  },

  // 2. SESSIONSTORAGE: Datos del cliente activo en sesión
  saveSessionCustomer(customerData) {
    sessionStorage.setItem('blash_active_customer', JSON.stringify(customerData));
  },

  getSessionCustomer() {
    const raw = sessionStorage.getItem('blash_active_customer');
    return raw ? JSON.parse(raw) : null;
  },

  // 3. COOKIES: Marca temporal accesible desde navegador
  setCookie(name, value, days = 7) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
  },

  getCookie(name) {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let c of ca) {
      c = c.trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
    return null;
  },

  // 4. INDEXEDDB: Base de datos transaccional para pedidos
  async saveOrderToIndexedDB(orderData) {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.add({ ...orderData, fechaRegistro: new Date().toISOString() });

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error('Error al guardar orden en IndexedDB:', err);
    }
  },

  // Marca de tiempo registrada en localStorage y cookies
  updateTimestamp() {
    const now = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
    localStorage.setItem('blash_last_sync', now);
    this.setCookie('blash_last_sync_cookie', now);
  },

  getTimestamp() {
    return localStorage.getItem('blash_last_sync') || this.getCookie('blash_last_sync_cookie') || 'Sin cambios recientes';
  }
};
