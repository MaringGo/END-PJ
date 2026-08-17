<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Menu</h1>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card bg-white shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Product 1</h2>
            <p>Description coming soon...</p>
            <div class="card-actions justify-end">
              <button class="btn btn-primary">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Products'
};
</script>
