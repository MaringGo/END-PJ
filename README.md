# 🍽️ Restaurant Management System

A full-stack web application for restaurant management with order processing, inventory tracking, QR-based payments, and role-based analytics.

## Project Structure

```
END-PJ/
├── backend/              # Express.js backend API
│   ├── src/
│   │   ├── server.js     # Main application entry
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth & role middleware
│   │   └── database/     # DB initialization
│   ├── package.json
│   └── .env.example
│
├── frontend/             # Vue 3 + Vite frontend
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── router/       # Vue Router
│   │   ├── views/        # Page components
│   │   └── index.css     # Tailwind CSS
│   ├── package.json
│   └── .env.example
│
├── docker/               # Docker configuration
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
│
├── docker-compose.yml    # Multi-container orchestration
└── planPJ.md            # Project plan & requirements
```

## Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL
- JWT Authentication + bcrypt
- RESTful API

**Frontend:**
- Vue 3 + Vite
- TailwindCSS + daisyUI
- Vue Router
- Axios

**Infrastructure:**
- Docker & Docker Compose

## Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- Docker & Docker Compose (optional)

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/MaringGo/END-PJ.git
   cd END-PJ
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run dev
   ```
   Backend runs on http://localhost:5000

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```
   Frontend runs on http://localhost:3000

### Option 2: Docker Compose

```bash
docker-compose up --build
```

This will start:
- PostgreSQL on localhost:5432
- Backend API on localhost:5000
- Frontend on localhost:3000

## Database Schema

- **users** - User accounts with roles (admin, manager, chef, staff, customer)
- **categories** - Food categories
- **products** - Menu items
- **inventory** - Stock/ingredients
- **orders** - Order records
- **order_items** - Individual items in orders
- **payments** - Payment records with QR codes
- **order_queue** - Order processing queue
- **payment_history** - Payment audit trail
- **stock_logs** - Inventory change tracking
- **carts** - Shopping carts

## Role-Based Access Control

| Role | Reports | Inventory | Orders | Payments |
|------|---------|-----------|--------|----------|
| Admin | ✅ Full Access | ✅ Full | ✅ Full | ✅ Full |
| Manager | ✅ Sales/Analytics | ✅ View/Edit | ✅ Full | ✅ View |
| Chef | ❌ | ❌ | ✅ View Queue | ❌ |
| Staff | ❌ | ❌ | ✅ Full | ✅ Verify |
| Customer | ❌ | ❌ | ✅ Own Orders | ✅ Own Payments |

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product (Admin/Manager)
- `PUT /api/products/:id` - Update product (Admin/Manager)
- `DELETE /api/products/:id` - Delete product (Admin/Manager)

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status

### Payments
- `POST /api/payments/create/:order_id` - Generate QR code
- `PUT /api/payments/:order_id/verify` - Verify payment
- `GET /api/payments/history/all` - Payment history

### Reports (Admin/Manager only)
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/summary/weekly` - Weekly summary
- `GET /api/reports/summary/monthly` - Monthly summary
- `GET /api/reports/products/top` - Top products
- `GET /api/reports/analytics/summary` - Analytics overview

### Inventory
- `GET /api/inventory` - List inventory
- `POST /api/inventory` - Add item (Manager/Admin)
- `PUT /api/inventory/:id` - Update item (Manager/Admin)
- `GET /api/inventory/alerts/low-stock` - Low stock alerts

## Features

✅ User authentication with JWT
✅ Role-based access control
✅ Menu management
✅ Shopping cart
✅ QR code payment generation
✅ Order tracking
✅ Inventory management with alerts
✅ Sales reports (Admin/Manager only)
✅ Weekly/monthly analytics
✅ Stock logging & history
✅ Real-time order queue
✅ Docker containerization

## Development

### Initialize Database

When backend starts, tables are automatically created. To manually initialize:

```javascript
import { initializeDatabase } from './src/database/init.js';
await initializeDatabase();
```

### Environment Variables

**Backend (.env)**
```
PORT=5000
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
JWT_SECRET=your_secret_key_change_in_production
NODE_ENV=development
```

**Frontend (.env)**
```
PORT=3000
VITE_API_URL=http://localhost:5000
```

## Project Phases

1. ✅ **Phase 1**: Requirements & Design (Completed)
2. 🔄 **Phase 2**: Backend Development (In Progress)
3. ⏳ **Phase 3**: Frontend Development
4. ⏳ **Phase 4**: Testing & QA
5. ⏳ **Phase 5**: Deployment

## Performance & Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: 7-day expiration
- **CORS**: Configured for frontend domain
- **SQL Injection Protection**: Parameterized queries via pg library
- **Role-Based Middleware**: Enforced on both Frontend & Backend

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check credentials in .env
- Verify DB_HOST (use 'postgres' in Docker, 'localhost' locally)

### Port Already in Use
- Change PORT in .env
- Or kill process: `lsof -i :5000` (macOS/Linux)

### Docker Issues
- Clear cache: `docker-compose down -v`
- Rebuild: `docker-compose up --build --force-recreate`

## Contributing

Follow the Git workflow:
1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m "Add feature"`
3. Push to GitHub: `git push origin feature/feature-name`
4. Create Pull Request

## License

ISC

## Contact

For questions or support, please open an issue on GitHub.

---

**Last Updated**: August 17, 2026