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
const db = new Database('homebuild.db');

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
  db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)').run('admin', 'admin@homebuild.ru', hashedPassword, 'admin');
}

const seedFlowers = [
  { name: 'Цемент М500 D0, 50 кг', description: 'Портландцемент для бетона и кладки; морозостойкая смесь', price: 420, stock: 200 },
  { name: 'Кирпич керамический полнотелый', description: '250×120×65 мм, прочность М150, для несущих стен и цоколя', price: 18, image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop&q=80', stock: 12000 },
  { name: 'Доска обрезная 50×200×6000', description: 'Хвоя, естественная влажность; для каркаса и опалубки', price: 1850, image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=600&fit=crop&q=80', stock: 80 },
  { name: 'Гипсокартон 12,5 мм 1,2×2,5 м', description: 'Влагостойкий (Кнауф), для влажных зон и перегородок', price: 680, image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&h=600&fit=crop&q=80', stock: 350 },
  { name: 'Песок строительный, 1 м³', description: 'Мытый, средней крупности; для стяжек и кладочных растворов', price: 1200, image_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=600&fit=crop&q=80', stock: 45 },
  { name: 'Краска фасадная белая, 15 л', description: 'Акриловая, дышащая, УФ-стойкая; расход согласно инструкции', price: 5200, image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=600&fit=crop&q=80', stock: 60 },
  { name: 'Утеплитель минвата 100 мм', description: 'Плиты 1200×600; для фасада и перегородок, группа горючести НГ', price: 890, image_url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&h=600&fit=crop&q=80', stock: 400 },
  { name: 'Перфоратор SDS-plus 800 Вт', description: '3 режима, в комплекте кейс; для демонтажа и сверления бетона', price: 8900, image_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=600&fit=crop&q=80', stock: 25 },
  { name: 'Шпаклевка полимерная финишная, 25 кг', description: 'Для финишного выравнивания стен и потолков перед покраской', price: 950, image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=600&fit=crop&q=80', stock: 120 },
  { name: 'Серпянка строительная 50 мм × 45 м', description: 'Для армирования швов при оштукатуривании и гипсокартоне', price: 240, image_url: 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=600&h=600&fit=crop&q=80', stock: 200 },
  { name: 'Линолеум бытовой 2.5 м, толщина 3.5 мм', description: 'Полувинил на вспененной основе; подходит для кухни и коридора', price: 4200, image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=600&fit=crop&q=80', stock: 35 },
  { name: 'Розетка с заземлением, белая', description: 'Legrand Valena, 16 А, для скрытой установки', price: 320, image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=600&fit=crop&q=80', stock: 500 },
  { name: 'Металлочерепица 0.45 мм, RAL 7024', description: 'Лист 1180×2200 мм; графитовый серый, полиэстер', price: 780, image_url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=600&fit=crop&q=80', stock: 150 },
  { name: 'Перчатки х/б с латексным покрытием, 10 пар', description: 'Универсальные для строительных и погрузочных работ', price: 480, image_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=600&fit=crop&q=80', stock: 300 }
];

const insertFlowerIfMissing = db.prepare('INSERT INTO flowers (name, description, price, image_url, stock) SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM flowers WHERE name = ?)');
for (const f of seedFlowers) {
  insertFlowerIfMissing.run(f.name, f.description, f.price, f.image_url, f.stock, f.name);
}

db.exec(`
  UPDATE flowers SET
    name = replace(replace(name, 'ё', 'е'), 'Ё', 'Е'),
    description = replace(replace(coalesce(description, ''), 'ё', 'е'), 'Ё', 'Е');
`);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'homebuild-session-secret-2026',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.cart = req.session.cart || [];
  res.locals.cartCount = (req.session.cart || []).reduce((sum, item) => sum + item.quantity, 0);
  next();
});

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }
  next();
}

function requireUser(req, res, next) {
  if (!req.session.user) {
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
  const searchQuery = (req.query.q || '').trim();
  res.render('catalog', { flowers, searchQuery });
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
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin');
    }
    return res.redirect('/account');
  }
  res.render('login', { error: null });
});

app.get('/account', requireUser, (req, res) => {
  if (req.session.user.role === 'admin') {
    return res.redirect('/admin');
  }
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.session.user.id);
  const accountMessage = req.query.message || null;
  const accountError = req.query.error || null;
  res.render('account', { orders, accountMessage, accountError });
});

app.post('/account/update', requireUser, async (req, res) => {
  if (req.session.user.role === 'admin') {
    return res.redirect('/admin');
  }

  const userId = req.session.user.id;
  const username = (req.body.username || '').trim();
  const email = (req.body.email || '').trim();
  const password = (req.body.password || '').trim();

  if (!username || !email) {
    return res.redirect('/account?error=' + encodeURIComponent('Имя и email обязательны'));
  }

  const duplicate = db.prepare('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?').get(username, email, userId);
  if (duplicate) {
    return res.redirect('/account?error=' + encodeURIComponent('Пользователь с таким именем или email уже существует'));
  }

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare('UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?').run(username, email, hashedPassword, userId);
    } else {
      db.prepare('UPDATE users SET username = ?, email = ? WHERE id = ?').run(username, email, userId);
    }

    req.session.user.username = username;
    req.session.user.email = email;
    return res.redirect('/account?message=' + encodeURIComponent('Данные профиля обновлены'));
  } catch (error) {
    return res.redirect('/account?error=' + encodeURIComponent('Не удалось обновить данные'));
  }
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
  
  const cartCount = req.session.cart.reduce((sum, item) => sum + item.quantity, 0);
  res.json({ success: true, cartCount });
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
  const cartCount = req.session.cart.reduce((sum, item) => sum + item.quantity, 0);
  res.json({ success: true, cartCount });
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

app.post('/admin/flower/add', requireAdmin, upload.single('image'), (req, res) => {
  const { name, description, price, stock } = req.body;
  let image_url = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23222f3e" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%23e67e22"%3EHomeBuild%3C/text%3E%3C/svg%3E';
  
  if (req.file) {
    image_url = '/uploads/' + req.file.filename;
  }
  
  try {
    db.prepare('INSERT INTO flowers (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)').run(name, description, parseFloat(price), image_url, parseInt(stock));
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: 'Ошибка добавления товара' });
  }
});

app.post('/admin/flower/update', requireAdmin, upload.single('image'), (req, res) => {
  const { id, name, description, price, stock } = req.body;
  let image_url = null;
  
  if (req.file) {
    image_url = '/uploads/' + req.file.filename;
  }
  
  try {
    if (image_url) {
      db.prepare('UPDATE flowers SET name = ?, description = ?, price = ?, image_url = ?, stock = ? WHERE id = ?').run(name, description, parseFloat(price), image_url, parseInt(stock), parseInt(id));
    } else {
      db.prepare('UPDATE flowers SET name = ?, description = ?, price = ?, stock = ? WHERE id = ?').run(name, description, parseFloat(price), parseInt(stock), parseInt(id));
    }
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

app.post('/admin/order/status', requireAdmin, (req, res) => {
  const { id, status } = req.body;
  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.json({ success: false, error: 'Недопустимый статус' });
  }
  try {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, parseInt(id, 10));
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: 'Ошибка обновления заказа' });
  }
});

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
}

app.post('/chatbot/reply', (req, res) => {
  const message = String(req.body.message || '').trim();
  if (!message) {
    return res.json({ success: false, reply: 'Напишите вопрос, и я постараюсь помочь.' });
  }

  const q = normalizeText(message);
  const user = req.session.user || null;
  const cartCount = (req.session.cart || []).reduce((sum, item) => sum + item.quantity, 0);

  if (q.includes('привет') || q.includes('здрав')) {
    const namePart = user ? `, ${user.username}` : '';
    return res.json({ success: true, reply: `Здравствуйте${namePart}! Могу подсказать по доставке, оплате, заказам и товарам.` });
  }

  if (q.includes('достав')) {
    return res.json({ success: true, reply: 'Доставка по городу обычно 1-2 дня, по области - по согласованию с менеджером.' });
  }

  if (q.includes('самовывоз')) {
    return res.json({ success: true, reply: 'Самовывоз доступен после подтверждения заказа. Детали отправим после оформления.' });
  }

  if (q.includes('оплат') || q.includes('карта') || q.includes('перевод')) {
    return res.json({ success: true, reply: 'Оплата доступна онлайн при оформлении. Для юрлиц предоставляем закрывающие документы.' });
  }

  if (q.includes('корзин')) {
    return res.json({ success: true, reply: cartCount > 0 ? `Сейчас в вашей корзине ${cartCount} шт. товаров.` : 'Ваша корзина сейчас пуста.' });
  }

  if (q.includes('заказ') || q.includes('статус')) {
    if (!user) {
      return res.json({ success: true, reply: 'Чтобы смотреть статусы заказов, войдите в аккаунт и откройте личный кабинет.' });
    }
    const lastOrder = db.prepare('SELECT id, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(user.id);
    if (!lastOrder) {
      return res.json({ success: true, reply: 'У вас пока нет заказов. Оформите первый заказ в каталоге.' });
    }
    const statusLabels = {
      pending: 'ожидает подтверждения',
      processing: 'в обработке',
      shipped: 'отправлен',
      delivered: 'доставлен',
      cancelled: 'отменен'
    };
    const statusText = statusLabels[lastOrder.status] || lastOrder.status;
    return res.json({ success: true, reply: `Последний заказ №${lastOrder.id}: ${statusText}. Подробности - в личном кабинете.` });
  }

  if (q.includes('товар') || q.includes('каталог') || q.includes('найд')) {
    const words = q.split(/\s+/).filter(w => w.length >= 4);
    for (const word of words) {
      const match = db.prepare('SELECT name, price, stock FROM flowers WHERE lower(replace(name, "ё", "е")) LIKE ? LIMIT 1').get(`%${word}%`);
      if (match) {
        return res.json({
          success: true,
          reply: `Нашел: "${match.name}" - ${Number(match.price).toFixed(2)} ₽, в наличии ${match.stock} шт. Посмотрите в каталоге.`
        });
      }
    }
    return res.json({ success: true, reply: 'В каталоге много позиций. Напишите точнее, например: "цемент", "гипсокартон" или "утеплитель".' });
  }

  return res.json({
    success: true,
    reply: 'Я могу помочь по темам: доставка, оплата, корзина, статус заказа, поиск товара в каталоге.'
  });
});

const ADMIN_EMAIL = 'admin@homebuild.ru';
const ADMIN_PASSWORD = 'admin123';

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log('');
  console.log('--- Администратор HomeBuild ---');
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Пароль:   ${ADMIN_PASSWORD}`);
  console.log('-------------------------------');
  console.log('');
});