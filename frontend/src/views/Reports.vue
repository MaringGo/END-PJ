<template>
  <div class="min-h-screen bg-base-200 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold">รายงานและสถิติการขาย (Reports)</h1>
          <p class="text-base-content/70 mt-1">สรุปข้อมูลยอดขาย สถิติรายสัปดาห์/เดือน และเมนูยอดนิยม</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="fetchAllReports" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          รีเฟรชข้อมูล
        </button>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else-if="error" class="alert alert-error shadow-lg mb-6">
        <span>{{ error }}</span>
      </div>

      <div v-else class="space-y-8">
        <!-- Top Selling Products -->
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body">
            <h2 class="card-title text-xl mb-4">🏆 เมนูขายดี 10 อันดับแรก</h2>
            <div class="overflow-x-auto">
              <table class="table w-full">
                <thead>
                  <tr>
                    <th>อันดับ</th>
                    <th>ชื่อเมนู</th>
                    <th class="text-right">จำนวนที่ขายได้</th>
                    <th class="text-right">ยอดขายรวม</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, idx) in topProducts" :key="p.id" class="hover">
                    <td>
                      <span class="badge" :class="idx === 0 ? 'badge-warning font-bold' : idx < 3 ? 'badge-primary' : 'badge-ghost'">#{{ idx + 1 }}</span>
                    </td>
                    <td class="font-semibold">{{ p.name }}</td>
                    <td class="text-right font-bold">{{ p.total_sold }} จาน</td>
                    <td class="text-right text-primary font-bold">฿{{ formatCurrency(p.total_revenue) }}</td>
                  </tr>
                  <tr v-if="topProducts.length === 0">
                    <td colspan="4" class="text-center py-6 text-base-content/50">ยังไม่มีข้อมูลการขาย</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Weekly Summary -->
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body">
              <h2 class="card-title text-xl mb-4">📅 สรุปยอดขายรายสัปดาห์</h2>
              <div class="overflow-x-auto">
                <table class="table table-sm w-full">
                  <thead>
                    <tr>
                      <th>สัปดาห์เริ่มต้น</th>
                      <th class="text-center">จำนวนออเดอร์</th>
                      <th class="text-right">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="w in weeklyData" :key="w.week_start">
                      <td>{{ formatDate(w.week_start) }}</td>
                      <td class="text-center">{{ w.order_count }}</td>
                      <td class="text-right font-bold text-success">฿{{ formatCurrency(w.total_revenue) }}</td>
                    </tr>
                    <tr v-if="weeklyData.length === 0">
                      <td colspan="3" class="text-center py-6 text-base-content/50">ไม่มีข้อมูล</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Monthly Summary -->
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body">
              <h2 class="card-title text-xl mb-4">📊 สรุปยอดขายรายเดือน</h2>
              <div class="overflow-x-auto">
                <table class="table table-sm w-full">
                  <thead>
                    <tr>
                      <th>เดือน</th>
                      <th class="text-center">จำนวนออเดอร์</th>
                      <th class="text-right">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="m in monthlyData" :key="m.month_start">
                      <td>{{ formatMonth(m.month_start) }}</td>
                      <td class="text-center">{{ m.order_count }}</td>
                      <td class="text-right font-bold text-primary">฿{{ formatCurrency(m.total_revenue) }}</td>
                    </tr>
                    <tr v-if="monthlyData.length === 0">
                      <td colspan="3" class="text-center py-6 text-base-content/50">ไม่มีข้อมูล</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/axios';

const loading = ref(true);
const error = ref(null);
const topProducts = ref([]);
const weeklyData = ref([]);
const monthlyData = ref([]);

const formatCurrency = (val) => {
  return Number(val || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('th-TH');
};

const formatMonth = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
};

const fetchAllReports = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [topRes, weeklyRes, monthlyRes] = await Promise.all([
      api.get('/reports/products/top'),
      api.get('/reports/summary/weekly'),
      api.get('/reports/summary/monthly')
    ]);
    topProducts.value = topRes.data;
    weeklyData.value = weeklyRes.data;
    monthlyData.value = monthlyRes.data;
  } catch (err) {
    console.error('Failed to fetch reports:', err);
    error.value = 'ไม่สามารถดึงข้อมูลรายงานได้';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAllReports();
});
</script>
