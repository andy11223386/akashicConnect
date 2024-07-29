import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import postRoutes from './routes/post';
import commentRoutes from './routes/comment';
import dotenv from 'dotenv';
import cors from 'cors';



dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/comment', commentRoutes);
const port = 3000;
app.get('/', (req, res) => {
  res.send('The server is working!');
});
app.listen(port, () => {
  if (port === 3000) {
    console.log('true')
  }
  console.log(`server is listening on ${port} !!!`);
});

const mongoURI = "mongodb+srv://andy11223386:n091158052@cluster0.sp7plmw.mongodb.net/?retryWrites=true&w=majority";
// mongoose.connect(mongoURI)
//   .then(() => console.log('MongoDB connection successful'))
//   .catch((err) => console.error('MongoDB connection error:', err));

  mongoose.set("strictQuery", false);
  mongoose
    .connect(mongoURI)
    .then(() => {
      console.log("連線成功");
    })
    .catch(() => {
      console.log("連線失敗");
    });