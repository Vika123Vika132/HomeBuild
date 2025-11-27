const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const app = express();
const db = new Database('florist.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS flowers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flower_id INTEGER,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (flower_id) REFERENCES flowers(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_date TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
`);

const adminExists = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)').run('admin', 'admin@florist.com', hashedPassword, 'admin');
}

const flowersCount = db.prepare('SELECT COUNT(*) as count FROM flowers').get();
if (flowersCount.count === 0) {
  const flowers = [
    { name: 'Роза белая', description: 'Элегантная белая роза, символ чистоты и нежности', price: 150, image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f5f5f5" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23333"%3EРоза белая%3C/text%3E%3C/svg%3E', stock: 50 },
    { name: 'Тюльпан черный', description: 'Редкий черный тюльпан, изысканный и загадочный', price: 200, image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f5f5f5" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23333"%3EТюльпан%3C/text%3E%3C/svg%3E', stock: 30 },
    { name: 'Лилия белая', description: 'Классическая белая лилия с нежным ароматом', price: 180, image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f5f5f5" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23333"%3EЛилия%3C/text%3E%3C/svg%3E', stock: 40 },
    { name: 'Орхидея', description: 'Экзотическая орхидея, символ роскоши', price: 350, image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f5f5f5" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23333"%3EОрхидея%3C/text%3E%3C/svg%3E', stock: 20 },
    { name: 'Пион белый', description: 'Пышный белый пион, символ благополучия', price: 220, image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f5f5f5" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23333"%3EПион%3C/text%3E%3C/svg%3E', stock: 35 },
    { name: 'Гортензия', description: 'Объемная гортензия с нежными соцветиями', price: 280, image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f5f5f5" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23333"%3EГортензия%3C/text%3E%3C/svg%3E', stock: 25 },
    { name: 'Каллы', description: 'Изящные каллы, элегантность в каждом изгибе', price: 250, image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f5f5f5" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23333"%3EКаллы%3C/text%3E%3C/svg%3E', stock: 30 },
    { name: 'Хризантема', description: 'Классическая хризантема, долговечная красота', price: 120, image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f5f5f5" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23333"%3EХризантема%3C/text%3E%3C/svg%3E', stock: 60 }
  ];
  
  const insertFlower = db.prepare('INSERT INTO flowers (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)');
  for (const flower of flowers) {
    insertFlower.run(flower.name, flower.description, flower.price, flower.image_url, flower.stock);
  }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'florist-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.cart = req.session.cart || [];
  next();
});

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }
  next();
}

app.get('/', (req, res) => {
  const featuredFlowers = db.prepare('SELECT * FROM flowers LIMIT 3').all();
  res.render('index', { featuredFlowers });
});

app.get('/catalog', (req, res) => {
  const flowers = db.prepare('SELECT * FROM flowers ORDER BY created_at DESC').all();
  res.render('catalog', { flowers });
});

app.get('/product/:id', (req, res) => {
  const flower = db.prepare('SELECT * FROM flowers WHERE id = ?').get(req.params.id);
  if (!flower) {
    return res.redirect('/catalog');
  }
  res.render('product', { flower });
});

app.get('/delivery', (req, res) => {
  res.render('delivery');
});

app.get('/contacts', (req, res) => {
  res.render('contacts');
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login', { error: null });
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: 'Пользователь уже существует' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.json({ success: false, error: 'Неверный email или пароль' });
  }
  
  req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role };
  res.json({ success: true, role: user.role });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const cartItems = cart.map(item => {
    const flower = db.prepare('SELECT * FROM flowers WHERE id = ?').get(item.flowerId);
    return { ...flower, quantity: item.quantity };
  });
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  res.render('cart', { cartItems, total });
});

app.post('/cart/add', (req, res) => {
  const { flowerId, quantity } = req.body;
  
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  const existingItem = req.session.cart.find(item => item.flowerId === parseInt(flowerId));
  
  if (existingItem) {
    existingItem.quantity += parseInt(quantity);
  } else {
    req.session.cart.push({ flowerId: parseInt(flowerId), quantity: parseInt(quantity) });
  }
  
  res.json({ success: true, cartCount: req.session.cart.length });
});

app.post('/cart/update', (req, res) => {
  const { flowerId, quantity } = req.body;
  
  if (!req.session.cart) {
    return res.json({ success: false });
  }
  
  const item = req.session.cart.find(item => item.flowerId === parseInt(flowerId));
  if (item) {
    item.quantity = parseInt(quantity);
  }
  
  res.json({ success: true });
});

app.post('/cart/remove', (req, res) => {
  const { flowerId } = req.body;
  
  if (!req.session.cart) {
    return res.json({ success: false });
  }
  
  req.session.cart = req.session.cart.filter(item => item.flowerId !== parseInt(flowerId));
  res.json({ success: true, cartCount: req.session.cart.length });
});

app.post('/order/create', (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, error: 'Необходимо войти в систему' });
  }
  
  const { address, deliveryDate } = req.body;
  const cart = req.session.cart || [];
  
  if (cart.length === 0) {
    return res.json({ success: false, error: 'Корзина пуста' });
  }
  
  const cartItems = cart.map(item => {
    const flower = db.prepare('SELECT * FROM flowers WHERE id = ?').get(item.flowerId);
    return { ...flower, quantity: item.quantity };
  });
  
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  try {
    const result = db.prepare('INSERT INTO orders (user_id, total_amount, delivery_address, delivery_date) VALUES (?, ?, ?, ?)').run(req.session.user.id, total, address, deliveryDate);
    
    db.prepare('INSERT INTO payments (order_id, amount, payment_method, status) VALUES (?, ?, ?, ?)').run(result.lastInsertRowid, total, 'card', 'completed');
    
    req.session.cart = [];
    
    res.json({ success: true, orderId: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, error: 'Ошибка создания заказа' });
  }
});

app.get('/admin', requireAdmin, (req, res) => {
  const flowers = db.prepare('SELECT * FROM flowers ORDER BY created_at DESC').all();
  const orders = db.prepare('SELECT orders.*, users.username FROM orders JOIN users ON orders.user_id = users.id ORDER BY orders.created_at DESC').all();
  res.render('admin', { flowers, orders });
});

app.post('/admin/flower/add', requireAdmin, (req, res) => {
  const { name, description, price, stock, image_url } = req.body;
  
  try {
    db.prepare('INSERT INTO flowers (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)').run(name, description, parseFloat(price), image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f5f5f5" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23333"%3EНовый цветок%3C/text%3E%3C/svg%3E', parseInt(stock));
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: 'Ошибка добавления товара' });
  }
});

app.post('/admin/flower/update', requireAdmin, (req, res) => {
  const { id, name, description, price, stock, image_url } = req.body;
  
  try {
    db.prepare('UPDATE flowers SET name = ?, description = ?, price = ?, image_url = ?, stock = ? WHERE id = ?').run(name, description, parseFloat(price), image_url, parseInt(stock), parseInt(id));
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: 'Ошибка обновления товара' });
  }
});

app.post('/admin/flower/delete', requireAdmin, (req, res) => {
  const { id } = req.body;
  
  try {
    db.prepare('DELETE FROM flowers WHERE id = ?').run(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: 'Ошибка удаления товара' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
