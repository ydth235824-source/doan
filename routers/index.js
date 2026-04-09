var express = require('express');
var router = express.Router();
// Đảm bảo file models tên là student.js nằm trong thư mục models
var sinhVienModel = require('../models/student'); 

// --- 1. DANH SÁCH SINH VIÊN (Trang chủ) ---
router.get('/', async (req, res) => {
    try {
        // Lấy tất cả sinh viên từ MongoDB
        var danhSach = await sinhVienModel.find();
        // Truyền biến danhSach qua index.ejs
        res.render('index', { 
            title: 'Trang chủ Quản lý', 
            danhSach: danhSach 
        });
    } catch (err) {
        console.log("Lỗi lấy danh sách:", err);
        // Nếu lỗi, vẫn cho hiện trang index với danh sách rỗng để không bị sập web
        res.render('index', { 
            title: 'Trang chủ Quản lý', 
            danhSach: [] 
        });
    }
});

// --- 2. XỬ LÝ THÊM SINH VIÊN ---
// Bạn dùng chung form ở trang chủ nên chỉ cần Route POST này thôi
router.post('/them', async (req, res) => {
    try {
        var svMoi = new sinhVienModel(req.body);
        await svMoi.save();
        console.log("Thêm thành công!");
        res.redirect('/'); // Thêm xong nạp lại trang chủ để thấy kết quả
    } catch (err) {
        console.log("Lỗi thêm SV:", err);
        res.redirect('/error');
    }
});

// --- 3. XỬ LÝ SỬA SINH VIÊN ---
router.get('/sua/:id', async (req, res) => {
    try {
        var sv = await sinhVienModel.findById(req.params.id);
        res.render('sinhvien_sua', { title: 'Sửa Sinh viên', sv: sv });
    } catch (err) {
        res.redirect('/error');
    }
});

router.post('/sua/:id', async (req, res) => {
    try {
        await sinhVienModel.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/');
    } catch (err) {
        res.redirect('/error');
    }
});

// --- 4. XỬ LÝ XÓA SINH VIÊN ---
router.get('/xoa/:id', async (req, res) => {
    try {
        await sinhVienModel.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (err) {
        console.log("Lỗi xóa:", err);
        res.redirect('/error');
    }
});

module.exports = router;