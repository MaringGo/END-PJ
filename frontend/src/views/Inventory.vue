<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Inventory Management</h1>
      <div class="card bg-white shadow-xl">
        <div class="card-body">
          <h2 class="card-title mb-4">Stock Items</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="3" class="text-center py-4">No inventory items</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Inventory'
};
</script>
