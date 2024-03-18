import express from 'express';
import User from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
      const { username, email, password, confirmPassword } = req.body;
  
      // 驗證密碼是否匹配
      if (password !== confirmPassword) {
        return res.status(400).send({ message: 'Passwords do not match' });
      }
  
      // 檢查用戶名和電子郵件是否已被使用
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).send({ message: 'Username or email already exists' });
      }
  
      // 加密密碼並創建用戶
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, email, password: hashedPassword });
      await user.save();
  
      // 創建 JWT token
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
      }
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // 返回 token
      res.status(201).send({ message: 'User successfully created', token });
    } catch (error) {
      res.status(500).send({ message: 'Error in signing up' });
    }
  });
  

router.post('/login', async (req, res) => {
  try {
    console.log("req.", req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
      }
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).send({ token });
  } catch (error) {
    res.status(500).send({ message: 'Error logging in user' });
  }
});

export default router;