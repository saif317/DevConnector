// Depndencies
import express from 'express';
import { connectDB } from './config/db.js';

// Init Express
const app = express();

// Import Routers
import { router as userRouter } from './routes/api/users.js';
import { router as postsRouter } from './routes/api/posts.js';
import { router as profileRouter } from './routes/api/profile.js';
import { router as authRouter } from './routes/api/auth.js';

//Connect to Database
connectDB();

// Init body-parser Middleware
app.use(express.json({ extended: false }));

// GET request to main entry point
app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/users', userRouter);
app.use('/api/posts', postsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/auth', authRouter);

// Listen for connections on PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
