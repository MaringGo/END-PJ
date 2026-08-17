import express from 'express';
import { pool } from '../server.js';
import { reportAccessMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get sales report (Admin/Manager only)
router.get('/sales', reportAccessMiddleware, async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let query = `
      SELECT 
        DATE(o.created_at) as date,
        COUNT(o.id) as order_count,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value
      FROM orders o
      WHERE o.payment_status = 'paid'
    `;

    const params = [];

    if (startDate) {
      query += ` AND o.created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND o.created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` GROUP BY DATE(o.created_at) ORDER BY DATE(o.created_at) DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch sales report', details: error.message });
  }
});

// Get weekly summary (Admin/Manager only)
router.get('/summary/weekly', reportAccessMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_TRUNC('week', o.created_at)::date as week_start,
        COUNT(o.id) as order_count,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value
      FROM orders o
      WHERE o.payment_status = 'paid'
      GROUP BY DATE_TRUNC('week', o.created_at)
      ORDER BY week_start DESC
      LIMIT 12
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch weekly summary', details: error.message });
  }
});

// Get monthly summary (Admin/Manager only)
router.get('/summary/monthly', reportAccessMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_TRUNC('month', o.created_at)::date as month_start,
        COUNT(o.id) as order_count,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value
      FROM orders o
      WHERE o.payment_status = 'paid'
      GROUP BY DATE_TRUNC('month', o.created_at)
      ORDER BY month_start DESC
      LIMIT 12
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch monthly summary', details: error.message });
  }
});

// Get top products (Admin/Manager only)
router.get('/products/top', reportAccessMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'paid'
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 10
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch top products', details: error.message });
  }
});

// Get analytics summary (Admin/Manager only)
router.get('/analytics/summary', reportAccessMiddleware, async (req, res) => {
  try {
    const totalOrdersQuery = 'SELECT COUNT(*) as total FROM orders WHERE payment_status = \'paid\'';
    const totalRevenueQuery = 'SELECT SUM(total_price) as total FROM orders WHERE payment_status = \'paid\'';
    const todayOrdersQuery = 'SELECT COUNT(*) as total FROM orders WHERE payment_status = \'paid\' AND DATE(created_at) = CURRENT_DATE';
    const todayRevenueQuery = 'SELECT SUM(total_price) as total FROM orders WHERE payment_status = \'paid\' AND DATE(created_at) = CURRENT_DATE';

    const [totalOrders, totalRevenue, todayOrders, todayRevenue] = await Promise.all([
      pool.query(totalOrdersQuery),
      pool.query(totalRevenueQuery),
      pool.query(todayOrdersQuery),
      pool.query(todayRevenueQuery)
    ]);

    res.json({
      total_orders: totalOrders.rows[0].total,
      total_revenue: totalRevenue.rows[0].total || 0,
      today_orders: todayOrders.rows[0].total,
      today_revenue: todayRevenue.rows[0].total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

export default router;
