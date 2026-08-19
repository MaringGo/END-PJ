import express from 'express';
import { pool } from '../server.js';
import generatePayload from 'promptpay-qr';

import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get payment for order
router.get('/:order_id', async (req, res) => {
  const { order_id } = req.params;
  try {
    const query = `
      SELECT id, order_id, payment_method, qr_code, amount, payment_status, created_at
      FROM payments
      WHERE order_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [order_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payment', details: error.message });
  }
});

// Create payment (generate QR code)
router.post('/create/:order_id', async (req, res) => {
  const { order_id } = req.params;

  try {
    // Get order details
    const orderQuery = 'SELECT id, total_price FROM orders WHERE id = $1';
    const orderResult = await pool.query(orderQuery, [order_id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    const mobileNumber = '0812345678';
    const amount = parseFloat(order.total_price);
    const payload = generatePayload(mobileNumber, { amount });

    const paymentQuery = `
      INSERT INTO payments (order_id, payment_method, qr_code, amount, payment_status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const paymentResult = await pool.query(paymentQuery, [order_id, 'promptpay', payload, amount, 'pending']);

    res.status(201).json({
      message: 'QR code generated successfully',
      payment: paymentResult.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create payment', details: error.message });
  }
});

// Update payment status
router.put('/:order_id/verify', async (req, res) => {
  const { order_id } = req.params;
  const { payment_status } = req.body;

  if (!payment_status) {
    return res.status(400).json({ error: 'Payment status is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update payment status
    const paymentQuery = `
      UPDATE payments
      SET payment_status = $2
      WHERE order_id = $1
      RETURNING *
    `;
    const paymentResult = await client.query(paymentQuery, [order_id, payment_status]);

    if (paymentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payment not found' });
    }

    // If payment is successful, update order status
    if (payment_status === 'completed') {
      const orderQuery = `
        UPDATE orders
        SET payment_status = 'paid', status = 'preparing'
        WHERE id = $1
        RETURNING *
      `;
      await client.query(orderQuery, [order_id]);

      // Add to payment history
      const historyQuery = `
        INSERT INTO payment_history (order_id, amount, payment_method, status)
        SELECT id, total_price, 'qr', 'completed'
        FROM orders WHERE id = $1
      `;
      await client.query(historyQuery, [order_id]);
    }

    await client.query('COMMIT');

    res.json({
      message: 'Payment status updated successfully',
      payment: paymentResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Failed to verify payment', details: error.message });
  } finally {
    client.release();
  }
});

// Get payment history (Requires authentication)
router.get('/history/all', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT id, order_id, amount, payment_method, status, created_at
      FROM payment_history
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payment history', details: error.message });
  }
});

export default router;
