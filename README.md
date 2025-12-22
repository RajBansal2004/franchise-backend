# Franchise Backend

## Setup
1. copy .env.example to .env and fill MONGO_URI and JWT_SECRET.
2. npm install
3. npm run seed   # optional - creates admin, sample franchise, product
4. npm run dev

APIs:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/products
- POST /api/products (admin)
- POST /api/orders (auth)
- POST /api/orders/:id/approve (admin)
- etc.
