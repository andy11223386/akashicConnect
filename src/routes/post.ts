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
  profilePicture: string | null;
  content: string;
  comments: string[];
  retweets: string[];
  likes: string[]; // Update likes to array of strings
  views: number;
  nickname: string | null;
  imageUrl: string | null;
}

const router = express.Router();

router.post('/createPost', async (req, res) => {
  try {
    const { username, content, imageUrl} = req.body;

    if (!username  || !content) {
      return res.status(400).send({ message: 'All fields are required' });
    }

    
    const newTweet = new Tweet({
      createdAt: new Date().toISOString(),
      username,
      content,
      comments: [],
      retweets: [],
      likes: [],
      views: 0,
      imageUrl,
    });

    await newTweet.save();

    const user = await User.findOne({ username });
    const tweetData = newTweet.toObject();
    const tweetWithNickname: ICreateTweetResponse = {
      _id: tweetData._id,
      createdAt: tweetData.createdAt,
      username: tweetData.username,
      content: tweetData.content,
      comments: tweetData.comments,
      retweets: tweetData.retweets,
      likes: tweetData.likes,
      views: tweetData.views,
      nickname: user ? user.nickname : null,
      profilePicture: user ? user.profilePicture : null,
      imageUrl: tweetData.imageUrl,
    };

    res.status(201).send({ message: 'Tweet successfully created', data: tweetWithNickname });
  } catch (error) {
    res.status(500).send({ message: 'Error in creating tweet' });
  }
});

router.post('/getTweet/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tweet = await Tweet.findById(id);
    if (!tweet) {
      return res.status(404).send({ message: 'Tweet not found' });
    }

    const commentsWithUserDetails = await Promise.all(tweet.comments.map(async commentId => {
      const comment = await Comment.findById(commentId);
      if (!comment) return null;

      const user = await User.findOne({ username: comment.username });
      return {
        ...comment.toObject(),
        nickname: user ? user.nickname : null,
        profilePicture: user ? user.profilePicture : null
      };
    }));

    const filteredComments = commentsWithUserDetails.filter(comment => comment !== null);

    const user = await User.findOne({ username: tweet.username });
    const tweetWithNickname = {
      _id: tweet._id,
      createdAt: tweet.createdAt,
      username: tweet.username,
      profilePicture: user? user.profilePicture: null,
      content: tweet.content,
      comments: filteredComments,
      retweets: tweet.retweets,
      likes: tweet.likes,
      views: tweet.views,
      nickname: user ? user.nickname : null,
      imageUrl: tweet.imageUrl,
    };

    res.status(200).send({ status: 'success', message: 'Tweet found', data: tweetWithNickname });
  } catch (error) {
    res.status(500).send({ message: 'Error in fetching tweet', error });
  }
});


router.post('/getAllTweets', async (req, res) => {
  try {
    const tweets = await Tweet.find().sort({ createdAt: -1 });

    const tweetsWithDetails = await Promise.all(tweets.map(async tweet => {
      const user = await User.findOne({ username: tweet.username });
      const commentsWithUserDetails = await Promise.all(tweet.comments.map(async commentId => {
        const comment = await Comment.findOne({ _id: commentId });
        if (!comment) return null;

        const commentUser = await User.findOne({ username: comment.username });
        return {
          ...comment.toObject(),
          nickname: commentUser ? commentUser.nickname : null,
          profilePicture: commentUser ? commentUser.profilePicture : null
        };
      }));

      const filteredComments = commentsWithUserDetails.filter(comment => comment !== null);

      return {
        ...tweet.toObject(),
        nickname: user ? user.nickname : null,
        profilePicture: user ? user.profilePicture : null,
        comments: filteredComments
      };
    }));

    res.status(200).send({ status: 'success', data: tweetsWithDetails });
  } catch (error) {
    res.status(500).send({ message: 'Error in fetching tweets and comments', error });
  }
});

router.post('/getTweets/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Find all tweets from the specific user
    const tweets = await Tweet.find({ username }).sort({ createdAt: -1 });

    if (tweets.length === 0) {
      return res.status(404).send({ message: 'No tweets found for this user' });
    }

    // Prepare the tweets with additional user details
    const tweetsWithDetails = await Promise.all(tweets.map(async (tweet) => {
      const user = await User.findOne({ username: tweet.username });

      const commentsWithUserDetails = await Promise.all(tweet.comments.map(async (commentId) => {
        const comment = await Comment.findById(commentId);
        if (!comment) return null;

        const commentUser = await User.findOne({ username: comment.username });
        return {
          ...comment.toObject(),
          nickname: commentUser ? commentUser.nickname : null,
          profilePicture: commentUser ? commentUser.profilePicture : null
        };
      }));

      const filteredComments = commentsWithUserDetails.filter(comment => comment !== null);

      return {
        ...tweet.toObject(),
        nickname: user ? user.nickname : null,
        profilePicture: user ? user.profilePicture : null,
        comments: filteredComments
      };
    }));

    res.status(200).send({ status: 'success', data: tweetsWithDetails });
  } catch (error) {
    res.status(500).send({ message: 'Error in fetching tweets for user', error });
  }
});

router.post('/getHistoryTweets', async (req, res) => {
  try {
    const { _ids } = req.body;

    if (!Array.isArray(_ids) || _ids.length === 0) {
      return res.status(400).send({ message: 'Invalid tweet IDs array' });
    }

    const historyTweets = await Promise.all(_ids.map(async (id) => {
      const tweet = await Tweet.findById(id);
      if (!tweet) return null;

      const commentsWithUserDetails = await Promise.all(tweet.comments.map(async commentId => {
        const comment = await Comment.findById(commentId);
        if (!comment) return null;

        const user = await User.findOne({ username: comment.username });
        return {
          ...comment.toObject(),
          nickname: user ? user.nickname : null,
          profilePicture: user ? user.profilePicture : null
        };
      }));

      const filteredComments = commentsWithUserDetails.filter(comment => comment !== null);

      const user = await User.findOne({ username: tweet.username });
      return {
        _id: tweet._id,
        createdAt: tweet.createdAt,
        username: tweet.username,
        profilePicture: user ? user.profilePicture : null,
        content: tweet.content,
        comments: filteredComments,
        retweets: tweet.retweets,
        likes: tweet.likes,
        views: tweet.views,
        nickname: user ? user.nickname : null,
        imageUrl: tweet.imageUrl,
      };
    }));

    const filteredHistoryTweets = historyTweets.filter(tweet => tweet !== null);

    if (filteredHistoryTweets.length === 0) {
      return res.status(404).send({ message: 'No tweets found' });
    }

    res.status(200).send({ status: 'success', data: filteredHistoryTweets });
  } catch (error) {
    res.status(500).send({ message: 'Error in fetching history tweets', error });
  }
});

router.post('/like', async (req, res) => {
  try {
    const { postId, username } = req.body;

    if (!postId || !username) {
      return res.status(400).send({ message: 'Tweet ID and username are required' });
    }

    const tweet = await Tweet.findById(postId);
    if (!tweet) {
      return res.status(404).send({ message: 'Tweet not found' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const isLiked = tweet.likes.includes(username);

    const update = isLiked 
      ? { $pull: { likes: username } }
      : { $addToSet: { likes: username } };

    const updatedTweet = await Tweet.findByIdAndUpdate(postId, update, { new: true });

    const message = isLiked
      ? 'Tweet unliked successfully'
      : 'Tweet liked successfully';

    res.status(200).send({ status: 'success', message, data: updatedTweet });
  } catch (error) {
    res.status(500).send({ message: 'Error liking/unliking tweet', error });
  }
});

router.post('/retweet', async (req, res) => {
  try {
    const { postId, username } = req.body;

    if (!postId || !username) {
      return res.status(400).send({ message: 'Tweet ID and username are required' });
    }

    const tweet = await Tweet.findById(postId);
    if (!tweet) {
      return res.status(404).send({ message: 'Tweet not found' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const isRetweeted = tweet.retweets.includes(username);

    const update = isRetweeted
      ? { $pull: { retweets: username } }
      : { $addToSet: { retweets: username } };

    const updatedTweet = await Tweet.findByIdAndUpdate(postId, update, { new: true });

    const message = isRetweeted
      ? 'Tweet unretweeted successfully'
      : 'Tweet retweeted successfully';

    res.status(200).send({ status: 'success', message, data: updatedTweet });
  } catch (error) {
    res.status(500).send({ message: 'Error retweeting/unretweeting tweet', error });
  }
});

export default router;
