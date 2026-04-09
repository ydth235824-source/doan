const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    MaLop: String,
    TenLop: String
});

module.exports = mongoose.model('Lop', schema);