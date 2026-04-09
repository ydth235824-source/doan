var express = require('express');
var router = express.Router();
var khoaModel = require('../models/khoa');

//  1. Hàm bảo vệ quyền Admin
const checkAdmin = (req, res, next) => {
    const user = req.session.user || req.user; 

    if (user && user.role === 'admin') {
        next(); 
    } else {
        // Thông báo bằng alert và đá về trang danh sách khoa
        res.status(403).send("<script>alert(' Bạn không có quyền quản lý Khoa!'); window.location='/khoa';</script>");
    }
};

// --- ROUTES ---

// GET: Danh sách khoa (CÔNG KHAI - AI CŨNG XEM ĐƯỢC)
router.get('/', async (req, res) => {
    try {
        var danhSachKhoa = await khoaModel.find();
        // Truyền user để hiển thị giao diện tùy theo quyền
        res.render('khoa', { 
            title: 'Quản lý Khoa', 
            danhSachKhoa: danhSachKhoa,
            user: req.session.user || req.user 
        });
    } catch (err) {
        res.redirect('/error');
    }
});

//  CHỈ ADMIN MỚI ĐƯỢC THỰC HIỆN CÁC THAO TÁC DƯỚI ĐÂY

// GET: Form thêm khoa
router.get('/them', checkAdmin, async (req, res) => {
    res.render('khoa_them', { title: 'Thêm Khoa mới' });
});

// POST: Xử lý lưu khoa
router.post('/them', checkAdmin, async (req, res) => {
    try {
        var khoaMoi = new khoaModel(req.body);
        await khoaMoi.save();
        res.redirect('/khoa');
    } catch (err) {
        res.redirect('/error');
    }
});

// GET: Form sửa khoa
router.get('/sua/:id', checkAdmin, async (req, res) => {
    try {
        var khoa = await khoaModel.findById(req.params.id);
        res.render('khoa_sua', { title: 'Sửa Khoa', khoa: khoa });
    } catch (err) {
        res.redirect('/error');
    }
});

// POST: Xử lý cập nhật khoa
router.post('/sua/:id', checkAdmin, async (req, res) => {
    try {
        await khoaModel.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/khoa');
    } catch (err) {
        res.redirect('/error');
    }
});

// GET: Xóa khoa
router.get('/xoa/:id', checkAdmin, async (req, res) => {
    try {
        await khoaModel.findByIdAndDelete(req.params.id);
        res.redirect('/khoa');
    } catch (err) {
        res.redirect('/error');
    }
});

module.exports = router;