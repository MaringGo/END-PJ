<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="stat bg-white shadow">
          <div class="stat-title">Total Orders</div>
          <div class="stat-value text-primary">0</div>
        </div>
        <div class="stat bg-white shadow">
          <div class="stat-title">Revenue Today</div>
          <div class="stat-value text-success">$0</div>
        </div>
        <div class="stat bg-white shadow">
          <div class="stat-title">Pending Orders</div>
          <div class="stat-value text-warning">0</div>
        </div>
        <div class="stat bg-white shadow">
          <div class="stat-title">Low Stock Items</div>
          <div class="stat-value text-error">0</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard'
};
</script>
