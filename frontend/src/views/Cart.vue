<template>
  <div class="min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">ตะกร้าสินค้า</h1>
      
      <div v-if="cartStore.itemCount === 0" class="text-center py-20 bg-base-100 rounded-box shadow-sm">
        <div class="text-6xl mb-4">🛒</div>
        <h2 class="text-2xl font-semibold mb-2">ยังไม่มีสินค้าในตะกร้า</h2>
        <p class="text-base-content/70 mb-6">คุณยังไม่ได้เพิ่มรายการอาหารที่ต้องการลงตะกร้าเลย</p>
        <router-link to="/products" class="btn btn-primary">เลือกเมนูอาหาร</router-link>
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

        <!-- Order Summary & Dine-in Details -->
        <div class="lg:col-span-1">
          <div class="card bg-base-100 shadow-sm sticky top-24 border border-base-200">
            <div class="card-body">
              <h2 class="card-title mb-4">ข้อมูลการสั่งอาหาร</h2>
              
              <!-- Table Number Selection -->
              <div class="form-control w-full mb-4">
                <label class="label">
                  <span class="label-text font-bold">หมายเลขโต๊ะของคุณ <span class="text-error">*</span></span>
                </label>
                <div class="flex gap-2">
                  <select v-model="tableNo" class="select select-bordered w-full font-bold">
                    <option value="โต๊ะ 1">โต๊ะ 1</option>
                    <option value="โต๊ะ 2">โต๊ะ 2</option>
                    <option value="โต๊ะ 3">โต๊ะ 3</option>
                    <option value="โต๊ะ 4">โต๊ะ 4</option>
                    <option value="โต๊ะ 5">โต๊ะ 5</option>
                    <option value="โต๊ะ 6">โต๊ะ 6</option>
                    <option value="โต๊ะ 7">โต๊ะ 7</option>
                    <option value="โต๊ะ 8">โต๊ะ 8</option>
                    <option value="โต๊ะ 9">โต๊ะ 9</option>
                    <option value="โต๊ะ 10">โต๊ะ 10</option>
                    <option value="กลับบ้าน">สั่งกลับบ้าน (Takeaway)</option>
                  </select>
                </div>
              </div>

              <!-- Dine-in Pay-after Note -->
              <div class="alert alert-info py-2 px-3 text-xs mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span><strong>ชำระเงินหลังทานเสร็จ:</strong> ครัวจะปรุงและเสิร์ฟอาหารให้ก่อน เมื่อทานเสร็จแล้วจึงชำระเงินที่หน้าออเดอร์</span>
              </div>

              <div class="space-y-2 border-b border-base-200 pb-4 mb-4">
                <div class="flex justify-between">
                  <span class="text-base-content/70">ค่าอาหาร ({{cartStore.itemCount}} รายการ)</span>
                  <span>฿{{ Number(cartStore.totalPrice).toFixed(2) }}</span>
                </div>
              </div>
              
              <div class="flex justify-between font-bold text-xl mb-6">
                <span>ยอดสุทธิ</span>
                <span class="text-primary">฿{{ Number(cartStore.totalPrice).toFixed(2) }}</span>
              </div>
              
              <button 
                class="btn btn-primary w-full shadow-md hover:shadow-lg text-base"
                @click="processCheckout"
                :disabled="isProcessing"
              >
                <span v-if="isProcessing" class="loading loading-spinner"></span>
                {{ isProcessing ? 'กำลังส่งออเดอร์...' : 'ยืนยันสั่งอาหาร (ชำระเงินหลังทานเสร็จ)' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Confirmed Modal -->
    <dialog id="order_success_modal" class="modal">
      <div class="modal-box text-center max-w-md">
        <div class="text-6xl mb-4">🎉</div>
        <h3 class="font-bold text-2xl text-success mb-2">สั่งอาหารสำเร็จ!</h3>
        <p class="text-base text-base-content/80 mb-4">
          ออเดอร์ของคุณถูกส่งไปยังห้องครัวเรียบร้อยแล้ว
        </p>

        <div class="bg-base-200 p-4 rounded-xl text-left space-y-2 mb-6 text-sm">
          <div class="flex justify-between">
            <span class="text-base-content/70">เลขที่คำสั่งซื้อ:</span>
            <span class="font-bold text-primary font-mono">{{ createdOrderCode }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/70">ที่นั่ง/โต๊ะ:</span>
            <span class="font-bold">{{ tableNo }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/70">สถานะ:</span>
            <span class="badge badge-warning font-semibold">รับออเดอร์แล้ว (รอยืนยัน)</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/70">การชำระเงิน:</span>
            <span class="badge badge-outline">ชำระหลังรับประทานเสร็จ</span>
          </div>
        </div>

        <p class="text-xs text-base-content/60 mb-6">
          คุณสามารถติดตามขั้นตอนการทำอาหารและเรียกสแกนชำระเงินเมื่อทานเสร็จได้ที่หน้าประวัติคำสั่งซื้อ
        </p>

        <div class="modal-action justify-center">
          <button class="btn btn-primary w-full" @click="goToOrders">
            ติดตามสถานะอาหาร
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="goToOrders">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import { useAuthStore } from '../stores/auth';
import api from '../api/axios';

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();

const tableNo = ref('โต๊ะ 1');
const isProcessing = ref(false);
const createdOrderCode = ref('');

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
      user_id: authStore.user?.id || null,
      table_no: tableNo.value,
      items: orderItems,
      total_price: Number(cartStore.totalPrice)
    });

    createdOrderCode.value = response.data.order.order_code;
    
    // Save order code to local storage for guest tracking
    if (createdOrderCode.value) {
      const guestOrders = JSON.parse(localStorage.getItem('guest_orders') || '[]');
      if (!guestOrders.includes(createdOrderCode.value)) {
        guestOrders.push(createdOrderCode.value);
        localStorage.setItem('guest_orders', JSON.stringify(guestOrders));
      }
    }

    // Clear cart immediately
    cartStore.clearCart();

    // Show order success modal
    document.getElementById('order_success_modal').showModal();

  } catch (error) {
    console.error('Checkout failed:', error);
    alert('ไม่สามารถดำเนินคำสั่งซื้อได้ โปรดลองอีกครั้ง');
  } finally {
    isProcessing.value = false;
  }
};

const goToOrders = () => {
  document.getElementById('order_success_modal').close();
  router.push('/orders');
};
</script>
