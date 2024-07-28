import express from 'express';
import User from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Sign Up Route
router.post('/signup', async (req, res) => {
  try {
      const { username, email, password, confirmPassword} = req.body;

      // Validate passwords
      if (password !== confirmPassword) {
          return res.status(400).send({ message: 'Passwords do not match' });
      }

      // Check if username or email is already taken
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
          return res.status(400).send({ message: 'Username or email already exists' });
      }

      // Create new user with profile info
      const user = new User({ username, email, password, nickname:'', bio: '', createdAt: new Date().toISOString(), followings: [], followers: [] });
      await user.save();

      // Create JWT token
      if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET is not defined');
      }
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Return token
      res.status(201).send({ message: 'User successfully created', token });
  } catch (error) {
      res.status(500).send({ message: 'Error in signing up' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
      }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const profile = {
      username: user.username,
      nickname: user.nickname,
      bio: user.bio,
      createdAt: user.createdAt,
      followingsCount: user.followings.length,
      followersCount: user.followers.length
    };


    res.status(200).send({ 
      status: 'success',
      data: {token, profile}
   });

  } catch (error) {
    res.status(500).send({ message: 'Error logging in user' });
  }
});

// Get Profile Route
router.post('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .select('username nickname bio createdAt followings followers')
      .lean();

    if (!user) return res.status(404).send({ message: 'User not found' });

    const profile = {
      username: user.username,
      nickname: user.nickname,
      bio: user.bio,
      createdAt: user.createdAt,
      followingsCount: user.followings.length,
      followersCount: user.followers.length
    };


    res.status(200).send({ 
      status: 'success',
      data: profile
   });

  } catch (error) {
    res.status(500).send({ message: 'Error retrieving profile' });
  }
});

// Update Profile Route
router.post('/updateProfile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { bio, nickname } = req.body;

    const user = await User.findOneAndUpdate(
      { username },
      { bio, nickname },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).send({ message: 'User not found' });

    const profile = {
      username: user.username,
      nickname: user.nickname,
      bio: user.bio,
      createdAt: user.createdAt,
      followingsCount: user.followings.length,
      followersCount: user.followers.length
    };

    res.status(200).send({ 
      status: 'success',
      data: {profile}
   });
  } catch (error) {
    res.status(500).send({ message: 'Error updating profile' });
  }
});

export default router;
