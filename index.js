const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const { google } = require('googleapis');
const ExcelJS = require('exceljs'); 

// 1. Cấu hình các Router
const sinhVienRouter = require('./routers/sinhvien');
const lopRouter = require('./routers/lop');
const khoaRouter = require('./routers/khoa');

// 2. Kết nối MongoDB
const uri = 'mongodb://user:12345@ac-0wqq6gp-shard-00-02.jsk0mou.mongodb.net:27017/doan?ssl=true&authSource=admin';
mongoose.connect(uri)
    .then(() => console.log('Đã kết nối thành công tới MongoDB.'))
    .catch(err => console.error(' Lỗi kết nối MongoDB:', err));

// 3. Cấu hình View Engine & Middleware
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// 4. Cấu hình Session
app.use(session({
    secret: 'abc123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// 5. Middleware Locals
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Thêm dòng này ở đầu file (ví dụ dưới dòng const app = express();)
let adminPassword = '123';
let adminUser = 'admin';     

// 6. ROUTES HỆ THỐNG
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('login'); 
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // So sánh với 2 biến linh hoạt
    if (username === adminUser && password === adminPassword) {
        req.session.user = { username, role: 'admin' };
        return res.redirect('/');
    } 
    
    res.send("<script>alert('Sai tài khoản hoặc mật khẩu!'); window.location='/login';</script>");
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

app.use('/', sinhVienRouter);
app.use('/lop', lopRouter);
app.use('/khoa', khoaRouter);

// --- XUẤT LÊN GOOGLE SHEETS ---
app.get('/export-sheets', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.send("<script>alert('Bạn không có quyền!'); window.location='/';</script>");
    }

    try {
        const maLopFilter = req.query.lop; 
        const SinhVien = require('./models/sinhvien');
        const students = await SinhVien.find({ Lop: maLopFilter });

        if (students.length === 0) return res.send("<script>alert('Lớp không có sinh viên!'); window.history.back();</script>");

        const auth = new google.auth.GoogleAuth({
            keyFile: './secret-api-key.json',
            scopes: 'https://www.googleapis.com/auth/spreadsheets',
        });

        const client = await auth.getClient();
        const googleSheets = google.sheets({ version: 'v4', auth: client });
        const spreadsheetId = '1w9W7XLoGwPERS68RrYQ6fGZZyqID2jlurWDHBOIXVf0';

        // Tự tạo tab mới nếu chưa có
        try {
            await googleSheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: { requests: [{ addSheet: { properties: { title: maLopFilter } } }] }
            });
        } catch (e) { console.log("Tab đã tồn tại"); }

        const values = students.map(sv => [sv.MSSV, sv.HoTen, sv.Khoa]);
        values.unshift(['MSSV', 'Họ Và Tên', 'Khoa']);

        await googleSheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${maLopFilter}!A1`, 
            valueInputOption: 'USER_ENTERED',
            resource: { values },
        });

        // Báo thành công để trình duyệt ngừng xoay
        res.send(`<script>alert('Đã đẩy lên Google Sheets lớp ${maLopFilter}!'); window.location='/';</script>`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi: " + error.message);
    }
});

// --- XUẤT FILE VỀ MÁY ---
app.get('/export-excel', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.send("<script>alert('Bạn không có quyền!'); window.location='/';</script>");
    }

    try {
        const maLopFilter = req.query.lop;
        const SinhVien = require('./models/sinhvien');
        const students = await SinhVien.find({ Lop: maLopFilter });

        if (students.length === 0) return res.send("<script>alert('Lớp không có sinh viên!'); window.history.back();</script>");

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(`Lớp ${maLopFilter}`);

        sheet.columns = [
            { header: 'MSSV', key: 'mssv', width: 15 },
            { header: 'Họ và Tên', key: 'hoten', width: 30 },
            { header: 'Khoa', key: 'khoa', width: 25 }
        ];

        students.forEach(sv => {
            sheet.addRow({ mssv: sv.MSSV, hoten: sv.HoTen, khoa: sv.Khoa });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Lop_${maLopFilter}.xlsx`);

        await workbook.xlsx.write(res);
        res.end(); // KẾT THÚC REQUEST ĐỂ NGỪNG XOAY

    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi: " + error.message);
    }
});

// Route hiển thị trang cài đặt
app.get('/settings', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    // PHẢI thêm biến title vào đây
    res.render('settings', { 
        user: req.session.user, 
        title: 'Cài đặt tài khoản' 
    }); 
});

// Đổi từ /update-settings thành /settings cho khớp với Form
app.post('/settings', async (req, res) => {
    const { newName, newPassword } = req.body; // Lấy cả tên mới và mk mới
    
    try {
        if (newName && newName.trim() !== "" && newPassword && newPassword.trim() !== "") {
            // Cập nhật cả 2 biến toàn cục
            adminUser = newName; 
            adminPassword = newPassword; 

            // Cập nhật lại session để menu hiển thị tên mới ngay lập tức
            req.session.user.username = newName;

            res.send("<script>alert('Cập nhật thành công! Tên mới: " + newName + "'); window.location='/';</script>");
        } else {
            res.send("<script>alert('Không được để trống tên hoặc mật khẩu!'); window.history.back();</script>");
        }
    } catch (error) {
        res.status(500).send("Lỗi: " + error.message);
    }
});

// --- ĐOẠN CODE CẤU HÌNH GOOGLE SHEETS MỚI ---
let googleKey;
try {
    if (process.env.GOOGLE_KEY_DATA) {
        // Nếu chạy trên Render (Lấy từ Environment Group)
        googleKey = JSON.parse(process.env.GOOGLE_KEY_DATA);
    } else {
        // Nếu chạy ở máy local (Đọc file json)
        googleKey = require('./secret-api-key.json');
    }
} catch (e) {
    console.error("Lỗi cấu hình Google Key:", e.message);
}

const auth = new google.auth.GoogleAuth({
    credentials: googleKey, // Dùng credentials thay vì keyFile
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

// 7. Chạy Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng: ${PORT}`);
});