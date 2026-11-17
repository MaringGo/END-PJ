<template>
  <div class="min-h-screen bg-base-200 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      
      <!-- Top Bar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-base-content tracking-tight">
            👨‍🍳 ระบบจัดการออเดอร์ & ห้องครัว (Order & Kitchen Display)
          </h1>
          <p class="text-base-content/70 mt-1">
            วงจรออเดอร์: รับออเดอร์ ➔ ยืนยัน ➔ ลงมือทำ ➔ รอเสิร์ฟ ➔ เสิร์ฟสำเร็จ ➔ จ่ายตัง
          </p>
        </div>
        <button class="btn btn-outline btn-sm" @click="fetchOrders" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          รีเฟรชข้อมูล
        </button>
      </div>

      <!-- Stage Selector Tabs -->
      <div class="tabs tabs-boxed bg-base-100 p-2 rounded-2xl shadow-sm mb-8 overflow-x-auto flex-nowrap">
        <a 
          class="tab tab-lg font-bold gap-2 whitespace-nowrap"
          :class="activeTab === 'all' ? 'tab-active' : ''"
          @click="activeTab = 'all'"
        >
          📋 ภาพรวมทั้งหมด ({{ activeOrders.length }})
        </a>
        <a 
          class="tab tab-lg font-bold gap-2 text-warning whitespace-nowrap"
          :class="activeTab === 'pending' ? 'tab-active !bg-warning !text-white' : ''"
          @click="activeTab = 'pending'"
        >
          1. รับออเดอร์ใหม่
          <span class="badge badge-sm" :class="activeTab === 'pending' ? 'badge-ghost' : 'badge-warning'">{{ pendingOrders.length }}</span>
        </a>
        <a 
          class="tab tab-lg font-bold gap-2 text-info whitespace-nowrap"
          :class="activeTab === 'confirmed' ? 'tab-active !bg-info !text-white' : ''"
          @click="activeTab = 'confirmed'"
        >
          2. ยืนยันแล้ว (รอทำ)
          <span class="badge badge-sm" :class="activeTab === 'confirmed' ? 'badge-ghost' : 'badge-info text-white'">{{ confirmedOrders.length }}</span>
        </a>
        <a 
          class="tab tab-lg font-bold gap-2 text-primary whitespace-nowrap"
          :class="activeTab === 'preparing' ? 'tab-active !bg-primary !text-white' : ''"
          @click="activeTab = 'preparing'"
        >
          3. กำลังลงมือทำ
          <span class="badge badge-sm" :class="activeTab === 'preparing' ? 'badge-ghost' : 'badge-primary text-white'">{{ preparingOrders.length }}</span>
        </a>
        <a 
          class="tab tab-lg font-bold gap-2 text-secondary whitespace-nowrap"
          :class="activeTab === 'ready' ? 'tab-active !bg-secondary !text-white' : ''"
          @click="activeTab = 'ready'"
        >
          4. รอเสิร์ฟ
          <span class="badge badge-sm" :class="activeTab === 'ready' ? 'badge-ghost' : 'badge-secondary text-white'">{{ readyOrders.length }}</span>
        </a>
        <a 
          class="tab tab-lg font-bold gap-2 text-accent whitespace-nowrap"
          :class="activeTab === 'served' ? 'tab-active !bg-accent !text-white' : ''"
          @click="activeTab = 'served'"
        >
          5. เสิร์ฟแล้ว (รอเช็คบิล)
          <span class="badge badge-sm" :class="activeTab === 'served' ? 'badge-ghost' : 'badge-accent text-white'">{{ servedOrders.length }}</span>
        </a>
        <a 
          class="tab tab-lg font-bold gap-2 text-success whitespace-nowrap"
          :class="activeTab === 'completed' ? 'tab-active !bg-success !text-white' : ''"
          @click="activeTab = 'completed'"
        >
          6. จ่ายตังแล้ว (เสร็จสิ้น)
          <span class="badge badge-sm badge-ghost">{{ completedOrders.length }}</span>
        </a>
      </div>

      <!-- Loading / Error -->
      <div v-if="loading && orders.length === 0" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else-if="error" class="alert alert-error shadow-lg mb-6">
        <span>{{ error }}</span>
      </div>

      <!-- Orders Grid Display -->
      <div v-else>
        <!-- Empty State -->
        <div v-if="displayedOrders.length === 0" class="text-center py-20 bg-base-100 rounded-3xl shadow-sm border border-base-300">
          <div class="text-6xl mb-4">🍽️</div>
          <h3 class="text-xl font-bold">ไม่มีรายการออเดอร์ในหมวดหมู่นี้</h3>
          <p class="text-base-content/60 mt-1">ออเดอร์ที่เข้ามาจะแสดงผลที่นี่แบบเรียลไทม์</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="order in displayedOrders" 
            :key="order.id" 
            class="card bg-base-100 shadow-sm border transition-all duration-300 hover:shadow-md"
            :class="{
              'border-warning border-l-8': order.status === 'pending',
              'border-info border-l-8': order.status === 'confirmed',
              'border-primary border-l-8': order.status === 'preparing',
              'border-secondary border-l-8': order.status === 'ready',
              'border-accent border-l-8': order.status === 'served',
              'border-success border-l-8': order.status === 'completed'
            }"
          >
            <div class="card-body p-5">
              
              <!-- Card Header -->
              <div class="flex justify-between items-start border-b border-base-200 pb-3 mb-3">
                <div>
                  <div class="badge badge-neutral font-bold text-sm px-3 py-2 mb-1">
                    📍 {{ order.table_no || 'ไม่ระบุโต๊ะ' }}
                  </div>
                  <div class="font-bold text-lg font-mono text-primary">{{ order.order_code }}</div>
                </div>
                <div class="text-right">
                  <div class="badge font-bold uppercase p-3" :class="getStatusBadgeClass(order.status)">
                    {{ translateStatus(order.status) }}
                  </div>
                  <div class="text-xs text-base-content/60 mt-1">{{ formatTime(order.created_at) }}</div>
                </div>
              </div>

              <!-- Order Items List -->
              <div class="space-y-2 mb-4 flex-1">
                <div class="text-xs font-bold text-base-content/60 uppercase">รายการอาหาร:</div>
                <ul class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <li v-for="item in order.items" :key="item.id" class="flex justify-between text-sm items-center bg-base-200/50 p-2 rounded-lg">
                    <span class="font-semibold">
                      <span class="text-primary font-bold mr-1">{{ item.quantity }}x</span>
                      {{ item.product_name || `รายการ #${item.product_id}` }}
                    </span>
                    <span class="text-xs font-medium text-base-content/70">฿{{ (item.price * item.quantity).toFixed(2) }}</span>
                  </li>
                </ul>
              </div>

              <!-- Price & Payment Info -->
              <div class="flex justify-between items-center py-2 border-t border-base-200 text-sm mb-4">
                <span class="font-medium">ยอดรวมทั้งสิ้น:</span>
                <span class="text-xl font-bold text-primary">฿{{ Number(order.total_price).toFixed(2) }}</span>
              </div>

              <!-- Status Action Buttons based on the 6 steps -->
              <div class="card-actions flex-col gap-2 pt-2">
                
                <!-- Step 1: Pending -> Confirm Order -->
                <div v-if="order.status === 'pending'" class="flex gap-2 w-full">
                  <button 
                    class="btn btn-warning flex-1 text-white shadow-sm"
                    @click="updateStatus(order.id, 'confirmed')"
                    :disabled="isUpdating === order.id"
                  >
                    <span v-if="isUpdating === order.id" class="loading loading-spinner loading-xs"></span>
                    ✅ ยืนยันออเดอร์
                  </button>
                  <button 
                    class="btn btn-ghost btn-outline btn-error btn-sm"
                    @click="cancelOrder(order.id)"
                    :disabled="isUpdating === order.id"
                    title="ยกเลิกออเดอร์"
                  >
                    ยกเลิก
                  </button>
                </div>

                <!-- Step 2: Confirmed -> Start Cooking -->
                <div v-else-if="order.status === 'confirmed'" class="w-full">
                  <button 
                    class="btn btn-info w-full text-white shadow-sm"
                    @click="updateStatus(order.id, 'preparing')"
                    :disabled="isUpdating === order.id"
                  >
                    <span v-if="isUpdating === order.id" class="loading loading-spinner loading-xs"></span>
                    🍳 เริ่มลงมือทำอาหาร
                  </button>
                </div>

                <!-- Step 3: Preparing -> Ready to Serve -->
                <div v-else-if="order.status === 'preparing'" class="w-full">
                  <button 
                    class="btn btn-primary w-full shadow-sm"
                    @click="updateStatus(order.id, 'ready')"
                    :disabled="isUpdating === order.id"
                  >
                    <span v-if="isUpdating === order.id" class="loading loading-spinner loading-xs"></span>
                    🔔 ปรุงเสร็จแล้ว (รอเสิร์ฟ)
                  </button>
                </div>

                <!-- Step 4: Ready -> Serve to Table -->
                <div v-else-if="order.status === 'ready'" class="w-full">
                  <button 
                    class="btn btn-secondary w-full text-white shadow-sm"
                    @click="updateStatus(order.id, 'served')"
                    :disabled="isUpdating === order.id"
                  >
                    <span v-if="isUpdating === order.id" class="loading loading-spinner loading-xs"></span>
                    🍽️ เสิร์ฟขึ้นโต๊ะสำเร็จ
                  </button>
                </div>

                <!-- Step 5: Served -> Request Bill & Pay -->
                <div v-else-if="order.status === 'served'" class="w-full space-y-2">
                  <button 
                    class="btn btn-accent w-full text-white shadow-sm font-bold"
                    @click="openPaymentModal(order)"
                  >
                    💵 เช็คบิล / ชำระเงิน (฿{{ Number(order.total_price).toFixed(2) }})
                  </button>
                </div>

                <!-- Step 6: Completed -->
                <div v-else-if="order.status === 'completed'" class="w-full text-center py-1">
                  <span class="badge badge-success text-white py-3 px-4 font-bold text-sm">
                    ✓ ชำระเงินและเสร็จสิ้นแล้ว
                  </span>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Staff Payment / Checkout Modal -->
    <dialog id="staff_payment_modal" class="modal">
      <div class="modal-box text-center max-w-md">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" @click="closePaymentModal">✕</button>
        </form>

        <h3 class="font-bold text-2xl mb-1">เช็คบิล / รับชำระเงิน</h3>
        <p class="text-sm text-base-content/70 mb-4 font-semibold">
          {{ selectedOrder?.table_no }} • {{ selectedOrder?.order_code }}
        </p>

        <!-- Total Amount -->
        <div class="bg-base-200 p-4 rounded-2xl mb-6">
          <div class="text-xs text-base-content/60 mb-1">ยอดชำระสุทธิ</div>
          <div class="text-4xl font-extrabold text-primary">฿{{ Number(selectedOrder?.total_price || 0).toFixed(2) }}</div>
        </div>

        <!-- QR Code display for customer scanning -->
        <div class="my-4">
          <p class="text-xs font-semibold text-base-content/70 mb-3">ให้ลูกค้าสแกน QR Code PromptPay ด้านล่าง:</p>
          <div class="bg-white p-4 rounded-xl border-4 border-primary inline-block shadow-sm">
            <img src="/qr-payment.png" alt="QR Code" class="w-44 object-contain mx-auto" />
          </div>
        </div>

        <!-- Payment action choices -->
        <div class="space-y-3 mt-6">
          <button 
            class="btn btn-primary w-full shadow-md"
            @click="completePayment('promptpay')"
            :disabled="isProcessingPayment"
          >
            <span v-if="isProcessingPayment" class="loading loading-spinner loading-sm"></span>
            ✓ ยืนยันลูกค้าสแกนจ่ายสำเร็จ (PromptPay)
          </button>
          <button 
            class="btn btn-outline btn-success w-full"
            @click="completePayment('cash')"
            :disabled="isProcessingPayment"
          >
            💵 รับเงินสดเรียบร้อยแล้ว
          </button>
          <button class="btn btn-ghost w-full" @click="closePaymentModal">
            ย้อนกลับ
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closePaymentModal">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '../api/axios';

const orders = ref([]);
const loading = ref(true);
const error = ref(null);
const isUpdating = ref(null);
const isProcessingPayment = ref(false);
const activeTab = ref('all');
const selectedOrder = ref(null);
let pollingInterval = null;

const activeOrders = computed(() => {
  return orders.value.filter(o => o.status !== 'cancelled');
});

const pendingOrders = computed(() => {
  return orders.value.filter(o => o.status === 'pending');
});

const confirmedOrders = computed(() => {
  return orders.value.filter(o => o.status === 'confirmed');
});

const preparingOrders = computed(() => {
  return orders.value.filter(o => o.status === 'preparing');
});

const readyOrders = computed(() => {
  return orders.value.filter(o => o.status === 'ready');
});

const servedOrders = computed(() => {
  return orders.value.filter(o => o.status === 'served');
});

const completedOrders = computed(() => {
  return orders.value.filter(o => o.status === 'completed');
});

const displayedOrders = computed(() => {
  if (activeTab.value === 'pending') return pendingOrders.value;
  if (activeTab.value === 'confirmed') return confirmedOrders.value;
  if (activeTab.value === 'preparing') return preparingOrders.value;
  if (activeTab.value === 'ready') return readyOrders.value;
  if (activeTab.value === 'served') return servedOrders.value;
  if (activeTab.value === 'completed') return completedOrders.value;
  // 'all': show active non-completed orders first, then completed
  return orders.value.filter(o => o.status !== 'cancelled');
});

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

const translateStatus = (status) => {
  const map = {
    'pending': '1. รอรับออเดอร์',
    'confirmed': '2. ยืนยันแล้ว',
    'preparing': '3. กำลังลงมือทำ',
    'ready': '4. อาหารเสร็จ รอเสิร์ฟ',
    'served': '5. เสิร์ฟสำเร็จ (ทานอยู่)',
    'completed': '6. จ่ายตังแล้ว',
    'cancelled': 'ยกเลิกแล้ว'
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
    await fetchOrders();
  } catch (err) {
    console.error('Failed to update status:', err);
    alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
  } finally {
    isUpdating.value = null;
  }
};

const cancelOrder = async (orderId) => {
  if (!confirm('คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่? วัตถุดิบจะถูกคืนเข้าสต็อก')) return;
  await updateStatus(orderId, 'cancelled');
};

const openPaymentModal = async (order) => {
  selectedOrder.value = order;
  // Create or fetch QR payment
  try {
    await api.post(`/payments/create/${order.id}`);
  } catch (err) {
    console.warn('Payment record check:', err);
  }
  document.getElementById('staff_payment_modal').showModal();
};

const closePaymentModal = () => {
  document.getElementById('staff_payment_modal').close();
  selectedOrder.value = null;
};

const completePayment = async (method) => {
  if (!selectedOrder.value) return;
  isProcessingPayment.value = true;
  try {
    await api.put(`/payments/${selectedOrder.value.id}/verify`, {
      payment_status: 'completed',
      payment_method: method
    });
    closePaymentModal();
    await fetchOrders();
    alert('บันทึกการชำระเงินเรียบร้อยแล้ว! ปิดออเดอร์สำเร็จ');
  } catch (err) {
    console.error('Payment failed:', err);
    alert('ไม่สามารถบันทึกการชำระเงินได้');
  } finally {
    isProcessingPayment.value = false;
  }
};

onMounted(() => {
  fetchOrders();
  pollingInterval = setInterval(fetchOrders, 15000); // auto-refresh every 15s
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
</script>
