import express from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import User from '../models/user';
import { v4 as uuidv4 } from 'uuid';



// 定義推文接口
export interface ITweet extends Document {
  id: string;
  createdAt: string;
  username: string;
  profilePicture: string;
  content: string;
  comments: number;
  retweets: number;
  likes: number;
  views: number;
}

export interface ICreateTweetResponse {
  id: string;
  createdAt: string;
  username: string;
  profilePicture: string;
  content: string;
  comments: number;
  retweets: number;
  likes: number;
  views: number;
  nickname: string | null;
}

// 創建推文 Schema
const TweetSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  createdAt: { type: String, required: true },
  username: { type: String, required: true },
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
    const { username, profilePicture, content } = req.body;

    if (!username || !profilePicture || !content) {
      return res.status(400).send({ message: 'All fields are required' });
    }

    const newTweet = new Tweet({
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      username,
      profilePicture,
      content,
      comments: 0,
      retweets: 0,
      likes: 0,
      views: 0
    });

    await newTweet.save();

    // Fetch the user's nickname
    const user = await User.findOne({ username });
    const tweetData = newTweet.toObject();
    const tweetWithNickname: ICreateTweetResponse = {
      id: tweetData.id,
      createdAt: tweetData.createdAt,
      username: tweetData.username,
      profilePicture: tweetData.profilePicture,
      content: tweetData.content,
      comments: tweetData.comments,
      retweets: tweetData.retweets,
      likes: tweetData.likes,
      views: tweetData.views,
      nickname: user ? user.nickname : null
    };

    res.status(201).send({ message: 'Tweet successfully created', data: tweetWithNickname });
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
    // 使用聚合管道將Tweet和User集合連接起來
    const tweetsWithNickname = await Tweet.aggregate([
      {
        $lookup: {
          from: 'users', // The collection name for User documents
          localField: 'username',
          foreignField: 'username',
          as: 'userDetails'
        }
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true // If no match is found, userDetails will be null
        }
      },
      {
        $project: {
          id: 1,
          createdAt: 1,
          username: 1,
          profilePicture: 1,
          content: 1,
          comments: 1,
          retweets: 1,
          likes: 1,
          views: 1,
          nickname: '$userDetails.nickname'
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // 返回查找成功的響應
    res.status(200).send({ status: 'success', message: 'Tweets found', data: tweetsWithNickname });
  } catch (error) {
    res.status(500).send({ message: 'Error in fetching tweets' });
  }
});


router.post('/getTweets/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // 使用聚合管道查找特定用戶的推文並加入暱稱
    const tweetsWithNickname = await Tweet.aggregate([
      { $match: { username } }, // 過濾特定用戶的推文
      {
        $lookup: {
          from: 'users', // 目標集合
          localField: 'username', // Tweet 集合中的字段
          foreignField: 'username', // User 集合中的字段
          as: 'userDetails' // 新的字段名
        }
      },
      { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: 1,
          createdAt: 1,
          username: 1,
          profilePicture: 1,
          content: 1,
          comments: 1,
          retweets: 1,
          likes: 1,
          views: 1,
          nickname: '$userDetails.nickname' // 加入暱稱
        }
      },
      { $sort: { createdAt: -1 } } // 按創建時間排序
    ]);

    if (tweetsWithNickname.length === 0) {
      return res.status(404).send({ message: 'No tweets found for this user' });
    }

    res.status(200).send({ status: 'success', message: 'Tweets found', data: tweetsWithNickname });
  } catch (error) {
    res.status(500).send({ message: 'Error in fetching tweets' });
  }
});

export default router;
