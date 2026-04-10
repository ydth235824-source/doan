const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const { google } = require('googleapis');
const ExcelJS = require('exceljs'); 

// --- ĐOẠN 1: CẤU HÌNH GOOGLE AUTH (ĐƯA LÊN ĐẦU ĐỂ DÙNG CHUNG) ---
let googleKey;
try {
    if (process.env.GOOGLE_KEY_DATA) {
        // Ưu tiên lấy từ Render Environment Group
        googleKey = JSON.parse(process.env.GOOGLE_KEY_DATA);
    } else {
        // Chạy ở máy local nếu còn file
        googleKey = require('./secret-api-key.json');
    }
} catch (e) {
    console.log("Lưu ý: Không tìm thấy Google Key, chức năng Sheets sẽ tạm khóa.");
}

const googleAuth = new google.auth.GoogleAuth({
    credentials: googleKey,
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

// --- ĐOẠN 2: CÁC CẤU HÌNH CƠ BẢN ---
const sinhVienRouter = require('./routers/sinhvien');
const lopRouter = require('./routers/lop');
const khoaRouter = require('./routers/khoa');

const uri = 'mongodb://user:12345@ac-0wqq6gp-shard-00-02.jsk0mou.mongodb.net:27017/doan?ssl=true&authSource=admin';
mongoose.connect(uri)
    .then(() => console.log('Đã kết nối thành công tới MongoDB.'))
    .catch(err => console.error(' Lỗi kết nối MongoDB:', err));

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: 'abc123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Sửa lỗi ReferenceError: adminPassword is not defined
let adminUser = 'admin';  
let adminPassword = '123'; 

// --- ĐOẠN 3: ROUTES ĐĂNG NHẬP & CÀI ĐẶT ---
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('login'); 
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminUser && password === adminPassword) {
        req.session.user = { username, role: 'admin' };
        return res.redirect('/');
    } 
    res.send("<script>alert('Sai tài khoản hoặc mật khẩu!'); window.location='/login';</script>");
});

app.get('/settings', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    // Sửa lỗi title is not defined
    res.render('settings', { user: req.session.user, title: 'Cài đặt tài khoản' }); 
});

app.post('/settings', async (req, res) => {
    const { newName, newPassword } = req.body; 
    if (newName && newName.trim() !== "" && newPassword && newPassword.trim() !== "") {
        adminUser = newName; 
        adminPassword = newPassword; 
        req.session.user.username = newName;
        res.send("<script>alert('Cập nhật thành công!'); window.location='/';</script>");
    } else {
        res.send("<script>alert('Không được để trống!'); window.history.back();</script>");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// --- ĐOẠN 4: ROUTES XUẤT DỮ LIỆU ---

// SỬA ROUTE GOOGLE SHEETS (Dùng googleAuth đã cấu hình ở trên)
app.get('/export-sheets', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.send("<script>alert('Bạn không có quyền!'); window.location='/';</script>");
    }

    try {
        const maLopFilter = req.query.lop; 
        const SinhVien = require('./models/sinhvien');
        const students = await SinhVien.find({ Lop: maLopFilter });

        if (students.length === 0) return res.send("<script>alert('Lớp không có sinh viên!'); window.history.back();</script>");

        // Dùng googleAuth đã khai báo ở đầu file, không dùng keyFile nữa!
        const client = await googleAuth.getClient(); 
        const googleSheets = google.sheets({ version: 'v4', auth: client });
        const spreadsheetId = '1w9W7XLoGwPERS68RrYQ6fGZZyqID2jlurWDHBOIXVf0';

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

        res.send(`<script>alert('Đã đẩy lên Google Sheets lớp ${maLopFilter}!'); window.location='/';</script>`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi xuất Sheets: " + error.message);
    }
});

// Giữ nguyên Route export-excel của ông vì nó chạy tốt
app.get('/export-excel', async (req, res) => {
    // ... code cũ của ông giữ nguyên ...
});

app.use('/', sinhVienRouter);
app.use('/lop', lopRouter);
app.use('/khoa', khoaRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng: ${PORT}`);
});