var express = require('express');
var router = express.Router();
var lopModel = require('../models/lop'); // Nạp model Lớp

// Hàm kiểm tra quyền Admin
const checkAdmin = (req, res, next) => {
    const user = req.session.user || req.user; 

    if (user && user.role === 'admin') {
        next(); // Là Admin thì cho đi tiếp
    } else {
        // Trả về alert để người dùng biết tại sao bị chặn
        res.status(403).send("<script>alert(' Bạn không có quyền thực hiện thao tác này!'); window.location='/lop';</script>");
    }
};

// --- ROUTES ---

// GET: Danh sách lớp (AI CŨNG XEM ĐƯỢC)
router.get('/', async (req, res) => {
    try {
        var danhSachLop = await lopModel.find();
        // Nhớ truyền user sang để ẩn/hiện nút ở giao diện EJS
        res.render('lop', { 
            title: 'Quản lý Lớp', 
            danhSachLop: danhSachLop,
            user: req.session.user || req.user 
        });
    } catch (err) {
        res.redirect('/error');
    }
});

//  CHỈ ADMIN MỚI ĐƯỢC VÀO CÁC ROUTE DƯỚI ĐÂY

// GET: Form thêm lớp
router.get('/them', checkAdmin, async (req, res) => {
    res.render('lop_them', { title: 'Thêm Lớp mới' });
});

// POST: Xử lý lưu lớp
router.post('/them', checkAdmin, async (req, res) => {
    try {
        var lopMoi = new lopModel(req.body);
        await lopMoi.save();
        res.redirect('/lop');
    } catch (err) {
        res.redirect('/error');
    }
});

// GET: Sửa lớp (Form)
router.get('/sua/:id', checkAdmin, async (req, res) => {
    try {
        var lop = await lopModel.findById(req.params.id);
        res.render('lop_sua', { title: 'Sửa Lớp', lop: lop });
    } catch (err) {
        res.redirect('/error');
    }
});

// POST: Xử lý cập nhật lớp
router.post('/sua/:id', checkAdmin, async (req, res) => {
    try {
        await lopModel.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/lop');
    } catch (err) {
        res.redirect('/error');
    }
});

// GET: Xóa lớp
router.get('/xoa/:id', checkAdmin, async (req, res) => {
    try {
        await lopModel.findByIdAndDelete(req.params.id);
        res.redirect('/lop');
    } catch (err) {
        res.redirect('/error');
    }
});

module.exports = router;