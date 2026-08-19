import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password, role = 'customer' } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role
    `;

    const result = await pool.query(query, [username, email, hashedPassword, role]);
    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get Profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const query = 'SELECT id, username, email, role, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
});

// Update Profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }
  
  try {
    let query;
    let values;
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = `
        UPDATE users 
        SET username = $1, email = $2, password = $3 
        WHERE id = $4 
        RETURNING id, username, email, role, created_at
      `;
      values = [username, email, hashedPassword, req.user.id];
    } else {
      query = `
        UPDATE users 
        SET username = $1, email = $2 
        WHERE id = $3 
        RETURNING id, username, email, role, created_at
      `;
      values = [username, email, req.user.id];
    }
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create new token in case username changes
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );
    
    res.json({ message: 'Profile updated successfully', user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

export default router;
