/**
 * Lógica de Negocio del Carrito de Compras
 */
import { StorageService } from './storage.js';

export class Cart {
  constructor() {
    this.items = StorageService.getCart();
    this.taxRate = 0.15; // IVA Ecuador 15%
  }

  addItem(product) {
    const existing = this.items.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({
        id: product.id,
        nombre: product.nombre,
        precio: Number(product.precio),
        imagen: product.imagen,
        quantity: 1
      });
    }
    this.save();
  }

  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      const parsedQty = parseInt(quantity, 10);
      if (parsedQty > 0) {
        item.quantity = parsedQty;
      } else {
        this.removeItem(productId);
        return;
      }
      this.save();
    }
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.save();
  }

  clear() {
    this.items = [];
    this.save();
  }

  save() {
    StorageService.saveCart(this.items);
  }

  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  }

  getTax() {
    return this.getSubtotal() * this.taxRate;
  }

  getTotal() {
    return this.getSubtotal() + this.getTax();
  }
}
