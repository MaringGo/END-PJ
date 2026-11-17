import { pool } from '../server.js';

export const initializeDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 100,
        category_id INT REFERENCES categories(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create inventory table (วัตถุดิบในคลัง)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL,
        low_stock_threshold DECIMAL(10, 2) DEFAULT 5,
        status VARCHAR(50) DEFAULT 'ok',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create product_ingredients table (สูตรอาหาร: เมนูนี้ใช้วัตถุดิบอะไรบ้าง)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_ingredients (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        inventory_id INT REFERENCES inventory(id) ON DELETE CASCADE,
        quantity_used DECIMAL(10, 2) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_code VARCHAR(255) UNIQUE NOT NULL,
        table_no VARCHAR(50) DEFAULT '1',
        user_id INT REFERENCES users(id),
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration helper for existing orders table: ensure table_no exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='table_no') THEN
          ALTER TABLE orders ADD COLUMN table_no VARCHAR(50) DEFAULT '1';
        END IF;
      END $$;
    `);

    // Migration helper for inventory table: ensure numeric types
    await pool.query(`
      DO $$
      BEGIN
        ALTER TABLE inventory ALTER COLUMN quantity TYPE DECIMAL(10, 2);
        ALTER TABLE inventory ALTER COLUMN low_stock_threshold TYPE DECIMAL(10, 2);
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
    `);

    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id),
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        payment_method VARCHAR(50),
        qr_code TEXT,
        amount DECIMAL(10, 2) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create order_queue table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_queue (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create payment_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_history (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create stock_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_logs (
        id SERIAL PRIMARY KEY,
        inventory_id INT REFERENCES inventory(id) ON DELETE SET NULL,
        product_id INT REFERENCES products(id) ON DELETE SET NULL,
        change_quantity DECIMAL(10, 2) NOT NULL,
        action VARCHAR(50),
        order_id INT REFERENCES orders(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create carts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized successfully');

    // Auto-seed initial data if users table is empty
    try {
      const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCountRes.rows[0].count, 10) === 0) {
        console.log('🌱 Database is empty. Auto-seeding initial users, products, and raw materials...');
        const { seedDatabase } = await import('../../seed.js');
        await seedDatabase(pool);
      }
    } catch (seedErr) {
      console.warn('⚠️ Auto-seed check warning:', seedErr.message);
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};
