<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-8">
    <div class="max-w-7xl mx-auto">
      
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">จัดการคลังสินค้า (สต็อกเมนูอาหาร)</h1>
          <p class="text-gray-500 mt-1">อัปเดตจำนวนสินค้าคงเหลือและตรวจสอบรายการที่ใกล้หมด</p>
        </div>
      </div>

      <!-- Error / Loading -->
      <div v-if="error" class="alert alert-error shadow-sm mb-6 animate-pulse">
        <span>{{ error }}</span>
      </div>
      
      <div v-if="loading && products.length === 0" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Data Table -->
      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table w-full">
            <!-- head -->
            <thead class="bg-gray-50 text-gray-700">
              <tr>
                <th class="w-16">ID</th>
                <th>เมนูอาหาร</th>
                <th>หมวดหมู่</th>
                <th class="text-right w-48">จำนวนคงเหลือ (สต็อก)</th>
                <th class="text-center w-32">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id" class="hover:bg-gray-50/50 transition-colors group">
                <td class="text-gray-500 font-mono">#{{ product.id }}</td>
                <td>
                  <div class="font-bold text-gray-900">{{ product.name }}</div>
                </td>
                <td>
                  <span class="badge badge-ghost badge-sm">{{ product.category || 'ไม่ระบุ' }}</span>
                </td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button @click="updateStock(product, -1)" class="btn btn-xs btn-circle btn-outline" :disabled="product.stock <= 0 || savingId === product.id">-</button>
                    <span class="font-bold w-12 text-center" :class="{'text-error': product.stock < 10}">{{ product.stock }}</span>
                    <button @click="updateStock(product, 1)" class="btn btn-xs btn-circle btn-outline" :disabled="savingId === product.id">+</button>
                    
                    <!-- Quick edit input for large changes -->
                    <button @click="openStockModal(product)" class="btn btn-xs btn-ghost text-info" title="แก้ไขจำนวน" :disabled="savingId === product.id">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <span v-if="savingId === product.id" class="loading loading-spinner loading-xs text-primary absolute -ml-6"></span>
                  </div>
                </td>
                <td class="text-center">
                  <div class="badge" :class="product.stock > 10 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-error'">
                    {{ product.stock > 10 ? 'ปกติ' : product.stock > 0 ? 'ใกล้หมด' : 'หมด' }}
                  </div>
                </td>
              </tr>
              <tr v-if="products.length === 0">
                <td colspan="5" class="text-center py-12 text-gray-500">
                  ไม่มีข้อมูลสินค้า
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Stock Edit Modal -->
    <dialog id="stock_modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box bg-white rounded-2xl shadow-2xl max-w-sm">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" @click="closeModal">✕</button>
        </form>
        <h3 class="font-bold text-xl mb-2 text-gray-900">อัปเดตสต็อก</h3>
        <p class="text-gray-500 mb-6">{{ selectedProduct?.name }}</p>
        
        <form @submit.prevent="saveCustomStock" class="space-y-4">
          <div class="form-control w-full">
            <label class="label"><span class="label-text font-semibold">จำนวนคงเหลือ</span></label>
            <input v-model.number="customStock" type="number" min="0" class="input input-bordered w-full focus:input-primary transition-all text-center text-xl font-bold" required />
          </div>

          <div class="modal-action mt-8">
            <button type="button" class="btn btn-ghost" @click="closeModal">ยกเลิก</button>
            <button type="submit" class="btn btn-primary px-8 shadow-md" :disabled="savingId !== null">
              <span v-if="savingId !== null" class="loading loading-spinner loading-sm"></span>
              บันทึก
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeModal">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/axios';

const products = ref([]);
const loading = ref(true);
const savingId = ref(null);
const error = ref('');

const selectedProduct = ref(null);
const customStock = ref(0);

onMounted(async () => {
  await fetchProducts();
});

const fetchProducts = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await api.get('/products');
    // Sort so low stock is at top
    products.value = res.data.sort((a, b) => a.stock - b.stock);
  } catch (err) {
    error.value = 'ไม่สามารถดึงข้อมูลสต็อกได้';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const updateStock = async (product, change) => {
  const newStock = product.stock + change;
  if (newStock < 0) return;
  
  await saveStockToApi(product.id, newStock);
};

const openStockModal = (product) => {
  selectedProduct.value = product;
  customStock.value = product.stock;
  document.getElementById('stock_modal').showModal();
};

const closeModal = () => {
  document.getElementById('stock_modal').close();
  selectedProduct.value = null;
};

const saveCustomStock = async () => {
  if (selectedProduct.value) {
    await saveStockToApi(selectedProduct.value.id, customStock.value);
    closeModal();
  }
};

const saveStockToApi = async (id, newStock) => {
  savingId.value = id;
  error.value = '';
  try {
    // Only send the stock field, the API's COALESCE will keep other fields unchanged
    await api.put(`/products/${id}`, { stock: newStock });
    
    // Update local state immediately for snappy UX
    const index = products.value.findIndex(p => p.id === id);
    if (index !== -1) {
      products.value[index].stock = newStock;
      // Re-sort array
      products.value.sort((a, b) => a.stock - b.stock);
    }
  } catch (err) {
    error.value = 'ไม่สามารถอัปเดตจำนวนสต็อกได้';
    console.error(err);
    setTimeout(() => { error.value = ''; }, 3000);
  } finally {
    savingId.value = null;
  }
};
</script>
