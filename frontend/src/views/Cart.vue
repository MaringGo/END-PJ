<template>
  <div class="min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">Your Cart</h1>
      
      <div v-if="cartStore.itemCount === 0" class="text-center py-20 bg-base-100 rounded-box shadow-sm">
        <div class="text-6xl mb-4">🛒</div>
        <h2 class="text-2xl font-semibold mb-2">Your cart is empty</h2>
        <p class="text-base-content/70 mb-6">Looks like you haven't added any dishes yet.</p>
        <router-link to="/products" class="btn btn-primary">Browse Menu</router-link>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Cart Items -->
        <div class="lg:col-span-2 space-y-4">
          <div 
            v-for="item in cartStore.items" 
            :key="item.id"
            class="card bg-base-100 shadow-sm sm:flex-row items-center p-4 gap-4"
          >
            <!-- Simulated item image -->
            <div class="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center text-3xl shrink-0">
              🍲
            </div>
            
            <div class="flex-1 text-center sm:text-left">
              <h3 class="font-bold text-lg">{{ item.name }}</h3>
              <p class="text-primary font-semibold">฿{{ Number(item.price).toFixed(2) }}</p>
            </div>
            
            <div class="flex items-center gap-2 mt-4 sm:mt-0">
              <button class="btn btn-circle btn-sm btn-outline" @click="updateQuantity(item.id, item.quantity - 1)">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
              </button>
              <span class="w-8 text-center font-semibold">{{ item.quantity }}</span>
              <button class="btn btn-circle btn-sm btn-outline" @click="updateQuantity(item.id, item.quantity + 1)">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            
            <button class="btn btn-ghost text-error mt-2 sm:mt-0" @click="removeItem(item.id)">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <div class="card bg-base-100 shadow-sm sticky top-24">
            <div class="card-body">
              <h2 class="card-title mb-4">Order Summary</h2>
              
              <div class="space-y-2 border-b border-base-200 pb-4 mb-4">
                <div class="flex justify-between">
                  <span class="text-base-content/70">Subtotal ({{cartStore.itemCount}} items)</span>
                  <span>฿{{ Number(cartStore.totalPrice).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/70">Tax (7%)</span>
                  <span>฿{{ (Number(cartStore.totalPrice) * 0.07).toFixed(2) }}</span>
                </div>
              </div>
              
              <div class="flex justify-between font-bold text-xl mb-6">
                <span>Total</span>
                <span class="text-primary">฿{{ (Number(cartStore.totalPrice) * 1.07).toFixed(2) }}</span>
              </div>
              
              <button 
                class="btn btn-primary w-full shadow-md hover:shadow-lg"
                @click="processCheckout"
                :disabled="isProcessing"
              >
                <span v-if="isProcessing" class="loading loading-spinner"></span>
                {{ isProcessing ? 'Processing...' : 'Proceed to Checkout' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Payment Modal -->
    <dialog id="qr_modal" class="modal">
      <div class="modal-box text-center">
        <h3 class="font-bold text-lg mb-2">Scan to Pay</h3>
        <p class="py-4 text-base-content/70">Scan the QR code below with your banking app to complete the payment for order <span class="font-bold text-base-content">{{ createdOrderCode }}</span></p>
        
        <div class="flex justify-center my-6">
          <div class="bg-white p-4 rounded-xl border-4 border-primary inline-block">
            <!-- Simulated QR Code -->
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=restaurant-payment" alt="QR Code" class="w-48 h-48" />
          </div>
        </div>
        
        <p class="font-bold text-2xl text-primary mb-6">฿{{ (Number(cartStore.totalPrice) * 1.07).toFixed(2) }}</p>
        
        <div class="modal-action justify-center">
          <button class="btn btn-primary" @click="confirmPayment">I have paid</button>
          <button class="btn btn-ghost" @click="closeModal">Cancel Order</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import api from '../api/axios';

const cartStore = useCartStore();
const router = useRouter();

const isProcessing = ref(false);
const createdOrderCode = ref('');
let currentOrderId = null;

const updateQuantity = (id, newQuantity) => {
  cartStore.updateQuantity(id, newQuantity);
};

const removeItem = (id) => {
  cartStore.removeFromCart(id);
};

const processCheckout = async () => {
  isProcessing.value = true;
  try {
    const orderItems = cartStore.items.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    const response = await api.post('/orders', {
      items: orderItems,
      total_price: Number(cartStore.totalPrice) * 1.07 // including tax
    });

    currentOrderId = response.data.id;
    createdOrderCode.value = response.data.order_code;
    
    // Open QR Modal
    document.getElementById('qr_modal').showModal();
    
  } catch (error) {
    console.error('Checkout failed:', error);
    alert('Failed to process checkout. Are you logged in?');
  } finally {
    isProcessing.value = false;
  }
};

const confirmPayment = async () => {
  try {
    // In a real app, we might verify payment status here or the backend webhooks would do it.
    // For demo, we just mark it as paid via API
    await api.post(`/payments/create`, {
        order_id: currentOrderId,
        amount: Number(cartStore.totalPrice) * 1.07,
        payment_method: 'promptpay',
        payment_status: 'paid'
    });
    
    // Clear cart
    cartStore.clearCart();
    document.getElementById('qr_modal').close();
    
    // Redirect to orders
    router.push('/orders');
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    alert('Failed to confirm payment.');
  }
};

const closeModal = () => {
  document.getElementById('qr_modal').close();
};
</script>
