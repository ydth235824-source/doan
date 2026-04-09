var express = require('express');
var router = express.Router();
var khoaModel = require('../models/khoa'); // Nạp model Khoa

// GET: Danh sách khoa
router.get('/', async (req, res) => {
    try {
        var danhSachKhoa = await khoaModel.find();
        res.render('khoa', { title: 'Quản lý Khoa', danhSachKhoa: danhSachKhoa });
    } catch (err) {
        res.redirect('/error');
    }
});

// GET: Thêm khoa (Giao diện form)
router.get('/them', async (req, res) => {
    res.render('khoa_them', { title: 'Thêm Khoa mới' });
});

// POST: Thêm khoa (Xử lý lưu)
router.post('/them', async (req, res) => {
    try {
        var khoaMoi = new khoaModel(req.body);
        await khoaMoi.save();
        res.redirect('/khoa');
    } catch (err) {
        res.redirect('/error');
    }
});

// GET: Sửa khoa
router.get('/sua/:id', async (req, res) => {
    try {
        var khoa = await khoaModel.findById(req.params.id);
        res.render('khoa_sua', { title: 'Sửa Khoa', khoa: khoa });
    } catch (err) {
        res.redirect('/error');
    }
});

// POST: Sửa khoa
router.post('/sua/:id', async (req, res) => {
    try {
        await khoaModel.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/khoa');
    } catch (err) {
        res.redirect('/error');
    }
});

// GET: Xóa khoa
router.get('/xoa/:id', async (req, res) => {
    try {
        await khoaModel.findByIdAndDelete(req.params.id);
        res.redirect('/khoa');
    } catch (err) {
        res.redirect('/error');
    }
});

module.exports = router;