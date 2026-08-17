<template>
  <div class="min-h-screen bg-gradient-to-b from-primary to-primary-focus py-12 px-4">
    <div class="max-w-7xl mx-auto text-center">
      <h1 class="text-5xl font-bold text-white mb-4">🍽️ Restaurant Management System</h1>
      <p class="text-xl text-white mb-8">Welcome to our restaurant management platform</p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div class="card bg-white shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Menu</h2>
            <p>Browse our delicious menu items</p>
            <div class="card-actions justify-end">
              <router-link to="/products" class="btn btn-primary">View Menu</router-link>
            </div>
          </div>
        </div>

        <div class="card bg-white shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Orders</h2>
            <p>Track your orders in real-time</p>
            <div class="card-actions justify-end">
              <router-link to="/orders" class="btn btn-primary">View Orders</router-link>
            </div>
          </div>
        </div>

        <div class="card bg-white shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Dashboard</h2>
            <p>Manage your restaurant</p>
            <div class="card-actions justify-end">
              <router-link to="/dashboard" class="btn btn-primary">Go to Dashboard</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
};
</script>
