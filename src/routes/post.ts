import express from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import User from '../models/user';
import { v4 as uuidv4 } from 'uuid';

import Tweet from '../models/tweet';
import Comment from '../models/comment';



export interface ICreateTweetResponse {
  _id: string;
  createdAt: string;
  username: string;
  profilePicture: string;
  content: string;
  comments: string[];
  retweets: number;
  likes: number;
  views: number;
  nickname: string | null;
}

const router = express.Router();

router.post('/createPost', async (req, res) => {
  try {
    const { username, profilePicture, content } = req.body;

    if (!username || !profilePicture || !content) {
      return res.status(400).send({ message: 'All fields are required' });
    }

    const newTweet = new Tweet({
      createdAt: new Date().toISOString(),
      username,
      profilePicture,
      content,
      comments: [],
      retweets: 0,
      likes: 0,
      views: 0
    });

    await newTweet.save();

    // Fetch the user's nickname
    const user = await User.findOne({ username });
    const tweetData = newTweet.toObject();
    const tweetWithNickname: ICreateTweetResponse = {
      _id:tweetData._id,
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
    // Fetch all tweets sorted by createdAt in descending order
    const tweets = await Tweet.find().sort({ createdAt: -1 });

    // Prepare a list to hold tweets with detailed comments and user info
    const tweetsWithComments = await Promise.all(tweets.map(async tweet => {
      // Fetch detailed comments for each tweet using the comment IDs
      const commentsWithUserDetails = await Promise.all(tweet.comments.map(async commentId => {
        const comment = await Comment.findOne({ _id: commentId });
        if (!comment) return null;

        // Fetch the user's details for each comment
        const user = await User.findOne({ username: comment.username });
        return {
          ...comment.toObject(),
          nickname: user ? user.nickname : null,
          profilePicture: user ? user.profilePicture : null
        };
      }));

      // Filter out any null comments (if any comment ID didn't find a corresponding comment)
      const filteredComments = commentsWithUserDetails.filter(comment => comment !== null);

      return {
        ...tweet.toObject(),
        comments: filteredComments
      };
    }));

    // Return the tweets along with their comments and user details
    res.status(200).send({ status: 'success', data: tweetsWithComments });
  } catch (error) {
    res.status(500).send({ message: 'Error in fetching tweets and comments', error });
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
          _id: 1,
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
