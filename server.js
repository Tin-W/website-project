const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // 託管 public 資料夾中的所有靜態檔案

// 連線到 Docker 中的 MongoDB
mongoose.connect('mongodb://mongodb:27017/shop_db')
  .then(() => console.log('MongoDB 連線成功！'))
  .catch(err => console.error('MongoDB 連線失敗:', err));

// ================= Schema 定義 =================

// 1. 會員 Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// 2. 商品 Schema (AI Model)
const ProductSchema = new mongoose.Schema({
  modelId: { type: String, required: true },
  provider: { type: String, required: true }, // openai, deepseek, claude
  name: { type: String, required: true },
  logo: { type: String, required: true },
  inputPrice: { type: String, required: true },
  outputPrice: { type: String, required: true },
  tag: { type: String, default: 'Pay as you go' }
});
const Product = mongoose.model('Product', ProductSchema);

// ================= API 路由 =================

// 1. 會員註冊 API
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.json({ success: true, message: '註冊成功！' });
  } catch (err) {
    res.status(400).json({ success: false, message: '帳號已存在或輸入有誤' });
  }
});

// 2. 會員登入 API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ success: false, message: '帳號或密碼錯誤' });
  }
  const token = jwt.sign({ userId: user._id }, 'SECRET_KEY', { expiresIn: '1h' });
  res.json({ success: true, token, email });
});

// 3. 取得所有商品 API
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: '讀取商品失敗' });
  }
});

// 4. 後台新增商品 API
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json({ success: true, message: '商品新增成功！' });
  } catch (err) {
    res.status(400).json({ success: false, message: '新增商品失敗，請檢查欄位' });
  }
});

// 5. 模擬結帳 API (支付寶 / 微信支付)
app.post('/api/checkout', (req, res) => {
  const { paymentMethod, totalAmount } = req.body;
  const mockQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${paymentMethod}_PAYMENT_${totalAmount}_USD`;
  res.json({
    success: true,
    message: `已建立 ${paymentMethod === 'alipay' ? '支付寶' : '微信'} 訂單`,
    qrCodeUrl: mockQrCode
  });
});

app.listen(3000, () => console.log('伺服器已啟動：http://localhost:3000'));