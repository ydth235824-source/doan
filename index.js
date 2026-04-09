const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');

// 1. Cấu hình các Router
const sinhVienRouter = require('./routers/sinhvien');
const lopRouter = require('./routers/lop');
const khoaRouter = require('./routers/khoa');

// 2. Kết nối MongoDB
const uri = 'mongodb://user:12345@ac-0wqq6gp-shard-00-02.jsk0mou.mongodb.net:27017/doan?ssl=true&authSource=admin';
mongoose.connect(uri)
    .then(() => console.log('✅ Đã kết nối thành công tới MongoDB.'))
    .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// 3. Cấu hình View Engine & Middleware
app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// 4. Cấu hình Session (Quan trọng: Đặt TRƯỚC router)
app.use(session({
    secret: 'abc123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Session tồn tại 1 ngày
}));

// 5. Middleware đẩy user vào Locals (Chỉ cần 1 cái này thôi)
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// -----------------------------------------------------------
// 6. ROUTES HỆ THỐNG
// -----------------------------------------------------------

// GET: Trang Login (Giao diện mới)
app.get('/login', (req, res) => {
    // Nếu đã đăng nhập rồi thì cho về trang chủ luôn
    if (req.session.user) {
        return res.redirect('/');
    }
    // Gọi file login.ejs trong thư mục views
    res.render('login'); 
});

// POST: Xử lý đăng nhập
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Logic kiểm tra đơn giản
    if (username === 'admin' && password === '123') {
        req.session.user = { username, role: 'admin' };
        res.redirect('/');
    } else if (username && password) {
        req.session.user = { username, role: 'user' };
        res.redirect('/');
    } else {
        res.send("<script>alert('Vui lòng nhập đầy đủ!'); window.location='/login';</script>");
    }
});

// GET: Đăng xuất
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        // Thay vì redirect về /login, mình redirect về trang chủ /
        res.redirect('/'); 
    });
});

// Sử dụng các Router đã khai báo
app.use('/', sinhVienRouter);
app.use('/lop', lopRouter);
app.use('/khoa', khoaRouter);

app.get('/debug-db', async (req, res) => {
    const SinhVien = require('./models/sinhvien');
    const all = await SinhVien.find({});
    res.json(all); // Nó sẽ hiện toàn bộ những gì đang có trong DB dưới dạng chữ
});

// 7. Chạy Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://127.0.0.1:${PORT}`);
});