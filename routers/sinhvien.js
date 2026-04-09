const express = require('express');
const router = express.Router();
const SinhVien = require('../models/sinhvien');
const Lop = require('../models/lop');

// ✅ Middleware kiểm tra quyền Admin
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        // Nếu không phải admin, đá về trang chủ kèm thông báo
        return res.send("<script>alert('❌ Bạn không có quyền thực hiện thao tác này!'); window.location='/';</script>");
    }
}

// 1. GET: Trang chủ + Tìm kiếm (AI CŨNG XEM ĐƯỢC)
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

        res.render('index', {
            title: 'Quản Lý Sinh Viên',
            danhSach,
            danhSachLop,
            query: req.query
        });
    } catch (err) {
        res.render('index', { title: 'Lỗi', danhSach: [], danhSachLop: [] });
    }
});

// 2. GET: Thống kê (AI CŨNG XEM ĐƯỢC)
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
// 🛡️ CÁC ROUTE DƯỚI ĐÂY CHỈ ADMIN MỚI ĐƯỢC VÀO (Gắn isAdmin)
// -----------------------------------------------------------

// 3. POST: Thêm sinh viên (CHỈ ADMIN)
// POST: Xử lý thêm sinh viên mới
router.post('/them', isAdmin, async (req, res) => {
    try {
        const { MSSV, HoTen, Lop, Khoa } = req.body;

        // Truy tìm chính xác đứa đang giữ MSSV này
        const tonTai = await SinhVien.findOne({ MSSV: MSSV });
        if (tonTai) {
            // Thông báo chi tiết kẻ đang ẩn nấp
            return res.send(`
        <script>
            alert('Lỗi: MSSV ${MSSV} đã tồn tại!\\nNgười giữ mã: ${tonTai.HoTen}\\nLớp: ${tonTai.Lop}');
            window.location='/';
        </script>
    `);
        }

        const svMoi = new SinhVien({ MSSV, HoTen, Lop, Khoa });
        await svMoi.save();
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Lỗi: " + err);
    }
});

// 4. GET: Form sửa (CHỈ ADMIN)
router.get('/sua/:id', isAdmin, async (req, res) => {
    try {
        const sv = await SinhVien.findById(req.params.id);
        const danhSachLop = await Lop.find();
        if (!sv) return res.redirect('/');
        res.render('sua', { title: 'Sửa Thông Tin', sv, danhSachLop });
    } catch (err) {
        res.redirect('/');
    }
});

// 5. POST: Cập nhật (CHỈ ADMIN)
router.post('/sua/:id', isAdmin, async (req, res) => {
    try {
        const { MSSV, HoTen, Lop, Khoa } = req.body;
        const id = req.params.id;

        // 1. Kiểm tra xem MSSV mới này có bị trùng với người khác không
        // (Tìm đứa có MSSV này nhưng KHÔNG PHẢI là đứa mình đang sửa)
        const trungMa = await SinhVien.findOne({ MSSV: MSSV, _id: { $ne: id } });
        if (trungMa) {
            return res.send("<script>alert('Lỗi: Mã MSSV này đã được sử dụng bởi sinh viên khác!'); window.history.back();</script>");
        }

        // 2. Nếu không trùng thì tiến hành cập nhật
        await SinhVien.findByIdAndUpdate(id, { MSSV, HoTen, Lop, Khoa });
        res.redirect('/');
    } catch (err) {
        res.redirect('/');
    }
});

// 6. GET: Xóa (CHỈ ADMIN)
router.get('/xoa/:id', isAdmin, async (req, res) => {
    try {
        await SinhVien.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (err) {
        res.redirect('/');
    }
});

module.exports = router;