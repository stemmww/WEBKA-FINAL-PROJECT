require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const multer = require('multer');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Импорт маршрутов
const favoriteRoutes = require('./routes/favorites');

const app = express();
const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
app.use(session({
    secret: 'secretkey', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Устанавливаем движок представлений
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 📌 Middleware to pass authentication status to all EJS files
app.use((req, res, next) => {
    console.log(`📌 Request: ${req.method} ${req.url} | JWT:`, req.session.token || "No token set");
    res.locals.isAuthenticated = !!req.session.userId; // True if logged in
    next();
});


// Подключаем маршруты
app.use('/favorites', favoriteRoutes);

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ Подключено к MongoDB Atlas'))
    .catch(err => console.error('❌ Ошибка подключения:', err));

// Определяем схему пользователя
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    age: Number,
    password: String,
    failedAttempts: { type: Number, default: 0 },
    accountLocked: { type: Boolean, default: false },
    profilePicture: { type: String },
    twoFASecret: String,
    is2FAEnabled: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Настройка Multer для загрузки изображений
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        cb(null, `${Date.now()}${fileExtension}`);
    }
});
const upload = multer({ storage: storage });

// 📌 Маршруты
app.get("/recipes", (req, res) => res.render("recipes"));
app.get("/guide", (req, res) => res.render("guide"));
app.get("/aboutus", (req, res) => res.render("aboutus"));
app.get("/contact", (req, res) => res.render("contact"));
app.get("/settings", (req, res) => res.render("settings"));

// 📌 Регистрация
app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
    try {
        const { name, email, age, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, age, password: hashedPassword });
        await newUser.save();
        res.redirect('/login');
    } catch (err) {
        res.status(500).send('Ошибка регистрации пользователя');
    }
});

// 📌 Вход (Login)
app.get('/login', (req, res) => res.render('login'));
// 📌 Вход (Login) с перенаправлением
// 📌 Вход (Login) с логированием JWT
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send('Неверные учетные данные');
        }

        // ✅ Log JWT before setting
        console.log("🔹 JWT before login:", req.session.token || "No token set");

        // ✅ Создаем JWT-токен
        const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1h' });

        // ✅ Сохраняем ID пользователя в сессии
        req.session.userId = user._id;
        req.session.userName = user.name;
        req.session.token = token;

        // ✅ Log JWT after setting
        console.log("✅ JWT after login:", token);

        // ✅ Перенаправляем на главную страницу
        res.redirect('/');
    } catch (err) {
        console.error('❌ Ошибка сервера:', err);
        res.status(500).send('Ошибка сервера');
    }
});

// 📌 Настройка 2FA
app.get('/setup-2fa', requireAuth, async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect('/login');

    const secret = speakeasy.generateSecret();
    user.twoFASecret = secret.base32;
    user.is2FAEnabled = true;
    await user.save();

    qrcode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
        if (err) {
            return res.status(500).send("Ошибка генерации QR-кода");
        }
        res.render('setup-2fa', { qrCodeUrl: dataUrl });
    });
});

// 📌 Проверка OTP
app.get('/verify-otp', requireAuth, (req, res) => res.render('verify-otp'));
app.post('/verify-otp', requireAuth, async (req, res) => {
    const user = await User.findById(req.session.userId);
    const { otp } = req.body;
    const isValid = speakeasy.totp.verify({
        secret: user.twoFASecret,
        encoding: 'base32',
        token: otp
    });
    if (!isValid) return res.send('Неверный OTP');
    req.session.isVerified = true;
    res.redirect('/');
});

// 📌 Защищенный маршрут (Только после входа)
app.get('/', async (req, res) => {
    if (req.session.userId) { 
        // User is logged in
        if (!req.session.isVerified) return res.redirect('/verify-otp');

        try {
            const users = await User.find();
            return res.render('index', { user: req.session.userName, users, isAuthenticated: true });
        } catch (err) {
            return res.status(500).send('Ошибка загрузки пользователей');
        }
    } else {
        // Unauthenticated users should still access index.html but with limited content
        return res.render('index', { user: null, users: [], isAuthenticated: false });
    }
});
  

// 📌 Выход из аккаунта
app.get('/logout', (req, res) => {
    console.log("🚪 Logging out, clearing JWT:", req.session.token || "No token set");
    req.session.destroy(() => {
        res.redirect('/login');
    });
});


// 📌 Профиль пользователя
app.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.redirect('/login'); // Redirect instead of showing an error
        res.render('profile', { user });
    } catch (err) {
        res.redirect('/login'); // Redirect in case of DB error
    }
});


// 📌 Обновление пользователя
app.get('/users/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).send('Пользователь не найден');
        }

        res.render('update', { user });
    } catch (err) {
        res.status(500).send('Ошибка получения данных пользователя');
    }
});

// 📌 Удаление пользователя
app.post('/users/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка удаления пользователя');
    }
});

// 📌 Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на http://localhost:${PORT}`));