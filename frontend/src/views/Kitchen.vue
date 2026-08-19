<template>
  <div class="min-h-screen bg-base-200 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">ระบบจัดการออเดอร์ (Kitchen Display)</h1>
        <button class="btn btn-outline btn-sm" @click="fetchOrders">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          รีเฟรช
        </button>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else-if="error" class="alert alert-error shadow-lg mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{{ error }}</span>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        <!-- Pending Column -->
        <div class="bg-base-100 rounded-box shadow-sm p-4 min-h-[500px]">
          <h2 class="text-xl font-bold mb-4 flex items-center justify-between">
            <span class="text-warning">ออเดอร์ใหม่ (Pending)</span>
            <div class="badge badge-warning">{{ pendingOrders.length }}</div>
          </h2>
          
          <div v-if="pendingOrders.length === 0" class="text-center py-10 text-base-content/50">
            ไม่มีออเดอร์ใหม่
          </div>
          
          <div class="space-y-4">
            <div v-for="order in pendingOrders" :key="order.id" class="card bg-base-200 shadow-sm border-l-4 border-warning">
              <div class="card-body p-4">
                <div class="flex justify-between items-start mb-2">
                  <span class="font-bold text-lg">{{ order.order_code }}</span>
                  <span class="text-xs text-base-content/70">{{ formatTime(order.created_at) }}</span>
                </div>
                
                <ul class="space-y-1 mb-4">
                  <li v-for="item in order.items" :key="item.id" class="flex justify-between text-sm">
                    <span class="font-semibold">{{ item.quantity }}x {{ item.product_name || `Item #${item.product_id}` }}</span>
                  </li>
                </ul>
                
                <div class="card-actions justify-end">
                  <button class="btn btn-warning btn-sm" @click="updateStatus(order.id, 'preparing')" :disabled="isUpdating === order.id">
                    <span v-if="isUpdating === order.id" class="loading loading-spinner loading-xs"></span>
                    เริ่มทำอาหาร
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preparing Column -->
        <div class="bg-base-100 rounded-box shadow-sm p-4 min-h-[500px]">
          <h2 class="text-xl font-bold mb-4 flex items-center justify-between">
            <span class="text-info">กำลังปรุง (Preparing)</span>
            <div class="badge badge-info">{{ preparingOrders.length }}</div>
          </h2>
          
          <div v-if="preparingOrders.length === 0" class="text-center py-10 text-base-content/50">
            ไม่มีออเดอร์ที่กำลังปรุง
          </div>
          
          <div class="space-y-4">
            <div v-for="order in preparingOrders" :key="order.id" class="card bg-base-200 shadow-sm border-l-4 border-info">
              <div class="card-body p-4">
                <div class="flex justify-between items-start mb-2">
                  <span class="font-bold text-lg">{{ order.order_code }}</span>
                  <span class="text-xs text-base-content/70">{{ formatTime(order.created_at) }}</span>
                </div>
                
                <ul class="space-y-1 mb-4">
                  <li v-for="item in order.items" :key="item.id" class="flex justify-between text-sm">
                    <span class="font-semibold">{{ item.quantity }}x {{ item.product_name || `Item #${item.product_id}` }}</span>
                  </li>
                </ul>
                
                <div class="card-actions justify-end">
                  <button class="btn btn-info btn-sm text-white" @click="updateStatus(order.id, 'ready')" :disabled="isUpdating === order.id">
                    <span v-if="isUpdating === order.id" class="loading loading-spinner loading-xs"></span>
                    เสร็จสิ้น / พร้อมเสิร์ฟ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '../api/axios';

const orders = ref([]);
const loading = ref(true);
const error = ref(null);
const isUpdating = ref(null);
let pollingInterval = null;

const pendingOrders = computed(() => {
  return orders.value.filter(o => o.status === 'pending');
});

const preparingOrders = computed(() => {
  return orders.value.filter(o => o.status === 'preparing');
});

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

const fetchOrders = async () => {
  try {
    const res = await api.get('/orders');
    orders.value = res.data;
    error.value = null;
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    error.value = 'ไม่สามารถดึงข้อมูลออเดอร์ได้';
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (orderId, newStatus) => {
  isUpdating.value = orderId;
  try {
    await api.put(`/orders/${orderId}/status`, { status: newStatus });
    await fetchOrders(); // refresh after update
  } catch (err) {
    console.error('Failed to update order status:', err);
    alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
  } finally {
    isUpdating.value = null;
  }
};

onMounted(() => {
  fetchOrders();
  // Auto refresh every 30 seconds
  pollingInterval = setInterval(fetchOrders, 30000);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
</script>
