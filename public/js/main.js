
const tg = window.Telegram.WebApp;

tg.expand(); // Раскрытие WebApp на весь экран

async function fetchData(url) {
  const res = await fetch(url);
  return res.json();
}

function renderList(items, type = 'product') {
  const container = document.getElementById('content');
  container.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = type === 'product'
      ? `<img src="${item.image}" width="100"><h3>${item.name}</h3><p>${item.description}</p><p>Цена: ${item.price || '0'}</p><a href="${item.link}" target="_blank">К товару</a><br><a href="${item.seller}" target="_blank">Продавец</a><button onclick='addToCart(${JSON.stringify(item)})'>Добавить в корзину</button>`
      : `<img src="${item.avatar}" width="100"><h3>${item.name}</h3><p>${item.about}</p><p>Подписчиков: ${item.followers}</p><a href="${item.tg}" target="_blank">Контакт</a><button onclick='addToCart(${JSON.stringify(item)})'>Добавить в корзину</button>`;
    container.appendChild(div);
  });
}

function addToCart(item) {
  fetch('/api/cart/add', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ item })
  }).then(() => {
    tg.showAlert("Добавлено в корзину");
  });
}

async function showBloggerView() {
  const data = await fetchData('/api/products');
  renderList(data, 'product');
}

async function showCompanyView() {
  const data = await fetchData('/api/influencers');
  renderList(data, 'influencer');
}
