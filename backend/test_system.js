import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import { pool } from './src/server.js';
import authRoutes from './src/routes/auth.js';
import productRoutes from './src/routes/products.js';
import orderRoutes from './src/routes/orders.js';
import paymentRoutes from './src/routes/payments.js';
import inventoryRoutes from './src/routes/inventory.js';
import reportRoutes from './src/routes/reports.js';
import { authMiddleware } from './src/middleware/auth.js';
import { initializeDatabase } from './src/database/init.js';
import { seedDatabase } from './seed.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.get('/health', (req, res) => res.json({ status: 'Backend is running' }));

const TEST_PORT = 5055;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function runTests() {
  await initializeDatabase();
  await seedDatabase(pool);
  const server = app.listen(TEST_PORT);
  console.log(`Test server running on ${BASE_URL}`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  try {
    // 1. Health check
    await test('Health check endpoint /health', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      const data = await res.json();
      if (res.status !== 200 || data.status !== 'Backend is running') {
        throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
      }
    });

    // 2. Authentication: Login default accounts
    let adminToken, managerToken, chefToken, staffToken, customerToken, customerUser;
    
    await test('Login as Admin', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
      });
      const data = await res.json();
      if (res.status !== 200 || !data.token || data.user.role !== 'admin') {
        throw new Error(`Login failed: ${JSON.stringify(data)}`);
      }
      adminToken = data.token;
    });

    await test('Login as Manager', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'manager@test.com', password: 'password123' })
      });
      const data = await res.json();
      if (res.status !== 200 || !data.token || data.user.role !== 'manager') {
        throw new Error(`Login failed: ${JSON.stringify(data)}`);
      }
      managerToken = data.token;
    });

    await test('Login as Chef', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'chef@test.com', password: 'password123' })
      });
      const data = await res.json();
      if (res.status !== 200 || !data.token || data.user.role !== 'chef') {
        throw new Error(`Login failed: ${JSON.stringify(data)}`);
      }
      chefToken = data.token;
    });

    await test('Login as Staff', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'staff@test.com', password: 'password123' })
      });
      const data = await res.json();
      if (res.status !== 200 || !data.token || data.user.role !== 'staff') {
        throw new Error(`Login failed: ${JSON.stringify(data)}`);
      }
      staffToken = data.token;
    });

    await test('Login as Customer', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'customer@test.com', password: 'password123' })
      });
      const data = await res.json();
      if (res.status !== 200 || !data.token || data.user.role !== 'customer') {
        throw new Error(`Login failed: ${JSON.stringify(data)}`);
      }
      customerToken = data.token;
      customerUser = data.user;
    });

    // 3. Register a new user
    let newUserId;
    await test('Register new user', async () => {
      const username = `testuser_${Date.now()}`;
      const email = `${username}@example.com`;
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password: 'password123' })
      });
      const data = await res.json();
      if (res.status !== 201 || !data.token) {
        throw new Error(`Register failed: ${JSON.stringify(data)}`);
      }
      newUserId = data.user.id;
    });

    // 4. Profile API
    await test('Get Profile (auth required)', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      const data = await res.json();
      if (res.status !== 200 || data.email !== 'customer@test.com') {
        throw new Error(`Get profile failed: ${JSON.stringify(data)}`);
      }
    });

    // 5. Products & Categories
    let sampleProducts = [];
    await test('Get Products list', async () => {
      const res = await fetch(`${BASE_URL}/api/products`);
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data) || data.length === 0) {
        throw new Error(`Expected products list, got: ${JSON.stringify(data)}`);
      }
      sampleProducts = data;
    });

    await test('Get Categories list', async () => {
      const res = await fetch(`${BASE_URL}/api/products/categories`);
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data) || data.length === 0) {
        throw new Error(`Expected categories list, got: ${JSON.stringify(data)}`);
      }
    });

    // 6. Raw Materials Inventory (ระบบสต็อกวัตถุดิบ)
    let inventoryId;
    await test('Add Raw Material to Inventory (Manager/Admin allowed)', async () => {
      const res = await fetch(`${BASE_URL}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${managerToken}`
        },
        body: JSON.stringify({
          name: 'เนื้อหมูสับเกรดเอ',
          quantity: 25.5,
          unit: 'กิโลกรัม',
          low_stock_threshold: 5.0
        })
      });
      const data = await res.json();
      if (res.status !== 201 || !data.id || parseFloat(data.quantity) !== 25.5) {
        throw new Error(`Add inventory failed: ${JSON.stringify(data)}`);
      }
      inventoryId = data.id;
    });

    await test('Get Raw Materials Inventory list', async () => {
      const res = await fetch(`${BASE_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data) || data.length === 0) {
        throw new Error(`Get inventory list failed: ${JSON.stringify(data)}`);
      }
    });

    await test('Update Raw Material quantity & check status calculation', async () => {
      const res = await fetch(`${BASE_URL}/api/inventory/${inventoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${managerToken}`
        },
        body: JSON.stringify({
          quantity: 3.0,
          low_stock_threshold: 5.0
        })
      });
      const data = await res.json();
      if (res.status !== 200 || parseFloat(data.quantity) !== 3.0 || data.status !== 'low_stock') {
        throw new Error(`Update inventory failed: ${JSON.stringify(data)}`);
      }
    });

    await test('Check Low Stock Alerts for Raw Materials', async () => {
      const res = await fetch(`${BASE_URL}/api/inventory/alerts/low-stock`, {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data) || data.length === 0) {
        throw new Error(`Low stock alerts failed: ${JSON.stringify(data)}`);
      }
      const found = data.some(i => i.id === inventoryId);
      if (!found) throw new Error(`Expected item ${inventoryId} in low stock list`);
    });

    await test('Delete Raw Material from Inventory', async () => {
      const res = await fetch(`${BASE_URL}/api/inventory/${inventoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.status !== 200) {
        throw new Error(`Delete inventory failed: ${JSON.stringify(data)}`);
      }
    });

    // 7. Full 6-Step Dine-in Order & Pay-after-eating Workflow
    // Flow: 1.รับออเดอร์ (pending) -> 2.ยืนยัน (confirmed) -> 3.ลงมือทำ (preparing) -> 4.รอเสิร์ฟ (ready) -> 5.เสิร์ฟสำเร็จ (served) -> 6.จ่ายตัง (completed/paid)
    let dineInOrder;
    
    await test('Step 1: Place Dine-in Order (starts at pending & unpaid with table_no)', async () => {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          table_no: 'โต๊ะ 3',
          items: [
            { product_id: sampleProducts[0].id, quantity: 2 },
            { product_id: sampleProducts[1].id, quantity: 1 }
          ]
        })
      });
      const data = await res.json();
      if (res.status !== 201 || !data.order) {
        throw new Error(`Create order failed: ${JSON.stringify(data)}`);
      }
      dineInOrder = data.order;
      if (dineInOrder.status !== 'pending') {
        throw new Error(`Expected status 'pending', got '${dineInOrder.status}'`);
      }
      if (dineInOrder.payment_status !== 'unpaid') {
        throw new Error(`Expected payment_status 'unpaid' (pay after dining), got '${dineInOrder.payment_status}'`);
      }
      if (dineInOrder.table_no !== 'โต๊ะ 3') {
        throw new Error(`Expected table_no 'โต๊ะ 3', got '${dineInOrder.table_no}'`);
      }
    });

    await test('Step 2: Staff confirms order (pending -> confirmed)', async () => {
      const res = await fetch(`${BASE_URL}/api/orders/${dineInOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${staffToken}`
        },
        body: JSON.stringify({ status: 'confirmed' })
      });
      const data = await res.json();
      if (res.status !== 200 || data.status !== 'confirmed') {
        throw new Error(`Expected confirmed status, got: ${JSON.stringify(data)}`);
      }
    });

    await test('Step 3: Kitchen starts cooking (confirmed -> preparing)', async () => {
      const res = await fetch(`${BASE_URL}/api/orders/${dineInOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chefToken}`
        },
        body: JSON.stringify({ status: 'preparing' })
      });
      const data = await res.json();
      if (res.status !== 200 || data.status !== 'preparing') {
        throw new Error(`Expected preparing status, got: ${JSON.stringify(data)}`);
      }
    });

    await test('Step 4: Cooking finished (preparing -> ready to serve)', async () => {
      const res = await fetch(`${BASE_URL}/api/orders/${dineInOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chefToken}`
        },
        body: JSON.stringify({ status: 'ready' })
      });
      const data = await res.json();
      if (res.status !== 200 || data.status !== 'ready') {
        throw new Error(`Expected ready status, got: ${JSON.stringify(data)}`);
      }
    });

    await test('Step 5: Food served to table (ready -> served)', async () => {
      const res = await fetch(`${BASE_URL}/api/orders/${dineInOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${staffToken}`
        },
        body: JSON.stringify({ status: 'served' })
      });
      const data = await res.json();
      if (res.status !== 200 || data.status !== 'served') {
        throw new Error(`Expected served status, got: ${JSON.stringify(data)}`);
      }
    });

    await test('Step 6a: Generate PromptPay QR after meal for payment', async () => {
      const res = await fetch(`${BASE_URL}/api/payments/create/${dineInOrder.id}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.status !== 200 && res.status !== 201) {
        throw new Error(`Payment generation failed: ${JSON.stringify(data)}`);
      }
      if (!data.payment || !data.payment.qr_code || !data.payment.qr_code.startsWith('000201')) {
        throw new Error(`Invalid QR Code payload: ${JSON.stringify(data)}`);
      }
    });

    await test('Step 6b: Payment verified (served -> completed, unpaid -> paid)', async () => {
      const res = await fetch(`${BASE_URL}/api/payments/${dineInOrder.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'completed', payment_method: 'promptpay' })
      });
      const data = await res.json();
      if (res.status !== 200 || data.payment.payment_status !== 'completed') {
        throw new Error(`Payment verify failed: ${JSON.stringify(data)}`);
      }

      // Verify order is now completed and paid
      const orderRes = await fetch(`${BASE_URL}/api/orders/track/${dineInOrder.order_code}`);
      const updatedOrder = await orderRes.json();
      if (updatedOrder.status !== 'completed') {
        throw new Error(`Expected order status 'completed', got '${updatedOrder.status}'`);
      }
      if (updatedOrder.payment_status !== 'paid') {
        throw new Error(`Expected payment_status 'paid', got '${updatedOrder.payment_status}'`);
      }
    });

    // 8. Guest Tracking with Table No
    await test('Guest tracking with order code returns table number and items', async () => {
      const res = await fetch(`${BASE_URL}/api/orders/track/${dineInOrder.order_code}`);
      const data = await res.json();
      if (res.status !== 200 || data.table_no !== 'โต๊ะ 3' || data.items.length === 0) {
        throw new Error(`Guest tracking failed: ${JSON.stringify(data)}`);
      }
    });

    // 9. Reports & Analytics (RBAC check)
    await test('Admin access Reports (Allowed)', async () => {
      const res = await fetch(`${BASE_URL}/api/reports/analytics/summary`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.status !== 200 || data.total_orders === undefined) {
        throw new Error(`Analytics failed: ${JSON.stringify(data)}`);
      }
    });

    await test('Manager access Reports (Allowed)', async () => {
      const res = await fetch(`${BASE_URL}/api/reports/products/top`, {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data)) {
        throw new Error(`Top products report failed: ${JSON.stringify(data)}`);
      }
    });

    await test('Customer access Reports (Rejected 403 Forbidden)', async () => {
      const res = await fetch(`${BASE_URL}/api/reports/analytics/summary`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      }
    });

  } finally {
    server.close();
    await pool.end();
  }

  console.log(`\n================================`);
  console.log(`TEST SUMMARY:`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
