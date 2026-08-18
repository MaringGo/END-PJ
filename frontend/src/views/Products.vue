<template>
  <div class="min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      
      <!-- Header & Search -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 class="text-4xl font-extrabold text-base-content tracking-tight">Our Menu</h1>
        <div class="form-control w-full md:w-auto">
          <div class="input-group">
            <input 
              type="text" 
              placeholder="Search dishes..." 
              class="input input-bordered w-full md:w-80 shadow-sm focus:border-primary transition-colors"
              v-model="searchQuery"
            />
          </div>
        </div>
      </div>

      <!-- Categories Filter -->
      <div class="flex overflow-x-auto gap-2 pb-4 mb-8 hide-scrollbar">
        <button 
          @click="selectedCategory = null"
          class="btn btn-sm sm:btn-md rounded-full transition-all duration-300"
          :class="selectedCategory === null ? 'btn-primary shadow-md' : 'btn-ghost bg-base-100 hover:bg-base-300'"
        >
          All
        </button>
        <button 
          v-for="category in categories" 
          :key="category.id"
          @click="selectedCategory = category.id"
          class="btn btn-sm sm:btn-md rounded-full transition-all duration-300 whitespace-nowrap"
          :class="selectedCategory === category.id ? 'btn-primary shadow-md' : 'btn-ghost bg-base-100 hover:bg-base-300'"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-error shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{{ error }}</span>
        <button class="btn btn-sm" @click="fetchProducts">Retry</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredProducts.length === 0" class="text-center py-20">
        <div class="text-6xl mb-4">🍽️</div>
        <h3 class="text-2xl font-semibold text-base-content/70">No dishes found</h3>
        <p class="text-base-content/50 mt-2">Try adjusting your search or category filter.</p>
        <button class="btn btn-outline mt-6" @click="clearFilters">Clear Filters</button>
      </div>

      <!-- Products Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="product in filteredProducts" 
          :key="product.id" 
          class="card bg-base-100 shadow-sm hover:shadow-xl transition-all duration-300 group border border-base-200"
        >
          <!-- Simulated Image Area with gradient placeholder -->
          <figure class="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
            <div class="absolute inset-0 flex items-center justify-center text-4xl opacity-50 group-hover:scale-110 transition-transform duration-500">
              🍲
            </div>
            <!-- Category Badge -->
            <div class="absolute top-2 right-2 badge badge-neutral shadow-sm opacity-90">
              {{ product.category || 'General' }}
            </div>
          </figure>
          
          <div class="card-body p-5">
            <h2 class="card-title text-lg leading-tight font-bold group-hover:text-primary transition-colors">
              {{ product.name }}
            </h2>
            <p class="text-sm text-base-content/70 line-clamp-2 mt-1 min-h-[40px]">
              {{ product.description || 'A delicious dish prepared with fresh ingredients.' }}
            </p>
            
            <div class="flex items-center justify-between mt-4">
              <span class="text-xl font-extrabold text-primary">฿{{ Number(product.price).toFixed(2) }}</span>
              <span v-if="product.stock <= 5 && product.stock > 0" class="text-xs text-warning font-semibold">Only {{product.stock}} left!</span>
              <span v-else-if="product.stock <= 0" class="text-xs text-error font-semibold">Sold Out</span>
            </div>

            <div class="card-actions justify-end mt-4">
              <button 
                class="btn btn-primary w-full shadow-sm hover:shadow-md transition-shadow group-active:scale-95"
                :disabled="product.stock <= 0"
                @click="addToCart(product)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast Notification (simulated simple one) -->
    <div class="toast toast-bottom toast-end z-50" v-if="showToast">
      <div class="alert alert-success shadow-lg">
        <span>Added to cart successfully.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api/axios';
import { useCartStore } from '../stores/cart';

const cartStore = useCartStore();

const products = ref([]);
const categories = ref([]);
const loading = ref(true);
const error = ref(null);

const searchQuery = ref('');
const selectedCategory = ref(null);
const showToast = ref(false);

const fetchProducts = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get('/products');
    products.value = res.data;
    
    // Extract unique categories from products
    const uniqueCategories = [];
    const catMap = new Map();
    for (const p of res.data) {
      if (p.category_id && !catMap.has(p.category_id)) {
        catMap.set(p.category_id, true);
        uniqueCategories.push({ id: p.category_id, name: p.category });
      }
    }
    categories.value = uniqueCategories.sort((a,b) => a.name.localeCompare(b.name));
    
  } catch (err) {
    console.error('Failed to fetch products:', err);
    error.value = 'Failed to load menu. Please try again later.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchProducts();
});

const filteredProducts = computed(() => {
  let result = products.value;
  
  if (selectedCategory.value !== null) {
    result = result.filter(p => p.category_id === selectedCategory.value);
  }
  
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.description && p.description.toLowerCase().includes(q))
    );
  }
  
  return result;
});

const clearFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = null;
};

const addToCart = (product) => {
  cartStore.addToCart(product);
  
  // Show toast
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 2000);
};
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
