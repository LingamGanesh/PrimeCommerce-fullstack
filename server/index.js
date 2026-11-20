import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/connectDB.js';
import userRouter from './routes/user.routes.js';
import catalogRouter from './routes/catalog.routes.js';
import cartRouter from './routes/cart.routes.js';
import addressRouter from './routes/address.routes.js';
import checkoutRouter from './routes/checkout.routes.js';
import ordersRouter from './routes/orders.routes.js';
import adminRouter from './routes/admin.routes.js';

dotenv.config();

const app = express();

app.use(cors({
  credentials: true,
  origin: process.env.FRONTEND_URL
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(helmet({ crossOriginResourcePolicy: false }));

app.get('/', (req, res) => {
  res.json({ message: "Server is running" });
});

app.use('/api/user', userRouter);
app.use('/api/v1', catalogRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/addresses', addressRouter);
app.use('/api/v1/checkout', checkoutRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/admin', adminRouter);

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
