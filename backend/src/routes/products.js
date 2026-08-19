import express from 'express';
import { pool } from '../server.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.id, p.name, p.description, p.price, p.stock, p.category_id, c.name as category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const query = 'SELECT * FROM categories ORDER BY name';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

// Get products by category
router.get('/category/:category_id', async (req, res) => {
  const { category_id } = req.params;
  try {
    const query = `
      SELECT id, name, description, price, stock, category_id
      FROM products
      WHERE category_id = $1
      ORDER BY name
    `;
    const result = await pool.query(query, [category_id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT p.id, p.name, p.description, p.price, p.stock, p.category_id, c.name as category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch product', details: error.message });
  }
});

// Create product (Admin/Manager only)
router.post('/', authMiddleware, roleMiddleware(['admin', 'manager']), async (req, res) => {
  const { name, description, price, stock, category_id } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  try {
    const query = `
      INSERT INTO products (name, description, price, stock, category_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [name, description, price, stock || 0, category_id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
});

// Update product (Admin/Manager only)
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'manager']), async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category_id } = req.body;

  try {
    const query = `
      UPDATE products
      SET name = COALESCE($2, name),
          description = COALESCE($3, description),
          price = COALESCE($4, price),
          stock = COALESCE($5, stock),
          category_id = COALESCE($6, category_id)
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id, name, description, price, stock, category_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// Delete product (Admin/Manager only)
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'manager']), async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

export default router;
