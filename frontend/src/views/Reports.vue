<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Reports & Analytics</h1>
      <div class="alert alert-info">
        <span>Only Admin and Manager can view reports</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div class="card bg-white shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Weekly Sales</h2>
            <p>Chart will appear here</p>
          </div>
        </div>
        <div class="card bg-white shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Monthly Sales</h2>
            <p>Chart will appear here</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Reports'
};
</script>
