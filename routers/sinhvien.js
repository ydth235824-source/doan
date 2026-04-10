const express = require('express');
const router = express.Router();
const SinhVien = require('../models/sinhvien');
const Lop = require('../models/lop');
const khoaModel = require('../models/khoa'); // ✅ 1. PHẢI THÊM DÒNG NÀY ĐỂ HẾT LỖI khoaModel

// ✅ Middleware kiểm tra quyền Admin
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        return res.send("<script>alert(' Bạn không có quyền thực hiện thao tác này!'); window.location='/';</script>");
    }
}

// 1. GET: Trang chủ + Tìm kiếm
router.get('/', async (req, res) => {
    try {
        const { search, lop } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { HoTen: { $regex: search, $options: 'i' } },
                { MSSV: { $regex: search, $options: 'i' } }
            ];
        }

        if (lop && lop !== "") {
            query.Lop = lop;
        }

        const danhSach = await SinhVien.find(query).sort({ Lop: 1, HoTen: 1 });
        const danhSachLop = await Lop.find();
        const danhSachKhoa = await khoaModel.find(); //Đã có khoaModel ở trên nên không lỗi nữa

        res.render('index', {
            title: 'Quản Lý Sinh Viên', // ĐÃ CÓ TITLE ĐỂ HẾT LỖI "title is not defined"
            danhSach,
            danhSachLop,
            danhSachKhoa,
            query: req.query
        });
    } catch (err) {
        res.render('index', { 
            title: 'Lỗi Hệ Thống',
            danhSach: [], 
            danhSachLop: [], 
            danhSachKhoa: [] 
        });
    }
});

// 2. GET: Thống kê
router.get('/thong-ke', async (req, res) => {
    try {
        const thongKeData = await SinhVien.aggregate([
            { $group: { _id: "$Khoa", count: { $sum: 1 } } }
        ]);
        res.render('thongke', { title: 'Thống kê sinh viên', data: thongKeData });
    } catch (err) {
        res.send("Lỗi thống kê: " + err);
    }
});

// -----------------------------------------------------------
// CÁC ROUTE ADMIN (Thêm/Sửa/Xóa)
// -----------------------------------------------------------

// 3. POST: Thêm sinh viên
router.post('/them', isAdmin, async (req, res) => {
    try {
        const { MSSV, HoTen, Lop, Khoa } = req.body;
        const tonTai = await SinhVien.findOne({ MSSV: MSSV });
        if (tonTai) {
            return res.send(`<script>alert('Lỗi: MSSV ${MSSV} đã tồn tại!'); window.location='/';</script>`);
        }
        const svMoi = new SinhVien({ MSSV, HoTen, Lop, Khoa });
        await svMoi.save();
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Lỗi: " + err);
    }
});

// 4. GET: Form sửa (Cần truyền thêm danhSachKhoa để làm Combobox khi sửa)
// GET: Trang Form sửa sinh viên
router.get('/sua/:id', isAdmin, async (req, res) => {
    try {
        const sv = await SinhVien.findById(req.params.id);
        const danhSachLop = await Lop.find();
        const danhSachKhoa = await khoaModel.find(); //Lấy danh sách khoa từ DB

        if (!sv) return res.redirect('/');

        res.render('sua', { 
            title: 'Sửa Thông Tin', 
            sv, 
            danhSachLop, 
            danhSachKhoa 
        });
    } catch (err) {
        res.redirect('/');
    }
});

// 5. POST: Cập nhật
router.post('/sua/:id', isAdmin, async (req, res) => {
    try {
        const { MSSV, HoTen, Lop, Khoa } = req.body; // ✅ Phải có 'Khoa' ở đây
        await SinhVien.findByIdAndUpdate(req.params.id, { MSSV, HoTen, Lop, Khoa });
        res.redirect('/');
    } catch (err) {
        res.redirect('/');
    }
});

// 6. GET: Xóa
router.get('/xoa/:id', isAdmin, async (req, res) => {
    try {
        await SinhVien.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (err) {
        res.redirect('/');
    }
});

module.exports = router;