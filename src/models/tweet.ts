import mongoose, { Schema, Document } from 'mongoose';

// 定義推文接口
export interface ITweet extends Document {
  id: string;
  createdAt: string;
  username: string;
  profilePicture: string;
  content: string;
  comments: string[]; // 修改為字符串數組，用於存儲評論ID
  retweets: number;
  likes: number;
  views: number;
}

// 創建推文 Schema
const TweetSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  createdAt: { type: String, required: true },
  username: { type: String, required: true },
  profilePicture: { type: String, required: true },
  content: { type: String, required: true },
  comments: { type: [String], required: true, default: [] }, // 新增的comments字段
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

export default Tweet;