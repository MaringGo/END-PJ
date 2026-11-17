<template>
  <div class="min-h-screen bg-base-200 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-base-content tracking-tight">🥩 จัดการคลังวัตถุดิบ (Raw Materials Inventory)</h1>
          <p class="text-base-content/70 mt-1">ติดตามสต็อกวัตถุดิบและของสดที่ใช้ในการประกอบอาหารของร้าน</p>
        </div>
        <button @click="openAddModal" class="btn btn-primary gap-2 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          เพิ่มวัตถุดิบใหม่
        </button>
      </div>

      <!-- Quick Summary Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="stat bg-base-100 rounded-box shadow-sm border border-base-300">
          <div class="stat-title">วัตถุดิบทั้งหมด</div>
          <div class="stat-value text-2xl sm:text-3xl">{{ items.length }}</div>
          <div class="stat-desc">รายการวัตถุดิบในระบบ</div>
        </div>
        <div class="stat bg-base-100 rounded-box shadow-sm border border-base-300">
          <div class="stat-title text-success">สถานะปกติ</div>
          <div class="stat-value text-success text-2xl sm:text-3xl">{{ normalCount }}</div>
          <div class="stat-desc">ปริมาณเพียงพอ</div>
        </div>
        <div class="stat bg-base-100 rounded-box shadow-sm border border-base-300">
          <div class="stat-title text-warning">ใกล้หมด</div>
          <div class="stat-value text-warning text-2xl sm:text-3xl">{{ lowStockCount }}</div>
          <div class="stat-desc">ต่ำกว่าจุดเตือนขั้นต่ำ</div>
        </div>
        <div class="stat bg-base-100 rounded-box shadow-sm border border-base-300">
          <div class="stat-title text-error">หมดสต็อก</div>
          <div class="stat-value text-error text-2xl sm:text-3xl">{{ outOfStockCount }}</div>
          <div class="stat-desc">ต้องรีบสั่งซื้อเพิ่ม</div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <div class="form-control w-full sm:w-80">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="ค้นหาชื่อวัตถุดิบ..." 
            class="input input-bordered w-full"
          />
        </div>
        <div class="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <button 
            @click="filterStatus = 'all'" 
            class="btn btn-sm"
            :class="filterStatus === 'all' ? 'btn-primary' : 'btn-ghost bg-base-100'"
          >
            ทั้งหมด ({{ items.length }})
          </button>
          <button 
            @click="filterStatus = 'low_stock'" 
            class="btn btn-sm"
            :class="filterStatus === 'low_stock' ? 'btn-warning text-white' : 'btn-ghost bg-base-100'"
          >
            ใกล้หมด ({{ lowStockCount }})
          </button>
          <button 
            @click="filterStatus = 'out_of_stock'" 
            class="btn btn-sm"
            :class="filterStatus === 'out_of_stock' ? 'btn-error text-white' : 'btn-ghost bg-base-100'"
          >
            หมดสต็อก ({{ outOfStockCount }})
          </button>
        </div>
      </div>

      <!-- Error / Loading -->
      <div v-if="error" class="alert alert-error shadow-sm mb-6">
        <span>{{ error }}</span>
      </div>
      
      <div v-if="loading && items.length === 0" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Data Table -->
      <div v-else class="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead class="bg-base-200 text-base-content font-bold">
              <tr>
                <th class="w-16">ID</th>
                <th>ชื่อวัตถุดิบ</th>
                <th class="text-right w-64">จำนวนคงเหลือ</th>
                <th class="text-right">จุดเตือนขั้นต่ำ</th>
                <th class="text-center w-36">สถานะ</th>
                <th class="text-right w-32">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.id" class="hover:bg-base-200/50 transition-colors">
                <td class="font-mono text-base-content/60">#{{ item.id }}</td>
                <td>
                  <div class="font-bold text-base">{{ item.name }}</div>
                </td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button 
                      @click="adjustStock(item, -1)" 
                      class="btn btn-xs btn-circle btn-outline" 
                      :disabled="item.quantity <= 0 || savingId === item.id"
                      title="ลด 1 หน่วย"
                    >-</button>
                    
                    <span class="font-bold text-base min-w-[70px] text-center" :class="{
                      'text-error font-extrabold': item.status === 'out_of_stock',
                      'text-warning font-bold': item.status === 'low_stock'
                    }">
                      {{ formatNumber(item.quantity) }} {{ item.unit }}
                    </span>

                    <button 
                      @click="adjustStock(item, 1)" 
                      class="btn btn-xs btn-circle btn-outline" 
                      :disabled="savingId === item.id"
                      title="เพิ่ม 1 หน่วย"
                    >+</button>
                    
                    <!-- Quick custom input -->
                    <button 
                      @click="openEditModal(item)" 
                      class="btn btn-xs btn-ghost text-info" 
                      title="ระบุจำนวนคงเหลือใหม่"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td class="text-right font-medium text-base-content/70">
                  {{ formatNumber(item.low_stock_threshold) }} {{ item.unit }}
                </td>
                <td class="text-center">
                  <div class="badge font-bold p-3" :class="{
                    'badge-success text-white': item.status === 'ok',
                    'badge-warning text-white': item.status === 'low_stock',
                    'badge-error text-white': item.status === 'out_of_stock'
                  }">
                    {{ translateStatus(item.status) }}
                  </div>
                </td>
                <td class="text-right space-x-1">
                  <button @click="openEditModal(item)" class="btn btn-ghost btn-sm btn-square text-info" title="แก้ไข">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button @click="deleteItem(item.id)" class="btn btn-ghost btn-sm btn-square text-error" title="ลบ">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredItems.length === 0">
                <td colspan="6" class="text-center py-12 text-base-content/50">
                  ไม่พบรายการวัตถุดิบ
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Form (Add & Edit) -->
    <dialog id="inventory_modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box bg-base-100 rounded-2xl shadow-2xl max-w-md">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" @click="closeModal">✕</button>
        </form>
        <h3 class="font-bold text-2xl mb-6">{{ isEditing ? 'แก้ไขข้อมูลวัตถุดิบ' : 'เพิ่มวัตถุดิบใหม่' }}</h3>
        
        <form @submit.prevent="saveItem" class="space-y-4">
          <div class="form-control w-full">
            <label class="label"><span class="label-text font-semibold">ชื่อวัตถุดิบ <span class="text-error">*</span></span></label>
            <input v-model="formData.name" type="text" placeholder="เช่น เนื้อหมูสับ, ไข่ไก่, ข้าวหอมมะลิ" class="input input-bordered w-full" required />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label"><span class="label-text font-semibold">จำนวนคงเหลือ <span class="text-error">*</span></span></label>
              <input v-model.number="formData.quantity" type="number" step="0.01" min="0" placeholder="0.00" class="input input-bordered w-full" required />
            </div>
            
            <div class="form-control w-full">
              <label class="label"><span class="label-text font-semibold">หน่วยนับ <span class="text-error">*</span></span></label>
              <input v-model="formData.unit" type="text" placeholder="เช่น กิโลกรัม, ฟอง, ลิตร" class="input input-bordered w-full" list="common_units" required />
              <datalist id="common_units">
                <option value="กิโลกรัม" />
                <option value="กรัม" />
                <option value="ฟอง" />
                <option value="ลิตร" />
                <option value="มิลลิลิตร" />
                <option value="กล่อง" />
                <option value="กระป๋อง" />
                <option value="ขวด" />
                <option value="ห่อ" />
                <option value="ลูก" />
              </datalist>
            </div>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-semibold">จุดเตือนสต็อกใกล้หมด (Threshold) <span class="text-error">*</span></span>
            </label>
            <input v-model.number="formData.low_stock_threshold" type="number" step="0.01" min="0" placeholder="เช่น 5" class="input input-bordered w-full" required />
            <label class="label">
              <span class="label-text-alt text-base-content/60">ระบบจะขึ้นสถานะ "ใกล้หมด" เมื่อจำนวนน้อยกว่าหรือเท่ากับจุดนี้</span>
            </label>
          </div>

          <div class="modal-action mt-8">
            <button type="button" class="btn btn-ghost" @click="closeModal">ยกเลิก</button>
            <button type="submit" class="btn btn-primary px-8 shadow-md" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-sm"></span>
              {{ isEditing ? 'บันทึกการแก้ไข' : 'สร้างวัตถุดิบ' }}
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
import { ref, computed, onMounted } from 'vue';
import api from '../api/axios';

const items = ref([]);
const loading = ref(true);
const saving = ref(false);
const savingId = ref(null);
const error = ref('');
const isEditing = ref(false);

const searchQuery = ref('');
const filterStatus = ref('all');

const initialForm = {
  id: null,
  name: '',
  quantity: 0,
  unit: 'กิโลกรัม',
  low_stock_threshold: 5
};

const formData = ref({ ...initialForm });

onMounted(async () => {
  await fetchInventory();
});

const fetchInventory = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await api.get('/inventory');
    items.value = res.data;
  } catch (err) {
    error.value = 'ไม่สามารถดึงข้อมูลสต็อกวัตถุดิบได้';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const normalCount = computed(() => {
  return items.value.filter(i => i.status === 'ok').length;
});

const lowStockCount = computed(() => {
  return items.value.filter(i => i.status === 'low_stock').length;
});

const outOfStockCount = computed(() => {
  return items.value.filter(i => i.status === 'out_of_stock' || parseFloat(i.quantity) <= 0).length;
});

const filteredItems = computed(() => {
  let list = items.value;

  if (filterStatus.value === 'low_stock') {
    list = list.filter(i => i.status === 'low_stock');
  } else if (filterStatus.value === 'out_of_stock') {
    list = list.filter(i => i.status === 'out_of_stock' || parseFloat(i.quantity) <= 0);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(i => i.name.toLowerCase().includes(q));
  }

  return list;
});

const formatNumber = (val) => {
  const n = parseFloat(val || 0);
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
};

const translateStatus = (status) => {
  const map = {
    'ok': 'ปกติ',
    'low_stock': 'ใกล้หมด',
    'out_of_stock': 'หมดสต็อก'
  };
  return map[status] || status;
};

const openAddModal = () => {
  isEditing.value = false;
  formData.value = { ...initialForm };
  document.getElementById('inventory_modal').showModal();
};

const openEditModal = (item) => {
  isEditing.value = true;
  formData.value = {
    id: item.id,
    name: item.name,
    quantity: parseFloat(item.quantity),
    unit: item.unit,
    low_stock_threshold: parseFloat(item.low_stock_threshold)
  };
  document.getElementById('inventory_modal').showModal();
};

const closeModal = () => {
  document.getElementById('inventory_modal').close();
  formData.value = { ...initialForm };
};

const saveItem = async () => {
  saving.value = true;
  error.value = '';
  try {
    const payload = {
      name: formData.value.name,
      quantity: parseFloat(formData.value.quantity),
      unit: formData.value.unit,
      low_stock_threshold: parseFloat(formData.value.low_stock_threshold)
    };

    if (isEditing.value) {
      await api.put(`/inventory/${formData.value.id}`, payload);
    } else {
      await api.post('/inventory', payload);
    }

    await fetchInventory();
    closeModal();
  } catch (err) {
    error.value = err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
    console.error(err);
  } finally {
    saving.value = false;
  }
};

const adjustStock = async (item, delta) => {
  const newQty = Math.max(0, parseFloat(item.quantity) + delta);
  savingId.value = item.id;
  try {
    const res = await api.put(`/inventory/${item.id}`, { quantity: newQty });
    // Update local state
    const index = items.value.findIndex(i => i.id === item.id);
    if (index !== -1) {
      items.value[index] = res.data;
    }
  } catch (err) {
    console.error('Failed to adjust stock:', err);
    alert('ไม่สามารถปรับปรุงสต็อกได้');
  } finally {
    savingId.value = null;
  }
};

const deleteItem = async (id) => {
  if (!confirm('คุณต้องการลบวัตถุดิบนี้ออกจากคลังใช่หรือไม่?')) return;
  try {
    await api.delete(`/inventory/${id}`);
    await fetchInventory();
  } catch (err) {
    console.error('Failed to delete inventory item:', err);
    alert('ไม่สามารถลบวัตถุดิบได้');
  }
};
</script>
