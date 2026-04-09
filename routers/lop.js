var express = require('express');
var router = express.Router();
var lopModel = require('../models/lop'); // Nạp model Lớp

// GET: Danh sách lớp
router.get('/', async (req, res) => {
    try {
        var danhSachLop = await lopModel.find();
        res.render('lop', { title: 'Quản lý Lớp', danhSachLop: danhSachLop });
    } catch (err) {
        res.redirect('/error');
    }
});

// GET: Thêm lớp (Giao diện form)
router.get('/them', async (req, res) => {
    res.render('lop_them', { title: 'Thêm Lớp mới' });
});

// POST: Thêm lớp (Xử lý lưu)
router.post('/them', async (req, res) => {
    try {
        var lopMoi = new lopModel(req.body);
        await lopMoi.save();
        res.redirect('/lop');
    } catch (err) {
        res.redirect('/error');
    }
});

// GET: Sửa lớp
router.get('/sua/:id', async (req, res) => {
    try {
        var lop = await lopModel.findById(req.params.id);
        res.render('lop_sua', { title: 'Sửa Lớp', lop: lop });
    } catch (err) {
        res.redirect('/error');
    }
});

// POST: Sửa lớp
router.post('/sua/:id', async (req, res) => {
    try {
        await lopModel.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/lop');
    } catch (err) {
        res.redirect('/error');
    }
});

// GET: Xóa lớp
router.get('/xoa/:id', async (req, res) => {
    try {
        await lopModel.findByIdAndDelete(req.params.id);
        res.redirect('/lop');
    } catch (err) {
        res.redirect('/error');
    }
});

module.exports = router;