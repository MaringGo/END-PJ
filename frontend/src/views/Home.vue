<template>
  <div class="min-h-screen bg-base-200">
    <!-- Hero Section -->
    <div class="hero min-h-[60vh] bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10">
      <div class="hero-content text-center py-20">
        <div class="max-w-2xl">
          <div class="text-6xl mb-6">🍽️</div>
          <h1 class="text-5xl font-extrabold text-base-content mb-6 tracking-tight">
            อาหารแสนอร่อย<br />
            <span class="text-primary">เสิร์ฟตรงถึงโต๊ะคุณ</span>
          </h1>
          <p class="text-lg text-base-content/70 mb-8 leading-relaxed">
            สัมผัสประสบการณ์ความอร่อยที่คัดสรรมาอย่างดี เลือกชมเมนูอาหารจานโปรดของคุณ และทำรายการสั่งซื้อได้ง่ายๆ เพียงไม่กี่ขั้นตอน
          </p>
          <div class="flex gap-4 justify-center">
            <router-link to="/products" class="btn btn-primary btn-lg rounded-full px-8 shadow-lg hover:shadow-xl transition-all">
              ดูเมนูอาหาร
            </router-link>
            <router-link to="/orders" class="btn btn-outline btn-lg rounded-full px-8">
              ติดตามออเดอร์
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Links Section -->
    <div class="py-16 px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold text-center mb-12">ขั้นตอนการใช้งาน</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <!-- Step 1 -->
          <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-base-200">
            <div class="card-body items-center text-center p-8">
              <div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl mb-4">
                📖
              </div>
              <h3 class="card-title text-xl mb-2">1. เลือกเมนูอาหาร</h3>
              <p class="text-base-content/70">เลือกดูรายการอาหารที่หลากหลาย ซึ่งปรุงอย่างพิถีพิถันจากเชฟมืออาชีพของเรา</p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-base-200">
            <div class="card-body items-center text-center p-8">
              <div class="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center text-3xl mb-4">
                🛒
              </div>
              <h3 class="card-title text-xl mb-2">2. ทำการสั่งอาหาร</h3>
              <p class="text-base-content/70">เพิ่มรายการอาหารที่คุณต้องการลงในตะกร้า และกดยืนยันการสั่งซื้อได้ทันที</p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-base-200">
            <div class="card-body items-center text-center p-8">
              <div class="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center text-3xl mb-4">
                ✨
              </div>
              <h3 class="card-title text-xl mb-2">3. รอรับความอร่อย</h3>
              <p class="text-base-content/70">ติดตามสถานะการปรุงอาหารและการเสิร์ฟแบบเรียลไทม์ และเตรียมอิ่มอร่อยกับมื้ออาหาร</p>
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
