<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-8">
    <div class="max-w-7xl mx-auto">
      
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">จัดการเมนูอาหาร</h1>
          <p class="text-gray-500 mt-1">เพิ่ม ลบ หรือแก้ไขข้อมูลเมนูอาหารและราคาได้ที่นี่</p>
        </div>
        <button @click="openAddModal" class="btn btn-primary gap-2 shadow-lg hover:shadow-primary/50 transition-all hover:-translate-y-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          เพิ่มเมนูใหม่
        </button>
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
                <th class="text-right">ราคา (฿)</th>
                <th class="text-right w-32">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id" class="hover:bg-gray-50/50 transition-colors group">
                <td class="text-gray-500 font-mono">#{{ product.id }}</td>
                <td>
                  <div class="font-bold text-gray-900 group-hover:text-primary transition-colors">{{ product.name }}</div>
                  <div class="text-sm text-gray-500 truncate max-w-xs" :title="product.description">{{ product.description || 'ไม่มีรายละเอียด' }}</div>
                </td>
                <td>
                  <span class="badge badge-ghost badge-sm">{{ product.category || 'ไม่ระบุ' }}</span>
                </td>
                <td class="text-right font-semibold text-gray-900">
                  {{ Number(product.price).toFixed(2) }}
                </td>
                <td class="text-right space-x-2">
                  <button @click="openEditModal(product)" class="btn btn-ghost btn-sm btn-square text-info hover:bg-info hover:text-white transition-colors" title="แก้ไข">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button @click="deleteProduct(product.id)" class="btn btn-ghost btn-sm btn-square text-error hover:bg-error hover:text-white transition-colors" title="ลบ">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="products.length === 0">
                <td colspan="5" class="text-center py-12 text-gray-500">
                  ไม่มีรายการเมนูอาหาร
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Product Form Modal -->
    <dialog id="product_modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box bg-white rounded-2xl shadow-2xl">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" @click="closeModal">✕</button>
        </form>
        <h3 class="font-bold text-2xl mb-6 text-gray-900">{{ isEditing ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่' }}</h3>
        
        <form @submit.prevent="saveProduct" class="space-y-4">
          <div class="form-control w-full">
            <label class="label"><span class="label-text font-semibold">ชื่อเมนู <span class="text-error">*</span></span></label>
            <input v-model="formData.name" type="text" placeholder="เช่น ข้าวกะเพราหมูสับ" class="input input-bordered w-full focus:input-primary transition-all" required />
          </div>
          
          <div class="form-control w-full">
            <label class="label"><span class="label-text font-semibold">รายละเอียด</span></label>
            <textarea v-model="formData.description" class="textarea textarea-bordered h-24 focus:textarea-primary transition-all" placeholder="คำอธิบายเมนูอาหาร..."></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label"><span class="label-text font-semibold">ราคา (บาท) <span class="text-error">*</span></span></label>
              <input v-model.number="formData.price" type="number" step="0.01" min="0" placeholder="0.00" class="input input-bordered w-full focus:input-primary transition-all" required />
            </div>
            
            <div class="form-control w-full">
              <label class="label"><span class="label-text font-semibold">หมวดหมู่</span></label>
              <select v-model="formData.category_id" class="select select-bordered w-full focus:select-primary transition-all">
                <option :value="null">ไม่ระบุหมวดหมู่</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
          </div>

          <div class="modal-action mt-8">
            <button type="button" class="btn btn-ghost" @click="closeModal">ยกเลิก</button>
            <button type="submit" class="btn btn-primary px-8 shadow-md" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-sm"></span>
              {{ isEditing ? 'บันทึกการแก้ไข' : 'สร้างเมนู' }}
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
const categories = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const isEditing = ref(false);

const initialForm = {
  id: null,
  name: '',
  description: '',
  price: '',
  category_id: null,
  stock: 0
};

const formData = ref({ ...initialForm });

onMounted(async () => {
  await fetchCategories();
  await fetchProducts();
});

const fetchProducts = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await api.get('/products');
    products.value = res.data;
  } catch (err) {
    error.value = 'ไม่สามารถดึงข้อมูลเมนูอาหารได้';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await api.get('/products/categories');
    categories.value = res.data;
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  }
};

const openAddModal = () => {
  isEditing.value = false;
  formData.value = { ...initialForm };
  document.getElementById('product_modal').showModal();
};

const openEditModal = (product) => {
  isEditing.value = true;
  formData.value = { ...product };
  document.getElementById('product_modal').showModal();
};

const closeModal = () => {
  document.getElementById('product_modal').close();
  formData.value = { ...initialForm };
};

const saveProduct = async () => {
  saving.value = true;
  error.value = '';
  try {
    const payload = {
      name: formData.value.name,
      description: formData.value.description,
      price: parseFloat(formData.value.price),
      category_id: formData.value.category_id,
      stock: formData.value.stock
    };

    if (isEditing.value) {
      await api.put(`/products/${formData.value.id}`, payload);
    } else {
      await api.post('/products', payload);
    }
    
    await fetchProducts();
    closeModal();
  } catch (err) {
    error.value = err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
    console.error(err);
    // Auto clear error after 3s
    setTimeout(() => { error.value = ''; }, 3000);
  } finally {
    saving.value = false;
  }
};

const deleteProduct = async (id) => {
  if (!confirm('คุณต้องการลบเมนูอาหารนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
  
  try {
    await api.delete(`/products/${id}`);
    await fetchProducts();
  } catch (err) {
    error.value = 'ไม่สามารถลบเมนูอาหารได้ อาจมีคำสั่งซื้อที่ผูกกับเมนูนี้อยู่';
    console.error(err);
    setTimeout(() => { error.value = ''; }, 3000);
  }
};
</script>
