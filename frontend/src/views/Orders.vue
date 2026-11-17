<template>
  <div class="min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto">
      
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold">ประวัติและการติดตามคำสั่งซื้อ</h1>
          <p class="text-base-content/70 mt-1">ติดตามสถานะอาหารตั้งแต่รับออเดอร์จนถึงการชำระเงินเมื่อทานเสร็จ</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="fetchOrders" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          รีเฟรชสถานะ
        </button>
      </div>
      
      <!-- Guest Search Box -->
      <div v-if="!authStore.isAuthenticated" class="mb-8 p-6 bg-base-100 rounded-2xl shadow-sm border border-base-200 flex flex-col md:flex-row gap-4 items-end">
        <div class="form-control w-full md:w-auto md:flex-1">
          <label class="label">
            <span class="label-text font-bold">🔍 ค้นหาด้วยหมายเลขคำสั่งซื้อ (Order Code)</span>
          </label>
          <input type="text" v-model="searchQuery" placeholder="เช่น ORD-1724065600000" class="input input-bordered w-full" @keyup.enter="searchOrder" />
        </div>
        <button class="btn btn-primary w-full md:w-auto" @click="searchOrder" :disabled="!searchQuery">ติดตามสถานะ</button>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else-if="error" class="alert alert-error shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{{ error }}</span>
        <button class="btn btn-sm" @click="fetchOrders">ลองใหม่</button>
      </div>

      <div v-else-if="orders.length === 0" class="text-center py-20 bg-base-100 rounded-3xl shadow-sm border border-base-200">
        <div class="text-6xl mb-4">🧾</div>
        <h2 class="text-2xl font-semibold mb-2">ไม่พบรายการสั่งซื้อ</h2>
        <p class="text-base-content/70 mb-6" v-if="authStore.isAuthenticated">คุณยังไม่มีรายการสั่งซื้ออาหารในระบบ</p>
        <p class="text-base-content/70 mb-6" v-else>กรุณากรอกหมายเลขคำสั่งซื้อด้านบนเพื่อติดตามสถานะ</p>
        <router-link to="/products" class="btn btn-primary">เริ่มสั่งอาหารได้เลย</router-link>
      </div>

      <div v-else class="space-y-8">
        <div 
          v-for="order in orders" 
          :key="order.id"
          class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden"
        >
          <!-- Order Header Bar -->
          <div class="bg-base-200 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="badge badge-primary font-bold px-3 py-2 text-sm">📍 {{ order.table_no || 'ไม่ระบุโต๊ะ' }}</span>
                <span class="text-xs text-base-content/60 font-mono">{{ order.order_code }}</span>
              </div>
              <p class="text-xs text-base-content/70">
                สั่งเมื่อ: {{ new Date(order.created_at).toLocaleDateString('th-TH') }} {{ new Date(order.created_at).toLocaleTimeString('th-TH') }}
              </p>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="text-right">
                <p class="text-xs text-base-content/70">ยอดรวมทั้งสิ้น</p>
                <p class="font-extrabold text-2xl text-primary">฿{{ Number(order.total_price).toFixed(2) }}</p>
              </div>
              <div class="badge font-bold p-3" :class="getStatusBadgeClass(order.status)">
                {{ translateStatus(order.status) }}
              </div>
            </div>
          </div>
          
          <div class="p-5 sm:p-6 space-y-6">
            
            <!-- 6-Step Workflow Stepper / Progress Bar -->
            <div>
              <div class="text-xs font-bold text-base-content/60 uppercase mb-3">ขั้นตอนสถานะอาหาร:</div>
              <ul class="steps steps-vertical sm:steps-horizontal w-full text-xs font-semibold">
                <li class="step" :class="getStepClass(order.status, 1)">1. รับออเดอร์</li>
                <li class="step" :class="getStepClass(order.status, 2)">2. ยืนยันแล้ว</li>
                <li class="step" :class="getStepClass(order.status, 3)">3. กำลังลงมือทำ</li>
                <li class="step" :class="getStepClass(order.status, 4)">4. รอเสิร์ฟ</li>
                <li class="step" :class="getStepClass(order.status, 5)">5. เสิร์ฟสำเร็จ</li>
                <li class="step" :class="getStepClass(order.status, 6)">6. จ่ายตังแล้ว</li>
              </ul>
            </div>

            <!-- Items Table -->
            <div class="border-t border-base-200 pt-4">
              <h4 class="font-bold mb-3 text-sm">รายการอาหารที่สั่ง:</h4>
              <ul class="space-y-2">
                <li v-for="item in order.items" :key="item.id" class="flex justify-between text-sm sm:text-base py-1 border-b border-base-200/50">
                  <div class="flex items-center gap-2">
                    <span class="badge badge-ghost font-bold">{{ item.quantity }}x</span>
                    <span class="font-medium">{{ item.product_name || `รายการอาหาร #${item.product_id}` }}</span>
                  </div>
                  <span class="font-bold text-base-content/80">฿{{ (item.price * item.quantity).toFixed(2) }}</span>
                </li>
              </ul>
            </div>

            <!-- Payment Action Box: When served and unpaid -->
            <div v-if="order.payment_status !== 'paid' && order.status !== 'cancelled'" class="bg-base-200/60 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p class="font-bold text-base">
                  {{ order.status === 'served' ? '🍽️ ทานอาหารเสร็จแล้ว? ชำระเงินได้ทันที' : '💳 การชำระเงิน (ชำระหลังรับประทานเสร็จ)' }}
                </p>
                <p class="text-xs text-base-content/70">
                  สแกนชำระผ่าน PromptPay QR Code ยอด ฿{{ Number(order.total_price).toFixed(2) }}
                </p>
              </div>

              <!-- Button to pay -->
              <button 
                class="btn btn-primary w-full sm:w-auto px-6 shadow-md"
                :class="{'animate-pulse': order.status === 'served'}"
                @click="openCustomerPayModal(order)"
              >
                💳 สแกนชำระเงินตอนนี้
              </button>
            </div>

            <!-- Paid Confirmation Banner -->
            <div v-else-if="order.payment_status === 'paid'" class="alert alert-success text-white py-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>✓ ชำระเงินเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ!</span>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Customer Payment Modal (PromptPay QR) -->
    <dialog id="customer_pay_modal" class="modal">
      <div class="modal-box text-center max-w-md">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" @click="closeCustomerPayModal">✕</button>
        </form>

        <h3 class="font-bold text-2xl mb-1">สแกนชำระเงินค่าอาหาร</h3>
        <p class="text-sm text-base-content/70 mb-4 font-semibold">
          {{ selectedOrder?.table_no }} • {{ selectedOrder?.order_code }}
        </p>

        <!-- QR Display -->
        <div class="bg-white p-4 rounded-2xl border-4 border-primary inline-block shadow-md my-2">
          <img src="/qr-payment.png" alt="PromptPay QR Code" class="w-48 object-contain mx-auto" />
        </div>

        <p class="font-extrabold text-3xl text-primary my-4">
          ฿{{ Number(selectedOrder?.total_price || 0).toFixed(2) }}
        </p>

        <p class="text-xs text-base-content/60 mb-6">
          สแกนผ่านแอปธนาคารใดก็ได้ แล้วกดปุ่ม "ฉันชำระเงินเรียบร้อยแล้ว" ด้านล่าง
        </p>

        <div class="modal-action flex-col gap-2">
          <button 
            class="btn btn-primary w-full shadow-md text-base"
            @click="confirmCustomerPayment"
            :disabled="isPaying"
          >
            <span v-if="isPaying" class="loading loading-spinner"></span>
            ✓ ฉันชำระเงินเรียบร้อยแล้ว
          </button>
          <button class="btn btn-ghost w-full" @click="closeCustomerPayModal">
            ไว้ชำระภายหลัง
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeCustomerPayModal">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import api from '../api/axios';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const orders = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const selectedOrder = ref(null);
const isPaying = ref(false);
let pollingInterval = null;

const fetchOrders = async () => {
  if (authStore.isAuthenticated) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/orders');
      orders.value = res.data;
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      error.value = 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง';
    } finally {
      loading.value = false;
    }
  } else {
    // Guest tracking
    const guestOrders = JSON.parse(localStorage.getItem('guest_orders') || '[]');
    if (guestOrders.length > 0) {
      loading.value = true;
      try {
        const fetchPromises = guestOrders.map(code => api.get(`/orders/track/${code}`).catch(() => null));
        const responses = await Promise.all(fetchPromises);
        orders.value = responses.map(res => res ? res.data : null).filter(Boolean).reverse();
      } catch (err) {
        console.error('Failed to fetch guest orders', err);
      } finally {
        loading.value = false;
      }
    }
  }
};

const searchOrder = async () => {
  if (!searchQuery.value) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get(`/orders/track/${searchQuery.value}`);
    orders.value = [res.data];
  } catch (err) {
    error.value = 'ไม่พบคำสั่งซื้อหมายเลขนี้';
    orders.value = [];
  } finally {
    loading.value = false;
  }
};

const translateStatus = (status) => {
  const map = {
    'pending': 'รับออเดอร์แล้ว (รอยืนยัน)',
    'confirmed': 'ยืนยันออเดอร์แล้ว',
    'preparing': 'กำลังลงมือทำอาหาร',
    'ready': 'อาหารเสร็จ รอเสิร์ฟ',
    'served': 'เสิร์ฟแล้ว (กำลังรับประทาน)',
    'completed': 'ชำระเงินแล้ว (เสร็จสิ้น)',
    'cancelled': 'ยกเลิกออเดอร์'
  };
  return map[status] || status;
};

const getStatusBadgeClass = (status) => {
  const map = {
    'pending': 'badge-warning text-white',
    'confirmed': 'badge-info text-white',
    'preparing': 'badge-primary text-white',
    'ready': 'badge-secondary text-white',
    'served': 'badge-accent text-white',
    'completed': 'badge-success text-white',
    'cancelled': 'badge-error text-white'
  };
  return map[status] || 'badge-ghost';
};

const getStepNumber = (status) => {
  switch (status) {
    case 'pending': return 1;
    case 'confirmed': return 2;
    case 'preparing': return 3;
    case 'ready': return 4;
    case 'served': return 5;
    case 'completed': return 6;
    default: return 1;
  }
};

const getStepClass = (status, stepIndex) => {
  const currentStep = getStepNumber(status);
  return stepIndex <= currentStep ? 'step-primary font-bold' : '';
};

const openCustomerPayModal = async (order) => {
  selectedOrder.value = order;
  try {
    await api.post(`/payments/create/${order.id}`);
  } catch (err) {
    console.warn('Payment prep:', err);
  }
  document.getElementById('customer_pay_modal').showModal();
};

const closeCustomerPayModal = () => {
  document.getElementById('customer_pay_modal').close();
  selectedOrder.value = null;
};

const confirmCustomerPayment = async () => {
  if (!selectedOrder.value) return;
  isPaying.value = true;
  try {
    await api.put(`/payments/${selectedOrder.value.id}/verify`, {
      payment_status: 'completed',
      payment_method: 'promptpay'
    });
    closeCustomerPayModal();
    await fetchOrders();
    alert('บันทึกการชำระเงินสำเร็จ ขอบคุณสำหรับมื้ออาหารครับ/ค่ะ!');
  } catch (err) {
    console.error('Payment verification failed:', err);
    alert('ไม่สามารถยืนยันการชำระเงินได้');
  } finally {
    isPaying.value = false;
  }
};

onMounted(() => {
  fetchOrders();
  pollingInterval = setInterval(fetchOrders, 15000); // refresh every 15s
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
</script>
