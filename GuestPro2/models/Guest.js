const mongoose = require('mongoose');

const GuestSchema = new mongoose.Schema({
  name: String,
  brand: String,
  phone: String, // ✅ این خط رو اضافه کن
  category: String,
  color: String,
  present: { type: Boolean, default: false },
});

module.exports = mongoose.model('Guest', GuestSchema);
