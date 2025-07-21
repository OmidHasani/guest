// فایل seed.js

const mongoose = require('mongoose');
const Guest = require('./models/Guest');

mongoose.connect("mongodb+srv://Omid:Omidhh12@brandcluster.ipukzpl.mongodb.net/?retryWrites=true&w=majority&appName=brandCluster", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const guests = [
  { name: 'علی رضایی', category: 'VIP', color: '#f43f5e', present: false },
  { name: 'مریم کریمی', category: 'VIP', color: '#f43f5e', present: false },
  { name: 'سارا احمدی', category: 'دوستان', color: '#3b82f6', present: false },
  { name: 'حسین محمدی', category: 'دوستان', color: '#3b82f6', present: false },
  { name: 'زهرا موسوی', category: 'خانواده', color: '#10b981', present: false },
  { name: 'احمد مرادی', category: 'خانواده', color: '#10b981', present: false }
];

async function seed() {
  await Guest.deleteMany({}); // پاک کردن مهمان‌های قبلی برای تست
  await Guest.insertMany(guests);
  console.log('✅ مهمان‌ها با موفقیت وارد شدند.');
  mongoose.disconnect();
}

seed();
