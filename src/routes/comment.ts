import express from 'express';
import Comment from '../models/comment';
import Tweet from '../models/tweet'; // 引入推文模型
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 創建新評論
router.post('/createComment', async (req, res) => {
  try {
    const { replyPostId, replyTo, content } = req.body;
    const username = req.body.username || '匿名';

    if (!replyPostId || !content) {
      return res.status(400).send({ message: 'replyPostId 和 content 是必填的' });
    }

    const newComment = new Comment({
      id: uuidv4(),
      replyPostId,
      replyTo: replyTo || '',
      createdAt: new Date().toISOString(),
      username,
      content,
      comments: 0,
      retweets: 0,
      likes: 0,
      views: 0
    });

    await newComment.save();

    // 將評論ID添加到對應推文的comments字段中
    await Tweet.updateOne(
      { id: replyPostId },
      { $push: { comments: newComment.id } }
    );

    res.status(201).send({ message: '評論創建成功', data: newComment.toJSON() });
  } catch (error) {
    res.status(500).send({ message: 'Error in create Comment' });
  }
});

export default router;
