const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// JWT 密鑰 (實務上應放在 .env 檔中)
const JWT_SECRET = 'YOUR_SUPER_SECRET_KEY';

mongoose.connect('mongodb://localhost:27017/your-db-name')
  .then(() => console.log('MongoDB 連線成功！'))
  .catch(err => console.error('MongoDB 連線失敗:', err));

// ================= Schema 定義 =================

// 1. 會員 Schema (加入 role 欄位)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }, // 預設為一般用戶 'user'，管理員為 'admin'
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// 2. 消費紀錄 Schema
const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  modelId: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

// 3. 商品 Schema
const ProductSchema = new mongoose.Schema({
  modelId: { type: String, required: true },
  provider: { type: String, required: true },
  name: { type: String, required: true },
  logo: { type: String, required: true },
  inputPrice: { type: String, required: true },
  outputPrice: { type: String, required: true },
  tag: { type: String, default: 'Pay as you go' }
});
const Product = mongoose.model('Product', ProductSchema);

// ================= 權限中介軟體 (Middleware) =================

// 驗證是否登入 (檢查 Token)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: '未登入或缺少 Token' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Token 無效或已過期' });
    req.user = user;
    next();
  });
};

// 驗證是否為管理員
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: '權限不足，僅限管理員存取' });
  }
};

// ================= API 路由 =================

// 會員註冊
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'user'; // 允許透過 API 指定角色
    const user = new User({ email, password: hashedPassword, role: userRole });
    await user.save();
    res.json({ success: true, message: '註冊成功！' });
  } catch (err) {
    res.status(400).json({ success: false, message: '帳號已存在或輸入有誤' });
  }
});

// 會員登入
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ success: false, message: '帳號或密碼錯誤' });
  }
  // 簽發 Token，並將 role 夾帶在裡面
  const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ success: true, token, email: user.email, role: user.role });
});

// 管理員 API：取得所有註冊用戶 (需登入且為 admin)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // 取得列表時排除密碼
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: '讀取用戶失敗' });
  }
});

// 管理員 API：取得全站消費紀錄 (需登入且為 admin)
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: '讀取訂單失敗' });
  }
});

// 模擬結帳並記錄消費 (需登入)
app.post('/api/checkout', authenticateToken, async (req, res) => {
  const { modelId, amount } = req.body;
  const order = new Order({
    userId: req.user.userId,
    userEmail: req.user.email,
    modelId: modelId || 'unknown-model',
    amount: amount || 100
  });
  await order.save();

  const mockQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PAYMENT_${order._id}`;
  res.json({ success: true, qrCodeUrl: mockQrCode, orderId: order._id });
});

app.listen(3000, () => console.log('伺服器已啟動：http://localhost:3000'));