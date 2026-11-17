import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'restaurant_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function seed() {
  try {
    console.log('Seeding database...');
    
    // Create test users
    const passwordHash = await bcrypt.hash('password123', 10);
    const users = [
      { username: 'admin', email: 'admin@test.com', role: 'admin' },
      { username: 'manager', email: 'manager@test.com', role: 'manager' },
      { username: 'chef', email: 'chef@test.com', role: 'chef' },
      { username: 'staff', email: 'staff@test.com', role: 'staff' },
      { username: 'customer', email: 'customer@test.com', role: 'customer' }
    ];

    for (const u of users) {
      await pool.query(
        `INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password`,
        [u.username, u.email, passwordHash, u.role]
      );
    }
    console.log('Test users created.');
    
    // Check and add categories
    const existingCats = await pool.query('SELECT id, name FROM categories');
    const catMap = {};
    if (existingCats.rows.length === 0) {
      const categoryQuery = `
        INSERT INTO categories (name, description) 
        VALUES 
          ('อาหารจานเดียว', 'อาหารจานเดียวรสชาติเด็ด'),
          ('กับข้าว', 'เมนูอาหารสำหรับทานคู่กับข้าวสวย'),
          ('เครื่องดื่ม', 'เครื่องดื่มดับกระหาย'),
          ('ของหวาน', 'ของหวานหลังมื้ออาหาร')
        RETURNING id, name;
      `;
      const catRes = await pool.query(categoryQuery);
      catRes.rows.forEach(c => { catMap[c.name] = c.id; });
    } else {
      existingCats.rows.forEach(c => { catMap[c.name] = c.id; });
    }

    // Check and add products
    const existingProducts = await pool.query('SELECT id, name FROM products');
    const prodMap = {};
    if (existingProducts.rows.length === 0) {
      const productQuery = `
        INSERT INTO products (name, description, price, stock, category_id)
        VALUES 
          ('ข้าวกะเพราหมูสับไข่ดาว', 'หมูสับผัดกะเพรารสจัดจ้าน เสิร์ฟพร้อมข้าวสวยและไข่ดาว', 65.00, 100, $1),
          ('ข้าวผัดต้มยำกุ้ง', 'ข้าวผัดเครื่องต้มยำพร้อมกุ้งตัวโตๆ', 85.00, 100, $1),
          ('ต้มข่าไก่', 'ต้มข่าไก่กะทิเข้มข้น หอมกลิ่นสมุนไพร', 120.00, 100, $2),
          ('ผัดไทยกุ้งสด', 'ผัดไทยเส้นจันท์เหนียวนุ่ม พร้อมกุ้งสด', 75.00, 100, $1),
          ('ชาไทยเย็น', 'ชาไทยชงสด หวานมันกำลังดี', 45.00, 100, $3),
          ('ชามะนาว', 'ชาดำเย็นผสมน้ำมะนาวคั้นสด', 45.00, 100, $3),
          ('ข้าวเหนียวมะม่วง', 'ข้าวเหนียวมูนกะทิ เสิร์ฟพร้อมมะม่วงน้ำดอกไม้', 80.00, 100, $4)
        RETURNING id, name;
      `;
      const prodRes = await pool.query(productQuery, [
        catMap['อาหารจานเดียว'], 
        catMap['กับข้าว'], 
        catMap['เครื่องดื่ม'], 
        catMap['ของหวาน']
      ]);
      prodRes.rows.forEach(p => { prodMap[p.name] = p.id; });
    } else {
      existingProducts.rows.forEach(p => { prodMap[p.name] = p.id; });
    }

    // Check and add raw materials into inventory (สต็อกวัตถุดิบ)
    const existingInv = await pool.query('SELECT id, name FROM inventory');
    const invMap = {};
    if (existingInv.rows.length === 0) {
      const rawMaterials = [
        { name: 'ข้าวหอมมะลิ', quantity: 50.0, unit: 'กิโลกรัม', threshold: 10.0, status: 'ok' },
        { name: 'เนื้อหมูสับ', quantity: 20.0, unit: 'กิโลกรัม', threshold: 5.0, status: 'ok' },
        { name: 'กุ้งขาวสด', quantity: 12.0, unit: 'กิโลกรัม', threshold: 3.0, status: 'ok' },
        { name: 'เนื้อไก่สด', quantity: 15.0, unit: 'กิโลกรัม', threshold: 4.0, status: 'ok' },
        { name: 'ไข่ไก่สด', quantity: 100.0, unit: 'ฟอง', threshold: 20.0, status: 'ok' },
        { name: 'ใบกะเพรา', quantity: 4.0, unit: 'กิโลกรัม', threshold: 1.0, status: 'ok' },
        { name: 'พริกขี้หนูสด', quantity: 3.0, unit: 'กิโลกรัม', threshold: 0.5, status: 'ok' },
        { name: 'เส้นผัดไทย', quantity: 10.0, unit: 'กิโลกรัม', threshold: 2.0, status: 'ok' },
        { name: 'กะทิสด', quantity: 15.0, unit: 'กล่อง', threshold: 4.0, status: 'ok' },
        { name: 'ผงชาไทย', quantity: 10.0, unit: 'ห่อ', threshold: 2.0, status: 'ok' },
        { name: 'นมข้นหวาน', quantity: 20.0, unit: 'กระป๋อง', threshold: 5.0, status: 'ok' },
        { name: 'มะนาวสด', quantity: 50.0, unit: 'ลูก', threshold: 10.0, status: 'ok' },
        { name: 'ข้าวเหนียวมูน', quantity: 8.0, unit: 'กิโลกรัม', threshold: 2.0, status: 'ok' },
        { name: 'มะม่วงน้ำดอกไม้', quantity: 12.0, unit: 'กิโลกรัม', threshold: 3.0, status: 'ok' },
      ];

      for (const m of rawMaterials) {
        const res = await pool.query(
          `INSERT INTO inventory (name, quantity, unit, low_stock_threshold, status)
           VALUES ($1, $2, $3, $4, $5) RETURNING id, name`,
          [m.name, m.quantity, m.unit, m.threshold, m.status]
        );
        invMap[res.rows[0].name] = res.rows[0].id;
      }
      console.log('Raw materials seeded into inventory.');
    } else {
      existingInv.rows.forEach(i => { invMap[i.name] = i.id; });
    }

    // Seed product_ingredients (สูตรอาหารเชื่อมโยงวัตถุดิบ)
    const existingIngs = await pool.query('SELECT id FROM product_ingredients LIMIT 1');
    if (existingIngs.rows.length === 0 && Object.keys(invMap).length > 0) {
      const recipes = [
        // ข้าวกะเพราหมูสับไข่ดาว
        { prod: 'ข้าวกะเพราหมูสับไข่ดาว', inv: 'เนื้อหมูสับ', qty: 0.15 },
        { prod: 'ข้าวกะเพราหมูสับไข่ดาว', inv: 'ข้าวหอมมะลิ', qty: 0.20 },
        { prod: 'ข้าวกะเพราหมูสับไข่ดาว', inv: 'ไข่ไก่สด', qty: 1.0 },
        { prod: 'ข้าวกะเพราหมูสับไข่ดาว', inv: 'ใบกะเพรา', qty: 0.02 },
        // ข้าวผัดต้มยำกุ้ง
        { prod: 'ข้าวผัดต้มยำกุ้ง', inv: 'กุ้งขาวสด', qty: 0.12 },
        { prod: 'ข้าวผัดต้มยำกุ้ง', inv: 'ข้าวหอมมะลิ', qty: 0.20 },
        { prod: 'ข้าวผัดต้มยำกุ้ง', inv: 'มะนาวสด', qty: 1.0 },
        // ต้มข่าไก่
        { prod: 'ต้มข่าไก่', inv: 'เนื้อไก่สด', qty: 0.20 },
        { prod: 'ต้มข่าไก่', inv: 'กะทิสด', qty: 0.25 },
        // ผัดไทยกุ้งสด
        { prod: 'ผัดไทยกุ้งสด', inv: 'เส้นผัดไทย', qty: 0.15 },
        { prod: 'ผัดไทยกุ้งสด', inv: 'กุ้งขาวสด', qty: 0.10 },
        { prod: 'ผัดไทยกุ้งสด', inv: 'ไข่ไก่สด', qty: 1.0 },
        // ชาไทยเย็น
        { prod: 'ชาไทยเย็น', inv: 'ผงชาไทย', qty: 0.05 },
        { prod: 'ชาไทยเย็น', inv: 'นมข้นหวาน', qty: 0.10 },
        // ชามะนาว
        { prod: 'ชามะนาว', inv: 'ผงชาไทย', qty: 0.05 },
        { prod: 'ชามะนาว', inv: 'มะนาวสด', qty: 1.0 },
        // ข้าวเหนียวมะม่วง
        { prod: 'ข้าวเหนียวมะม่วง', inv: 'ข้าวเหนียวมูน', qty: 0.20 },
        { prod: 'ข้าวเหนียวมะม่วง', inv: 'มะม่วงน้ำดอกไม้', qty: 0.30 },
      ];

      for (const r of recipes) {
        if (prodMap[r.prod] && invMap[r.inv]) {
          await pool.query(
            `INSERT INTO product_ingredients (product_id, inventory_id, quantity_used)
             VALUES ($1, $2, $3)`,
            [prodMap[r.prod], invMap[r.inv], r.qty]
          );
        }
      }
      console.log('Product ingredients (recipes) seeded.');
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed:', err);
    process.exit(1);
  }
}

seed();
