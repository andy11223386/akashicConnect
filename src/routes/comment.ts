import express from 'express';
import Comment from '../models/comment';
import Tweet from '../models/tweet'; // 引入推文模型

const router = express.Router();

// 創建新評論
router.post('/createComment', async (req, res) => {
  try {
    const { replyPostId, replyTo, content } = req.body;
    const username = req.body.username || '匿名';

    if (!replyPostId || !content) {
      return res.status(400).send({ message: 'replyPostId 和 content 是必填的' });
    }

    // 獲取對應推文
    const tweet = await Tweet.findById(replyPostId);
    if (!tweet) {
      return res.status(404).send({ message: '推文未找到' });
    }

    // 計算樓層號
    const floor = tweet.comments.length + 1;

    const newComment = new Comment({
      replyPostId,
      replyTo: replyTo || '',
      createdAt: new Date().toISOString(),
      username,
      content,
      comments: 0,
      retweets: 0,
      likes: 0,
      views: 0,
      floor // 設置樓層號
    });

    await newComment.save();

    // 將評論ID添加到對應推文的comments字段中
    await Tweet.updateOne(
      { _id: replyPostId },
      { $push: { comments: newComment._id } }
    );

    res.status(201).send({ message: '評論創建成功', data: newComment.toJSON() });
  } catch (error) {
    res.status(500).send({ message: 'Error in create Comment' });
  }
});

export default router;
