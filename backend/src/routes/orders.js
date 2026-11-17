import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../server.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all orders (Requires authentication)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const isCustomer = req.user.role === 'customer';
    const whereClause = isCustomer ? 'WHERE o.user_id = $1' : '';
    const params = isCustomer ? [req.user.id] : [];

    const query = `
      SELECT 
        o.id, o.order_code, o.table_no, o.user_id, o.total_price, o.status, o.payment_status, o.created_at,
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
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query, params);
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
    let orderQuery = `
      SELECT o.id, o.order_code, o.table_no, o.user_id, o.total_price, o.status, o.payment_status, o.created_at
      FROM orders o
      WHERE o.id = $1
    `;
    const params = [id];
    if (req.user.role === 'customer') {
      orderQuery += ' AND o.user_id = $2';
      params.push(req.user.id);
    }
    const orderResult = await pool.query(orderQuery, params);

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
      SELECT o.id, o.order_code, o.table_no, o.user_id, o.total_price, o.status, o.payment_status, o.created_at
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

// Create order (รองรับรับประทานที่ร้าน ชำระเงินหลังทานเสร็จ)
router.post('/', async (req, res) => {
  let { user_id, items, table_no } = req.body;

  // If token is provided, extract user_id if not present
  if (!user_id && req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
      user_id = decoded.id;
    } catch (e) {
      // Continue as guest
    }
  }

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
      priceMap[p.id] = parseFloat(p.price);
    });

    items.forEach(item => {
      totalPrice += (priceMap[item.product_id] || 0) * item.quantity;
    });

    // Create order with initial status: 'pending' (รับออเดอร์) and payment_status: 'unpaid' (ชำระเงินหลังทานอาหารเสร็จ)
    const orderCode = `ORD-${Date.now()}`;
    const assignedTable = (table_no || '1').toString().trim();
    
    const orderQuery = `
      INSERT INTO orders (order_code, table_no, user_id, total_price, status, payment_status)
      VALUES ($1, $2, $3, $4, 'pending', 'unpaid')
      RETURNING *
    `;
    const orderResult = await client.query(orderQuery, [orderCode, assignedTable, user_id || null, totalPrice]);
    const orderId = orderResult.rows[0].id;

    // Create order items
    for (const item of items) {
      const itemQuery = `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(itemQuery, [orderId, item.product_id, item.quantity, priceMap[item.product_id] || 0]);

      // Deduct raw materials / ingredients if mapped in product_ingredients
      try {
        const ingQuery = `
          SELECT inventory_id, quantity_used 
          FROM product_ingredients 
          WHERE product_id = $1
        `;
        const ingResult = await client.query(ingQuery, [item.product_id]);
        
        for (const ing of ingResult.rows) {
          const totalUsed = parseFloat(ing.quantity_used) * item.quantity;
          await client.query(`
            UPDATE inventory 
            SET quantity = GREATEST(0, quantity - $1),
                status = CASE 
                  WHEN quantity - $1 <= 0 THEN 'out_of_stock'
                  WHEN quantity - $1 <= low_stock_threshold THEN 'low_stock'
                  ELSE 'ok'
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [totalUsed, ing.inventory_id]);

          await client.query(`
            INSERT INTO stock_logs (inventory_id, change_quantity, action, order_id)
            VALUES ($1, $2, 'order_used', $3)
          `, [ing.inventory_id, -totalUsed, orderId]);
        }
      } catch (err) {
        console.warn('Note: No product_ingredients deducted or table not yet populated:', err.message);
      }
    }

    // Create order queue for kitchen
    const queueQuery = `
      INSERT INTO order_queue (order_id, status)
      VALUES ($1, 'pending')
    `;
    await client.query(queueQuery, [orderId]);

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

// Update order status (Staff/Chef/Manager/Admin)
// Flow: pending -> confirmed -> preparing -> ready -> served -> completed (or cancelled)
router.put('/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status, payment_status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update order status
      let query;
      let params;
      if (payment_status) {
        query = `
          UPDATE orders
          SET status = $2,
              payment_status = $3,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `;
        params = [id, status, payment_status];
      } else {
        query = `
          UPDATE orders
          SET status = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `;
        params = [id, status];
      }
      
      const result = await client.query(query, params);
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Order not found' });
      }

      // Update order_queue status as well
      await client.query(`
        UPDATE order_queue 
        SET status = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE order_id = $1
      `, [id, status]);

      // If cancelled, restore ingredients
      if (status === 'cancelled') {
        const logsQuery = `
          SELECT inventory_id, change_quantity 
          FROM stock_logs 
          WHERE order_id = $1 AND inventory_id IS NOT NULL AND action = 'order_used'
        `;
        const logsResult = await client.query(logsQuery, [id]);
        
        for (const log of logsResult.rows) {
          const restoreQty = Math.abs(parseFloat(log.change_quantity));
          await client.query(`
            UPDATE inventory 
            SET quantity = quantity + $1,
                status = CASE 
                  WHEN quantity + $1 <= 0 THEN 'out_of_stock'
                  WHEN quantity + $1 <= low_stock_threshold THEN 'low_stock'
                  ELSE 'ok'
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [restoreQty, log.inventory_id]);

          await client.query(`
            INSERT INTO stock_logs (inventory_id, change_quantity, action, order_id)
            VALUES ($1, $2, 'order_cancelled', $3)
          `, [log.inventory_id, restoreQty, id]);
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
