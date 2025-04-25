
const tg = window.Telegram.WebApp;

async function loadCart() {
  const res = await fetch('/api/cart');
  const items = await res.json();
  const container = document.getElementById('cartContent');
  container.innerHTML = '';
  if (items.length === 0) {
    container.innerHTML = '<p>Корзина пуста</p>';
    return;
  }
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h3>${item.name || item.title}</h3><p>${item.description || item.about || ''}</p>`;
    container.appendChild(div);
  });
}

async function clearCart() {
  await fetch('/api/cart/clear', { method: 'POST' });
  tg.showAlert('Корзина очищена');
  loadCart();
}

function submitOrder() {
  tg.showAlert('Заказ оформлен. Спасибо!');
  clearCart();
}

loadCart();
