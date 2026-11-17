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

// Create payment (generate QR code for PromptPay)
router.post('/create/:order_id', async (req, res) => {
  const { order_id } = req.params;

  try {
    // Get order details
    const orderQuery = 'SELECT id, total_price, payment_status FROM orders WHERE id = $1';
    const orderResult = await pool.query(orderQuery, [order_id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Check if payment already exists
    const existingPayment = await pool.query(
      'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
      [order_id]
    );
    if (existingPayment.rows.length > 0 && existingPayment.rows[0].payment_status !== 'completed') {
      return res.status(200).json({
        message: 'QR code fetched successfully',
        payment: existingPayment.rows[0]
      });
    }

    const mobileNumber = '0812345678';
    const amount = parseFloat(order.total_price);
    const payload = generatePayload(mobileNumber, { amount });

    const paymentQuery = `
      INSERT INTO payments (order_id, payment_method, qr_code, amount, payment_status)
      VALUES ($1, 'promptpay', $2, $3, 'pending')
      RETURNING *
    `;
    const paymentResult = await pool.query(paymentQuery, [order_id, payload, amount]);

    res.status(201).json({
      message: 'QR code generated successfully',
      payment: paymentResult.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create payment', details: error.message });
  }
});

// Update payment status (ยืนยันชำระเงินหลังจากทานอาหารเสร็จ: status -> completed)
router.put('/:order_id/verify', async (req, res) => {
  const { order_id } = req.params;
  const { payment_status, payment_method } = req.body;

  if (!payment_status) {
    return res.status(400).json({ error: 'Payment status is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const method = payment_method || 'promptpay';

    // Check or create payment row if verifying directly (e.g. cash)
    let paymentResult = await client.query(`
      UPDATE payments
      SET payment_status = $2,
          payment_method = COALESCE($3, payment_method),
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING *
    `, [order_id, payment_status, method]);

    if (paymentResult.rows.length === 0) {
      // Create payment record on the fly
      const orderRes = await client.query('SELECT total_price FROM orders WHERE id = $1', [order_id]);
      if (orderRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Order not found' });
      }
      const amount = parseFloat(orderRes.rows[0].total_price);
      paymentResult = await client.query(`
        INSERT INTO payments (order_id, payment_method, amount, payment_status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [order_id, method, amount, payment_status]);
    }

    // When payment is completed after dining: update order status to 'completed' and payment_status to 'paid'
    if (payment_status === 'completed') {
      const orderQuery = `
        UPDATE orders
        SET payment_status = 'paid', status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      await client.query(orderQuery, [order_id]);

      // Add to payment history
      const historyQuery = `
        INSERT INTO payment_history (order_id, amount, payment_method, status)
        SELECT id, total_price, $2, 'completed'
        FROM orders WHERE id = $1
      `;
      await client.query(historyQuery, [order_id, method]);
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
