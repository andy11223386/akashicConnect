import mongoose, { Schema, Document } from 'mongoose';

// 定義評論接口
export interface IComment extends Document {
  id: string;
  replyPostId: string;
  replyTo: string;
  createdAt: string;
  username: string;
  content: string;
  comments: number;
  retweets: number;
  likes: number;
  views: number;
}

// 創建評論 Schema
const CommentSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  replyPostId: { type: String, required: true },
  replyTo: { type: String, required: false },
  createdAt: { type: String, required: true },
  username: { type: String, required: true },
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

// 創建評論模型
const Comment = mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
