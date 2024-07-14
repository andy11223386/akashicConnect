import express from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// 定義推文接口
export interface ITweet extends Document {
  id: string;
  createdAt: string;
  username: string;
  userId: string;
  profilePicture: string;
  content: string;
  comments: number;
  retweets: number;
  likes: number;
  views: number;
}

// 創建推文 Schema
const TweetSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  createdAt: { type: String, required: true },
  username: { type: String, required: true },
  userId: { type: String, required: true },
  profilePicture: { type: String, required: true },
  content: { type: String, required: true },
  comments: { type: Number, required: true, default: 0 },
  retweets: { type: Number, required: true, default: 0 },
  likes: { type: Number, required: true, default: 0 },
  views: { type: Number, required: true, default: 0 }
}, {
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  },
  toObject: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

// 創建推文模型
const Tweet = mongoose.model<ITweet>('Tweet', TweetSchema);

const router = express.Router();

router.post('/createPost', async (req, res) => {
  try {
    const { username, userId, profilePicture, content } = req.body;

    // 驗證傳入的數據
    if (!username || !userId || !profilePicture || !content) {
      return res.status(400).send({ message: 'All fields are required' });
    }

    // 創建新的推文
    const newTweet = new Tweet({
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      username,
      userId,
      profilePicture,
      content,
      comments: 0,
      retweets: 0,
      likes: 0,
      views: 0
    });

    // 保存到數據庫
    await newTweet.save();

    // 返回創建成功的響應
    res.status(201).send({ message: 'Tweet successfully created', data: newTweet.toJSON() });
  } catch (error) {
    res.status(500).send({ message: 'Error in creating tweet' });
  }
});

router.post('/getTweet/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 從數據庫中查找推文
    const tweet = await Tweet.findOne({ id });

    if (!tweet) {
      return res.status(404).send({ message: 'Tweet not found' });
    }

    // 返回查找成功的響應
    res.status(200).send({ message: 'Tweet found', tweet: tweet.toJSON() });
  } catch (error) {
    res.status(500).send({ message: 'Error in fetching tweet' });
  }
});

router.post('/getAllTweets', async (req, res) => {
  try {
    // 從數據庫中查找所有推文
    const tweets = await Tweet.find().sort({ createdAt: -1 }).lean();

    // 返回查找成功的響應
    res.status(200).send({ status: 'success', message: 'Tweets found', data: tweets.map(tweet => {
      const { _id, __v, ...rest } = tweet;
      return { ...rest, id: _id };
    }) });
  } catch (error) {
    res.status(500).send({ message: 'Error in fetching tweets' });
  }
});

export default router;
