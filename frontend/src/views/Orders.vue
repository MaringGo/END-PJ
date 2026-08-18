<template>
  <div class="min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">My Orders</h1>
      
      <div v-if="loading" class="flex justify-center items-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else-if="error" class="alert alert-error shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{{ error }}</span>
        <button class="btn btn-sm" @click="fetchOrders">Retry</button>
      </div>

      <div v-else-if="orders.length === 0" class="text-center py-20 bg-base-100 rounded-box shadow-sm">
        <div class="text-6xl mb-4">🧾</div>
        <h2 class="text-2xl font-semibold mb-2">No orders found</h2>
        <p class="text-base-content/70 mb-6">You haven't placed any orders yet.</p>
        <router-link to="/products" class="btn btn-primary">Start Ordering</router-link>
      </div>

      <div v-else class="space-y-6">
        <div 
          v-for="order in orders" 
          :key="order.id"
          class="card bg-base-100 shadow-sm overflow-hidden"
        >
          <div class="bg-base-300 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p class="text-sm font-semibold text-base-content/70">Order ID</p>
              <p class="font-bold">{{ order.order_code }}</p>
            </div>
            <div>
              <p class="text-sm font-semibold text-base-content/70">Date</p>
              <p class="font-bold">{{ new Date(order.created_at).toLocaleDateString() }} {{ new Date(order.created_at).toLocaleTimeString() }}</p>
            </div>
            <div>
              <p class="text-sm font-semibold text-base-content/70">Total</p>
              <p class="font-bold text-primary">฿{{ Number(order.total_price).toFixed(2) }}</p>
            </div>
            <div>
               <!-- Status Badge -->
               <div class="badge font-bold uppercase p-3" 
                    :class="{
                      'badge-warning': order.status === 'pending',
                      'badge-info': order.status === 'preparing',
                      'badge-success': order.status === 'ready' || order.status === 'completed' || order.status === 'paid'
                    }">
                 {{ order.status }}
               </div>
            </div>
          </div>
          
          <div class="p-4 border-t border-base-200">
            <h4 class="font-semibold mb-3">Order Items:</h4>
            <ul class="space-y-2">
              <li v-for="item in order.items" :key="item.id" class="flex justify-between text-sm sm:text-base">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-base-content/70">{{ item.quantity }}x</span>
                  <span>{{ item.product_name || `Product #${item.product_id}` }}</span>
                </div>
                <span class="font-medium text-base-content/80">฿{{ (item.price * item.quantity).toFixed(2) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/axios';

const orders = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchOrders = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get('/orders');
    orders.value = res.data;
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    error.value = 'Failed to load your orders. Please try again later.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchOrders();
});
</script>
