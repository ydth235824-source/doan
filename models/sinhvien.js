const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    MSSV: String,
    HoTen: String,
    Lop: String,
    Khoa: String
});

module.exports = mongoose.model('SinhVien', schema);