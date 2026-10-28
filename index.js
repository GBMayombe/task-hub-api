import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';

import routes from './routes/index.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// db connection
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('DB Connected');
} catch (error) {
  console.error('DB failed to connect with error:', error.message);
}

app.get('/', async (req, res) => {
  res.json({ message: 'Welcome to TaskHub API' });
});

app.use('/api-v1', routes);

// not found middleware
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// error middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err?.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
