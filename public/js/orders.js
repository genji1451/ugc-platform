// Состояние приложения
let orders = [];
let categories = [];
let currentFilter = 'all';
let searchQuery = '';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    await Promise.all([
        loadCategories(),
        loadOrders()
    ]);
    
    setupEventListeners();
    updateStatistics();
    renderOrders();
}

// Загрузка данных
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        categories = await response.json();
    } catch (error) {
        console.error('Error loading categories:', error);
        showNotification('Ошибка загрузки категорий', 'error');
    }
}

async function loadOrders() {
    try {
        const response = await fetch('/api/orders');
        orders = await response.json();
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Ошибка загрузки заказов', 'error');
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Фильтры
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', () => {
            currentFilter = button.dataset.filter;
            updateActiveFilter();
            renderOrders();
        });
    });

    // Поиск
    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderOrders();
    });

    // Создание заказа
    document.querySelector('.create-button').addEventListener('click', () => {
        openCreateOrderModal();
    });

    // Закрытие модальных окон
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeModal);
    });

    // Клик вне модального окна
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    });
}

// Обновление статистики
function updateStatistics() {
    const stats = {
        total: orders.length,
        active: orders.filter(order => order.status === 'in-progress').length,
        completed: orders.filter(order => order.status === 'completed').length,
        averageBudget: calculateAverageBudget()
    };

    document.getElementById('total-orders').textContent = stats.total;
    document.getElementById('active-orders').textContent = stats.active;
    document.getElementById('completed-orders').textContent = stats.completed;
    document.getElementById('average-budget').textContent = 
        stats.averageBudget ? `${stats.averageBudget.toLocaleString()} ₽` : '0 ₽';
}

function calculateAverageBudget() {
    const completedOrders = orders.filter(order => order.status === 'completed');
    if (completedOrders.length === 0) return 0;
    
    const totalBudget = completedOrders.reduce((sum, order) => sum + order.budget, 0);
    return Math.round(totalBudget / completedOrders.length);
}

// Рендеринг заказов
function renderOrders() {
    const tableBody = document.querySelector('.orders-table tbody');
    const filteredOrders = filterOrders();
    
    tableBody.innerHTML = filteredOrders.length ? 
        filteredOrders.map(order => createOrderRow(order)).join('') :
        '<tr><td colspan="7" class="text-center">Заказы не найдены</td></tr>';
}

function filterOrders() {
    return orders.filter(order => {
        const matchesFilter = currentFilter === 'all' || order.status === currentFilter;
        const matchesSearch = searchQuery === '' || 
            order.title.toLowerCase().includes(searchQuery) ||
            order.description.toLowerCase().includes(searchQuery);
        
        return matchesFilter && matchesSearch;
    });
}

function createOrderRow(order) {
    return `
        <tr>
            <td>${escapeHtml(order.title)}</td>
            <td>${getCategoryName(order.category)}</td>
            <td>${order.budget.toLocaleString()} ₽</td>
            <td><span class="status-badge ${order.status}">${getStatusText(order.status)}</span></td>
            <td>${new Date(order.deadline).toLocaleDateString()}</td>
            <td>${escapeHtml(order.client)}</td>
            <td class="actions">
                <button class="icon-button" onclick="viewOrder(${order.id})" title="Просмотреть">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="icon-button" onclick="editOrder(${order.id})" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-button" onclick="deleteOrder(${order.id})" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

// CRUD операции
async function createOrder(formData) {
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Ошибка создания заказа');

        const newOrder = await response.json();
        orders.push(newOrder);
        
        updateStatistics();
        renderOrders();
        closeModal();
        showNotification('Заказ успешно создан');
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('Ошибка создания заказа', 'error');
    }
}

async function updateOrder(id, formData) {
    try {
        const response = await fetch(`/api/orders/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Ошибка обновления заказа');

        const updatedOrder = await response.json();
        const index = orders.findIndex(order => order.id === id);
        orders[index] = updatedOrder;
        
        updateStatistics();
        renderOrders();
        closeModal();
        showNotification('Заказ успешно обновлен');
    } catch (error) {
        console.error('Error updating order:', error);
        showNotification('Ошибка обновления заказа', 'error');
    }
}

async function deleteOrder(id) {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;

    try {
        const response = await fetch(`/api/orders/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Ошибка удаления заказа');

        orders = orders.filter(order => order.id !== id);
        
        updateStatistics();
        renderOrders();
        showNotification('Заказ успешно удален');
    } catch (error) {
        console.error('Error deleting order:', error);
        showNotification('Ошибка удаления заказа', 'error');
    }
}

// Модальные окна
function openCreateOrderModal() {
    const modal = document.getElementById('order-modal');
    const form = modal.querySelector('form');
    
    form.reset();
    form.dataset.mode = 'create';
    document.querySelector('.modal-title').textContent = 'Создание заказа';
    
    modal.style.display = 'flex';
}

function viewOrder(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const modal = document.getElementById('view-modal');
    fillViewModal(modal, order);
    modal.style.display = 'flex';
}

function editOrder(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const modal = document.getElementById('order-modal');
    const form = modal.querySelector('form');
    
    fillOrderForm(form, order);
    form.dataset.mode = 'edit';
    form.dataset.orderId = id;
    document.querySelector('.modal-title').textContent = 'Редактирование заказа';
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Вспомогательные функции
function updateActiveFilter() {
    document.querySelectorAll('.filter-button').forEach(button => {
        button.classList.toggle('active', button.dataset.filter === currentFilter);
    });
}

function getCategoryName(id) {
    const category = categories.find(c => c.id === id);
    return category ? escapeHtml(category.name) : 'Неизвестно';
}

function getStatusText(status) {
    const statusMap = {
        'new': 'Новый',
        'in-progress': 'В работе',
        'completed': 'Завершен',
        'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Обработка форм
document.getElementById('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    if (form.dataset.mode === 'edit') {
        await updateOrder(parseInt(form.dataset.orderId), data);
    } else {
        await createOrder(data);
    }
}); 