import express from 'express';
import { registerUser, loginUser, generateToken, validateEmail } from '../services/authService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, error: '请填写完整信息' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: '请输入有效的邮箱地址' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: '密码长度至少为6位' });
    }

    const user = await registerUser(email, password, fullName);
    const token = await generateToken(user);

    res.json({
      success: true,
      data: {
        user,
        token,
        tokenType: 'Bearer'
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: '请填写邮箱和密码' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: '请输入有效的邮箱地址' });
    }

    const user = await loginUser(email, password);
    if (!user) {
      return res.status(401).json({ success: false, error: '邮箱或密码错误' });
    }

    const token = await generateToken(user);

    res.json({
      success: true,
      data: {
        user,
        token,
        tokenType: 'Bearer'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未授权访问' });
    }

    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;