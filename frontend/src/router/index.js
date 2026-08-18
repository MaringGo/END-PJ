import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Dashboard from '../views/Dashboard.vue';
import Products from '../views/Products.vue';
import Cart from '../views/Cart.vue';
import Orders from '../views/Orders.vue';
import Reports from '../views/Reports.vue';
import Inventory from '../views/Inventory.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/products',
    name: 'Products',
    component: Products
  },
  {
    path: '/cart',
    name: 'Cart',
    component: Cart,
    meta: { requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: Orders,
    meta: { requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: Reports,
    meta: { requiresAuth: true, requiresRole: ['admin', 'manager'] }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: Inventory,
    meta: { requiresAuth: true, requiresRole: ['admin', 'manager'] }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.meta.requiresRole) {
    let userData = {};
    try {
      if (user && user !== 'undefined') {
        userData = JSON.parse(user);
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
    
    if (!to.meta.requiresRole.includes(userData.role)) {
      next('/');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
