<template>
  <div class="min-h-screen bg-base-200 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <button class="btn btn-outline btn-sm" @click="fetchAnalytics">
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

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <!-- Total Revenue -->
        <div class="stat bg-base-100 shadow-sm rounded-box border-t-4 border-success">
          <div class="stat-figure text-success">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div class="stat-title">รายได้รวมทั้งหมด</div>
          <div class="stat-value text-success text-3xl">฿{{ formatCurrency(stats.total_revenue) }}</div>
          <div class="stat-desc">จากทุกคำสั่งซื้อที่ชำระเงินแล้ว</div>
        </div>
        
        <!-- Today Revenue -->
        <div class="stat bg-base-100 shadow-sm rounded-box border-t-4 border-primary">
          <div class="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div class="stat-title">รายได้วันนี้</div>
          <div class="stat-value text-primary text-3xl">฿{{ formatCurrency(stats.today_revenue) }}</div>
          <div class="stat-desc">ยอดขายเฉพาะวันนี้</div>
        </div>

        <!-- Total Orders -->
        <div class="stat bg-base-100 shadow-sm rounded-box border-t-4 border-info">
          <div class="stat-figure text-info">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <div class="stat-title">จำนวนคำสั่งซื้อรวม</div>
          <div class="stat-value text-info text-3xl">{{ stats.total_orders }}</div>
          <div class="stat-desc">คำสั่งซื้อทั้งหมดในระบบ</div>
        </div>
        
        <!-- Today Orders -->
        <div class="stat bg-base-100 shadow-sm rounded-box border-t-4 border-warning">
          <div class="stat-figure text-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div class="stat-title">คำสั่งซื้อวันนี้</div>
          <div class="stat-value text-warning text-3xl">{{ stats.today_orders }}</div>
          <div class="stat-desc">ออเดอร์ที่เข้ามาในวันนี้</div>
        </div>
        
      </div>
      
      <div v-if="!loading && !error" class="mt-8 text-center bg-base-100 p-8 rounded-box shadow-sm border border-base-300">
        <p class="text-xl text-base-content/70">สถิติและกราฟเพิ่มเติมจะถูกเพิ่มเข้ามาในอนาคต 🚀</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/axios';

const stats = ref({
  total_orders: 0,
  total_revenue: 0,
  today_orders: 0,
  today_revenue: 0
});
const loading = ref(true);
const error = ref(null);

const formatCurrency = (val) => {
  return Number(val || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fetchAnalytics = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get('/reports/analytics/summary');
    stats.value = res.data;
  } catch (err) {
    console.error('Failed to fetch analytics:', err);
    error.value = 'ไม่สามารถดึงข้อมูลสถิติได้';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAnalytics();
});
</script>
