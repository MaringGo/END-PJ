import express from 'express';
import { pool } from '../server.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all orders (Requires authentication)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        o.id, o.order_code, o.user_id, o.total_price, o.status, o.payment_status, o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price,
              'product_name', p.name
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

// Get order by ID (Requires authentication)
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const orderQuery = `
      SELECT o.id, o.order_code, o.user_id, o.total_price, o.status, o.payment_status, o.created_at
      FROM orders o
      WHERE o.id = $1
    `;
    const orderResult = await pool.query(orderQuery, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemsQuery = `
      SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    const itemsResult = await pool.query(itemsQuery, [id]);

    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order', details: error.message });
  }
});

// Get order by order_code (for guest tracking)
router.get('/track/:orderCode', async (req, res) => {
  const { orderCode } = req.params;
  try {
    const orderQuery = `
      SELECT o.id, o.order_code, o.user_id, o.total_price, o.status, o.payment_status, o.created_at
      FROM orders o
      WHERE o.order_code = $1
    `;
    const orderResult = await pool.query(orderQuery, [orderCode]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemsQuery = `
      SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name as product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    const itemsResult = await pool.query(itemsQuery, [orderResult.rows[0].id]);

    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order', details: error.message });
  }
});

// Create order
router.post('/', async (req, res) => {
  const { user_id, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Items are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Calculate total price
    let totalPrice = 0;
    const productIds = items.map(item => item.product_id);

    const productsQuery = 'SELECT id, price FROM products WHERE id = ANY($1)';
    const productsResult = await client.query(productsQuery, [productIds]);
    const priceMap = {};
    productsResult.rows.forEach(p => {
      priceMap[p.id] = p.price;
    });

    items.forEach(item => {
      totalPrice += priceMap[item.product_id] * item.quantity;
    });

    // Create order
    const orderCode = `ORD-${Date.now()}`;
    const orderQuery = `
      INSERT INTO orders (order_code, user_id, total_price, status, payment_status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const orderResult = await client.query(orderQuery, [orderCode, user_id || null, totalPrice, 'pending', 'pending']);
    const orderId = orderResult.rows[0].id;

    // Create order items and update stock
    for (const item of items) {
      const itemQuery = `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(itemQuery, [orderId, item.product_id, item.quantity, priceMap[item.product_id]]);

      // Decrease stock
      const updateStockQuery = `
        UPDATE products SET stock = stock - $1 WHERE id = $2
      `;
      await client.query(updateStockQuery, [item.quantity, item.product_id]);

      // Log stock change
      const logQuery = `
        INSERT INTO stock_logs (product_id, change_quantity, action, order_id)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(logQuery, [item.product_id, -item.quantity, 'order_created', orderId]);
    }

    // Create order queue
    const queueQuery = `
      INSERT INTO order_queue (order_id, status)
      VALUES ($1, $2)
    `;
    await client.query(queueQuery, [orderId, 'pending']);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order created successfully',
      order: orderResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  } finally {
    client.release();
  }
});

// Update order status (Staff/Chef/Manager/Admin) (Requires authentication)
router.put('/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update order status
      const query = `
        UPDATE orders
        SET status = $2
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(query, [id, status]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // If cancelled, restore stock
      if (status === 'cancelled') {
        const itemsQuery = `SELECT product_id, quantity FROM order_items WHERE order_id = $1`;
        const itemsResult = await client.query(itemsQuery, [id]);
        
        for (const item of itemsResult.rows) {
          const updateStockQuery = `UPDATE products SET stock = stock + $1 WHERE id = $2`;
          await client.query(updateStockQuery, [item.quantity, item.product_id]);
          
          const logQuery = `
            INSERT INTO stock_logs (product_id, change_quantity, action, order_id)
            VALUES ($1, $2, $3, $4)
          `;
          await client.query(logQuery, [item.product_id, item.quantity, 'order_cancelled', id]);
        }
      }

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update order', details: error.message });
  }
});

export default router;
