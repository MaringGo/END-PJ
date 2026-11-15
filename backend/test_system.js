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

    let createdProductId;
    await test('Create Product as Admin (Role check: Admin allowed)', async () => {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'เมนูทดสอบระบบ',
          description: 'รายละเอียดเมนูทดสอบ',
          price: 99.00,
          stock: 50,
          category_id: sampleProducts[0]?.category_id || 1
        })
      });
      const data = await res.json();
      if (res.status !== 201 || !data.id) {
        throw new Error(`Create product failed: ${JSON.stringify(data)}`);
      }
      createdProductId = data.id;
    });

    await test('Create Product as Customer (Role check: Customer rejected 403)', async () => {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          name: 'เมนูแอบสร้าง',
          price: 50.00
        })
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      }
    });

    await test('Update Product as Manager (Role check: Manager allowed)', async () => {
      const res = await fetch(`${BASE_URL}/api/products/${createdProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${managerToken}`
        },
        body: JSON.stringify({
          price: 110.00,
          stock: 45
        })
      });
      const data = await res.json();
      if (res.status !== 200 || Number(data.price) !== 110.00 || data.stock !== 45) {
        throw new Error(`Update product failed: ${JSON.stringify(data)}`);
      }
    });

    await test('Delete Product as Admin', async () => {
      const res = await fetch(`${BASE_URL}/api/products/${createdProductId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.status !== 200) {
        throw new Error(`Delete failed: ${JSON.stringify(data)}`);
      }
    });

    // 6. Orders & Checkout (Guest & Customer)
    let guestOrder;
    await test('Create Order as Guest (Guest Checkout)', async () => {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: sampleProducts[0].id, quantity: 2 }]
        })
      });
      const data = await res.json();
      if (res.status !== 201 || !data.order || !data.order.order_code) {
        throw new Error(`Create guest order failed: ${JSON.stringify(data)}`);
      }
      guestOrder = data.order;
    });

    await test('Track Order by Order Code without Auth (Guest tracking)', async () => {
      const res = await fetch(`${BASE_URL}/api/orders/track/${guestOrder.order_code}`);
      const data = await res.json();
      if (res.status !== 200 || data.order_code !== guestOrder.order_code || !data.items || data.items.length === 0) {
        throw new Error(`Track order failed: ${JSON.stringify(data)}`);
      }
    });

    let customerOrder;
    await test('Create Order as Authenticated Customer', async () => {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          user_id: customerUser.id,
          items: [{ product_id: sampleProducts[1].id, quantity: 1 }]
        })
      });
      const data = await res.json();
      if (res.status !== 201 || !data.order) {
        throw new Error(`Create customer order failed: ${JSON.stringify(data)}`);
      }
      customerOrder = data.order;
      if (Number(customerOrder.user_id) !== Number(customerUser.id)) {
        throw new Error(`Order user_id mismatch: expected ${customerUser.id}, got ${customerOrder.user_id}`);
      }
    });

    await test('Customer orders isolation (Customer only gets own orders)', async () => {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data)) {
        throw new Error(`Failed to get orders: ${JSON.stringify(data)}`);
      }
      const otherUserOrders = data.filter(o => o.user_id !== customerUser.id);
      if (otherUserOrders.length > 0) {
        throw new Error(`Customer saw other orders: ${JSON.stringify(otherUserOrders)}`);
      }
    });

    await test('Staff/Chef can see all orders', async () => {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${chefToken}` }
      });
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data) || data.length < 2) {
        throw new Error(`Staff should see all orders, got: ${JSON.stringify(data)}`);
      }
    });

    // 7. Payment (PromptPay QR & Verification)
    let paymentData;
    await test('Create Payment (PromptPay QR generation)', async () => {
      const res = await fetch(`${BASE_URL}/api/payments/create/${customerOrder.id}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.status !== 201 || !data.payment || !data.payment.qr_code) {
        throw new Error(`Payment creation failed: ${JSON.stringify(data)}`);
      }
      paymentData = data.payment;
      if (!paymentData.qr_code.startsWith('000201')) {
        throw new Error(`Invalid EMVCo QR code payload: ${paymentData.qr_code}`);
      }
    });

    await test('Verify Payment (Update order to paid & preparing)', async () => {
      const res = await fetch(`${BASE_URL}/api/payments/${customerOrder.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'completed' })
      });
      const data = await res.json();
      if (res.status !== 200 || data.payment.payment_status !== 'completed') {
        throw new Error(`Payment verify failed: ${JSON.stringify(data)}`);
      }

      // Verify order status updated to preparing and paid
      const orderRes = await fetch(`${BASE_URL}/api/orders/track/${customerOrder.order_code}`);
      const updatedOrder = await orderRes.json();
      if (updatedOrder.payment_status !== 'paid' || updatedOrder.status !== 'preparing') {
        throw new Error(`Order status mismatch after payment: ${JSON.stringify(updatedOrder)}`);
      }
    });

    // 8. Kitchen Status Updates
    await test('Kitchen updates order status: preparing -> ready', async () => {
      const res = await fetch(`${BASE_URL}/api/orders/${customerOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chefToken}`
        },
        body: JSON.stringify({ status: 'ready' })
      });
      const data = await res.json();
      if (res.status !== 200 || data.status !== 'ready') {
        throw new Error(`Status update failed: ${JSON.stringify(data)}`);
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

    await test('Chef access Reports (Rejected 403 Forbidden)', async () => {
      const res = await fetch(`${BASE_URL}/api/reports/analytics/summary`, {
        headers: { 'Authorization': `Bearer ${chefToken}` }
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      }
    });

    // 10. Inventory API
    let inventoryId;
    await test('Add Inventory item (Manager allowed)', async () => {
      const res = await fetch(`${BASE_URL}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${managerToken}`
        },
        body: JSON.stringify({
          name: 'หมูสับสด',
          quantity: 20,
          unit: 'กิโลกรัม',
          low_stock_threshold: 5
        })
      });
      const data = await res.json();
      if (res.status !== 201 || !data.id) {
        throw new Error(`Add inventory failed: ${JSON.stringify(data)}`);
      }
      inventoryId = data.id;
    });

    await test('Get Inventory items list', async () => {
      const res = await fetch(`${BASE_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data)) {
        throw new Error(`Get inventory failed: ${JSON.stringify(data)}`);
      }
    });

    await test('Update Inventory stock', async () => {
      const res = await fetch(`${BASE_URL}/api/inventory/${inventoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          quantity: 3
        })
      });
      const data = await res.json();
      if (res.status !== 200 || data.quantity !== 3 || data.status !== 'low_stock') {
        throw new Error(`Update inventory failed: ${JSON.stringify(data)}`);
      }
    });

    await test('Check Low Stock Alerts', async () => {
      const res = await fetch(`${BASE_URL}/api/inventory/alerts/low-stock`, {
        headers: { 'Authorization': `Bearer ${managerToken}` }
      });
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data) || data.length === 0) {
        throw new Error(`Low stock alerts failed: ${JSON.stringify(data)}`);
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
