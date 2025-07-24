require('dotenv').config(); // حتما بالای فایل باشه
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

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// تعریف رنگ‌های ثابت دسته‌بندی‌ها
const CATEGORY_COLORS = {
  "تبلیغات، بازاریابی، برندینگ و روابط عمومی": "#142e6aff",
  "ابزارهای دیجیتال، اپراتور، زیر ساخت و اپ استور": "#ef4444",
  "فینتک، BNPL، صرافی و کریپتو": "#000000",
  "سرمایه‌گذاری، فضای کار، شتابدهنده، آموزش، مشاوره مدیریت و رویداد": "#6b4226",
  "رسانه، آموزش، کودک و نوجوان، سرگرمی، VOD و AOD": "#f97316",
  "سلامت، زیبایی، مد، پوشاک و سبک زندگی": "#ec4899",
  "گردشگری، هتلداری، مهاجرت و ویزا": "#facc15",
  "فودتک، غذایی و نوشیدنی (FMCG)": "#bbf7d0",
  "حمل و نقل و خودرویی": "#2563eb",
  "فروشگاه، مارکت‌پلیس و تخفیف گروهی": "#15803d",
  "سایر (منابع انسانی، بازرگانی، کارخانجات، ماشین‌آلات، استودیو، خیریه و اجتماعی)": "#ffffff",
  "کافه ارتباط": "#06b6d4" // ← این خط اضافه شد
};


const PORT = process.env.PORT || 3000;

// اتصال به دیتابیس
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

// API: دسته‌بندی مهمان‌ها
app.get('/api/categories', async (req, res) => {
  try {
    const guests = await Guest.find({});
    const categories = {};

    Object.entries(CATEGORY_COLORS).forEach(([catName, color]) => {
      categories[catName] = { color, guests: [] };
    });

    guests.forEach(g => {
      if (!categories[g.category]) {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در دریافت دسته‌ها' });
  }
});
// API: ثبت خروج مهمان
app.post('/api/checkout', async (req, res) => {
  try {
    const { guestId } = req.body;
    await Guest.findByIdAndUpdate(guestId, { present: false });
    io.emit('guestCheckedIn'); // به همه کلاینت‌ها آپدیت بده
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در ثبت خروج' });
  }
});
// API: ثبت ورود مهمان
app.post('/api/checkin', async (req, res) => {
  try {
    const { guestId } = req.body;
    await Guest.findByIdAndUpdate(guestId, { present: true });
    io.emit('guestCheckedIn'); // به همه کلاینت‌ها آپدیت بده
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در ثبت ورود' });
  }
});

// API: افزودن مهمان جدید
app.post('/api/guests', async (req, res) => {
  try {
    const { name, brand, category, phone } = req.body;
    const color = CATEGORY_COLORS[category] || '#2563eb';

    const newGuest = new Guest({
      name,
      brand,
      phone,
      category,
      color,
      present: false,
    });

    await newGuest.save();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در افزودن مهمان' });
  }
});

// API: ثبت ورود مهمان و ارسال پیامک


