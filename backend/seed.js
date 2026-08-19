import pg from 'pg';
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
    
    // Add default categories
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
    const catMap = {};
    catRes.rows.forEach(c => { catMap[c.name] = c.id; });

    // Add products
    const productQuery = `
      INSERT INTO products (name, description, price, stock, category_id)
      VALUES 
        ('ข้าวกะเพราหมูสับไข่ดาว', 'หมูสับผัดกะเพรารสจัดจ้าน เสิร์ฟพร้อมข้าวสวยและไข่ดาว', 65.00, 100, $1),
        ('ข้าวผัดต้มยำกุ้ง', 'ข้าวผัดเครื่องต้มยำพร้อมกุ้งตัวโตๆ', 85.00, 50, $1),
        ('ต้มข่าไก่', 'ต้มข่าไก่กะทิเข้มข้น หอมกลิ่นสมุนไพร', 120.00, 40, $2),
        ('ผัดไทยกุ้งสด', 'ผัดไทยเส้นจันท์เหนียวนุ่ม พร้อมกุ้งสด', 75.00, 60, $1),
        ('ชาไทยเย็น', 'ชาไทยชงสด หวานมันกำลังดี', 45.00, 200, $3),
        ('ชามะนาว', 'ชาดำเย็นผสมน้ำมะนาวคั้นสด', 45.00, 200, $3),
        ('ข้าวเหนียวมะม่วง', 'ข้าวเหนียวมูนกะทิ เสิร์ฟพร้อมมะม่วงน้ำดอกไม้', 80.00, 30, $4)
      ON CONFLICT DO NOTHING;
    `;
    await pool.query(productQuery, [
      catMap['อาหารจานเดียว'], 
      catMap['กับข้าว'], 
      catMap['เครื่องดื่ม'], 
      catMap['ของหวาน']
    ]);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed:', err);
    process.exit(1);
  }
}

seed();
