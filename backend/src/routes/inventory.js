import express from 'express';
import { pool } from '../server.js';
import { roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, name, quantity, unit, low_stock_threshold, status
      FROM inventory
      ORDER BY name
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch inventory', details: error.message });
  }
});

// Get inventory by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'SELECT * FROM inventory WHERE id = $1';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch inventory', details: error.message });
  }
});

// Add inventory (Manager/Admin only)
router.post('/', roleMiddleware(['admin', 'manager']), async (req, res) => {
  const { name, quantity, unit, low_stock_threshold } = req.body;

  if (!name || !quantity || !unit) {
    return res.status(400).json({ error: 'Name, quantity, and unit are required' });
  }

  try {
    const query = `
      INSERT INTO inventory (name, quantity, unit, low_stock_threshold, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const status = quantity <= low_stock_threshold ? 'low_stock' : 'ok';
    const result = await pool.query(query, [name, quantity, unit, low_stock_threshold || 5, status]);

    // Log stock addition
    const logQuery = `
      INSERT INTO stock_logs (product_id, change_quantity, action)
      VALUES (NULL, $1, 'inventory_added')
    `;
    await pool.query(logQuery, [quantity]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add inventory', details: error.message });
  }
});

// Update inventory (Manager/Admin only)
router.put('/:id', roleMiddleware(['admin', 'manager']), async (req, res) => {
  const { id } = req.params;
  const { quantity, unit, low_stock_threshold } = req.body;

  try {
    // Get current inventory
    const currentQuery = 'SELECT quantity FROM inventory WHERE id = $1';
    const currentResult = await pool.query(currentQuery, [id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const currentQuantity = currentResult.rows[0].quantity;
    const quantityChange = quantity - currentQuantity;

    const newThreshold = low_stock_threshold !== undefined ? low_stock_threshold : 'low_stock_threshold';
    const status = quantity <= (low_stock_threshold || 5) ? 'low_stock' : 'ok';

    const query = `
      UPDATE inventory
      SET quantity = $2,
          unit = COALESCE($3, unit),
          low_stock_threshold = COALESCE($4, low_stock_threshold),
          status = $5
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id, quantity, unit, low_stock_threshold, status]);

    // Log stock change
    if (quantityChange !== 0) {
      const logQuery = `
        INSERT INTO stock_logs (product_id, change_quantity, action)
        VALUES (NULL, $1, 'inventory_adjusted')
      `;
      await pool.query(logQuery, [quantityChange]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update inventory', details: error.message });
  }
});

// Get low stock items
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const query = `
      SELECT id, name, quantity, unit, low_stock_threshold, status
      FROM inventory
      WHERE status = 'low_stock' OR quantity = 0
      ORDER BY quantity ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch low stock alerts', details: error.message });
  }
});

export default router;
