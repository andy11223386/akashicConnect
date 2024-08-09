import mongoose, { Schema, Document } from 'mongoose';

// 定義推文接口
export interface ITweet extends Document {
  createdAt: string;
  username: string;
  content: string;
  comments: string[]; // Array of comment IDs
  retweets: string[];
  likes: string[]; // Array of usernames who liked the tweet
  views: number;
  imageUrl: string
}

// 創建推文 Schema
const TweetSchema: Schema = new Schema({
  createdAt: { type: String, required: true },
  username: { type: String, required: true },
  content: { type: String, required: true },
  comments: { type: [String], required: true, default: [] },
  retweets: { type: [String], required: true, default: [] },
  likes: { type: [String], required: true, default: [] }, // Update likes to array of strings
  views: { type: Number, required: true, default: 0 },
  imageUrl: { type: String, required: false },
});

// 創建推文模型
const Tweet = mongoose.model<ITweet>('Tweet', TweetSchema);

export default Tweet;