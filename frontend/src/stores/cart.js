import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
  }),
  getters: {
    itemCount: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
    totalPrice: (state) => state.items.reduce((total, item) => total + (item.price * item.quantity), 0),
  },
  actions: {
    addToCart(product) {
      const existingItem = this.items.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        this.items.push({ ...product, quantity: 1 });
      }
      this.saveToStorage();
    },
    removeFromCart(productId) {
      this.items = this.items.filter(item => item.id !== productId);
      this.saveToStorage();
    },
    updateQuantity(productId, quantity) {
      const item = this.items.find(item => item.id === productId);
      if (item) {
        item.quantity = quantity;
        if (item.quantity <= 0) {
          this.removeFromCart(productId);
        }
      }
      this.saveToStorage();
    },
    clearCart() {
      this.items = [];
      this.saveToStorage();
    },
    loadFromStorage() {
      const savedCart = localStorage.getItem('cart');
      if (savedCart && savedCart !== 'undefined') {
        try {
          this.items = JSON.parse(savedCart);
        } catch (e) {
          console.error('Failed to parse cart from localStorage', e);
          this.items = [];
        }
      }
    },
    saveToStorage() {
      localStorage.setItem('cart', JSON.stringify(this.items));
    }
  }
});
