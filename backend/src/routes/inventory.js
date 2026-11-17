import express from 'express';
import { pool } from '../server.js';
import { roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Helper to determine status
const calculateStatus = (quantity, threshold) => {
  const q = parseFloat(quantity);
  const t = parseFloat(threshold || 5);
  if (q <= 0) return 'out_of_stock';
  if (q <= t) return 'low_stock';
  return 'ok';
};

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, name, quantity, unit, low_stock_threshold, status, updated_at
      FROM inventory
      ORDER BY 
        CASE 
          WHEN status = 'out_of_stock' THEN 1
          WHEN status = 'low_stock' THEN 2
          ELSE 3
        END,
        name ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch inventory', details: error.message });
  }
});

// Get low stock items
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const query = `
      SELECT id, name, quantity, unit, low_stock_threshold, status
      FROM inventory
      WHERE status IN ('low_stock', 'out_of_stock') OR quantity <= low_stock_threshold
      ORDER BY quantity ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch low stock alerts', details: error.message });
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

  if (!name || quantity === undefined || !unit) {
    return res.status(400).json({ error: 'Name, quantity, and unit are required' });
  }

  try {
    const threshold = low_stock_threshold !== undefined ? parseFloat(low_stock_threshold) : 5;
    const qty = parseFloat(quantity);
    const status = calculateStatus(qty, threshold);

    const query = `
      INSERT INTO inventory (name, quantity, unit, low_stock_threshold, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [name.trim(), qty, unit.trim(), threshold, status]);
    const newItem = result.rows[0];

    // Log stock addition
    const logQuery = `
      INSERT INTO stock_logs (inventory_id, change_quantity, action)
      VALUES ($1, $2, 'inventory_added')
    `;
    await pool.query(logQuery, [newItem.id, qty]);

    res.status(201).json(newItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add inventory', details: error.message });
  }
});

// Update inventory (Manager/Admin only)
router.put('/:id', roleMiddleware(['admin', 'manager']), async (req, res) => {
  const { id } = req.params;
  const { name, quantity, unit, low_stock_threshold } = req.body;

  try {
    // Get current inventory
    const currentQuery = 'SELECT * FROM inventory WHERE id = $1';
    const currentResult = await pool.query(currentQuery, [id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const currentItem = currentResult.rows[0];
    const newName = name !== undefined && name.trim() ? name.trim() : currentItem.name;
    const newQuantity = quantity !== undefined ? parseFloat(quantity) : parseFloat(currentItem.quantity);
    const newUnit = unit !== undefined && unit.trim() ? unit.trim() : currentItem.unit;
    const newThreshold = low_stock_threshold !== undefined ? parseFloat(low_stock_threshold) : parseFloat(currentItem.low_stock_threshold);
    
    const quantityChange = newQuantity - parseFloat(currentItem.quantity);
    const status = calculateStatus(newQuantity, newThreshold);

    const query = `
      UPDATE inventory
      SET name = $2,
          quantity = $3,
          unit = $4,
          low_stock_threshold = $5,
          status = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id, newName, newQuantity, newUnit, newThreshold, status]);

    // Log stock change
    if (quantityChange !== 0) {
      const logQuery = `
        INSERT INTO stock_logs (inventory_id, change_quantity, action)
        VALUES ($1, $2, 'inventory_adjusted')
      `;
      await pool.query(logQuery, [id, quantityChange]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update inventory', details: error.message });
  }
});

// Delete inventory (Manager/Admin only)
router.delete('/:id', roleMiddleware(['admin', 'manager']), async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM inventory WHERE id = $1 RETURNING id, name';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json({ message: 'Inventory item deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete inventory', details: error.message });
  }
});

export default router;
