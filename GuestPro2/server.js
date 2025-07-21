const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const Guest = require('./models/Guest');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
require('dotenv').config();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// تعریف رنگ‌های ثابت دسته‌بندی‌ها
const CATEGORY_COLORS = {
  "تبلیغات، بازاریابی، برندینگ و روابط عمومی": "#0f172a", // سرمه‌ای
  "ابزارهای دیجیتال، اپراتور، زیر ساخت و اپ استور": "#ef4444", // قرمز
  "فینتک، BNPL، صرافی و کریپتو": "#000000", // مشکی
  "سرمایه‌گذاری، فضای کار، شتابدهنده، آموزش، مشاوره مدیریت و رویداد": "#6b4226", // قهوه‌ای
  "رسانه، آموزش، کودک و نوجوان، سرگرمی، VOD و AOD": "#f97316", // نارنجی
  "سلامت، زیبایی، مد، پوشاک و سبک زندگی": "#ec4899", // صورتی
  "گردشگری، هتلداری، مهاجرت و ویزا": "#facc15", // زرد
  "فودتک، غذایی و نوشیدنی (FMCG)": "#bbf7d0", // سبز کمرنگ
  "حمل و نقل و خودرویی": "#2563eb", // آبی
  "فروشگاه، مارکت‌پلیس و تخفیف گروهی": "#15803d", // سبز پررنگ
  "سایر (منابع انسانی، بازرگانی، کارخانجات، ماشین‌آلات، استودیو، خیریه و اجتماعی)": "#ffffff" // سفید
};

// اتصال به دیتابیس


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const PORT = process.env.PORT || 3000;
// API: دسته‌بندی مهمان‌ها
app.get('/api/categories', async (req, res) => {
  const guests = await Guest.find({});
  const categories = {};

  // تعریف همه دسته‌ها با رنگ ثابت و آرایه مهمان خالی
  Object.entries(CATEGORY_COLORS).forEach(([catName, color]) => {
    categories[catName] = {
      color,
      guests: []
    };
  });

  // اضافه کردن مهمان‌ها به دسته‌ها
  guests.forEach(g => {
    if (!categories[g.category]) {
      // اگر دسته‌ای وجود نداشت، اضافه کن با رنگ پیش‌فرض
      categories[g.category] = {
        color: CATEGORY_COLORS[g.category] || '#ccc',
        guests: []
      };
    }
    categories[g.category].guests.push({
      id: g._id,
      name: g.name,
      brand: g.brand,
      present: g.present,
      color: categories[g.category].color
    });
  });

  res.json(categories);
});

// API: افزودن مهمان جدید
app.post('/api/guests', async (req, res) => {
  const { name, brand, category, phone } = req.body;

  const color = CATEGORY_COLORS[category] || '#2563eb';

  const newGuest = new Guest({
    name,
    brand,
    phone, // ✅ ذخیره شماره
    category,
    color,
    present: false,
  });

  await newGuest.save();

  res.json({ success: true });
});

// API: ثبت ورود مهمان
app.post('/api/checkin', async (req, res) => {
  const { guestId } = req.body;

  const guest = await Guest.findByIdAndUpdate(guestId, { present: true }, { new: true });

  if (guest) {
    io.emit('guestCheckedIn');
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'مهمان پیدا نشد' });
  }
});

// Socket.IO اتصال
io.on('connection', socket => {
  console.log('🔌 کاربر متصل شد');
});


server.listen(PORT, () => {
  console.log(`✅ سرور در حال اجرا روی http://localhost:${PORT}`);
});
