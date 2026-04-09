const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    MaKhoa: String,
    TenKhoa: String
});

module.exports = mongoose.model('Khoa', schema);