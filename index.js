import express from 'express';
import bodyParser from 'body-parser'
const PORT = process.env.PORT || 4000;
// import Connect from './configs/mongoDB';
import usersRoutes from './routes/usersRoutes.js'
import accountRoutes from './routes/accountRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import cors from 'cors'
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();


const app = express();

app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())

// routes
app.get('/', (req, res) => res.send('This is the Server Page!'))
app.use('/user', usersRoutes);
app.use('/account', accountRoutes);
app.use('/admin', adminRoutes);


// Connect to mongodb
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => app.listen(PORT, () => console.log(`Server started on port ${PORT} successfully`)))
    .catch((error) => console.log(error.message));