const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const categories = [
  { id: 1, name: 'Одежда и аксессуары' },
  { id: 2, name: 'Красота и уход' },
  { id: 3, name: 'Электроника и гаджеты' },
  { id: 4, name: 'Дом и интерьер' },
  { id: 5, name: 'Спорт и активный отдых' },
  { id: 6, name: 'Здоровье' },
  { id: 7, name: 'Детские товары' },
  { id: 8, name: 'Хобби и творчество' },
  { id: 9, name: 'Подарки и персонализация' },
  { id: 10, name: 'Гастрономия' },
  { id: 11, name: 'Автотовары' },
  { id: 12, name: 'Экология и устойчивое развитие' },
  { id: 13, name: 'Праздники' }
];

const products = [
  {
    id: 1,
    name: 'Футболка Oversize',
    categoryId: 1,
    description: 'Стильная хлопковая футболка oversize',
    price: 1200,
    image: '/assets/product1.jpg',
    link: 'https://example.com/product1',
    delivery: true,
    seller: 'https://t.me/seller1'
  },
  {
    id: 2,
    name: 'Набор косметики',
    categoryId: 2,
    description: 'Подарочный набор для ухода за кожей',
    price: 0,
    image: '/assets/product2.jpg',
    link: 'https://example.com/product2',
    delivery: false,
    seller: 'https://t.me/seller2'
  }
];

const influencers = [
  {
    id: 1,
    name: 'Мария @beauty_maria',
    tg: 'https://t.me/beauty_maria',
    followers: 54000,
    about: 'Бьюти-блогер, снимаю обзоры и гайды по макияжу. Охваты до 25k.',
    price: 5000,
    avatar: '/assets/blogger1.jpg'
  },
  {
    id: 2,
    name: 'Иван @tech_ivan',
    tg: 'https://t.me/tech_ivan',
    followers: 82000,
    about: 'Гаджеты, распаковки, лайфхаки. На связи с подписчиками.',
    price: 0,
    avatar: '/assets/blogger2.jpg'
  }
];

let cart = [];

app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/influencers', (req, res) => {
  res.json(influencers);
});

app.get('/api/cart', (req, res) => {
  res.json(cart);
});

app.post('/api/cart/add', (req, res) => {
  const { item } = req.body;
  if (item) {
    cart.push(item);
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, message: 'Item required' });
  }
});

app.post('/api/cart/clear', (req, res) => {
  cart = [];
  res.json({ success: true });
});

// Route for Telegram WebApp integration
app.get('/tg/:botId', (req, res) => {
  const { botId } = req.params;
  console.log(`WebApp accessed by bot: ${botId}`);
  // В реальном приложении здесь была бы проверка botId
  res.redirect('/');
});

// Для полноэкранного режима в Telegram
app.get('/webapp', (req, res) => {
  // Получаем параметры из query string
  const { bot, app } = req.query;
  console.log(`WebApp fullscreen: bot=${bot || 'unknown'}, app=${app || 'default'}`);
  // Отправляем страницу с настройками для полноэкранного режима
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Маршрут для прямого запуска WebApp из Telegram
app.get('/telegram-web-app', (req, res) => {
  console.log('Прямой запуск WebApp из Telegram');
  res.sendFile(path.join(__dirname, 'public', 'webapp.html'));
});

// Маршрут для WebApp с упрощенным именем - будет работать в Telegram
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'webapp.html'));
});

// Для запросов на tgwebapp
app.get('/tgwebapp', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'webapp.html'));
});

// Route for main.html
app.get('/main.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Default route - serve index.html for onboarding
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Маршрут для запуска через startapp параметр
app.get('/startapp/:appname', (req, res) => {
  const { appname } = req.params;
  console.log(`Запуск через startapp параметр: ${appname}`);
  res.sendFile(path.join(__dirname, 'public', 'webapp.html'));
});

// Listen on the specified port
app.listen(PORT, () => console.log(`🚀 UGC Platform running at http://localhost:${PORT}`));
