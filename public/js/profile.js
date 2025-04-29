// Состояние
let currentUser = null;
let isEditMode = false;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initializeProfile();
});

async function initializeProfile() {
    try {
        await loadUserProfile();
        setupEventListeners();
        renderProfile();
    } catch (error) {
        console.error('Error initializing profile:', error);
        showNotification('Ошибка загрузки профиля', 'error');
    }
}

// Загрузка данных
async function loadUserProfile() {
    try {
        const response = await fetch('/api/profile');
        if (!response.ok) throw new Error('Failed to load profile');
        currentUser = await response.json();
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Ошибка загрузки профиля', 'error');
    }
}

// Обработчики событий
function setupEventListeners() {
    // Кнопка редактирования
    document.getElementById('edit-profile-btn').addEventListener('click', () => {
        toggleEditMode();
    });

    // Форма профиля
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateProfile(new FormData(e.target));
    });

    // Загрузка аватара
    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarUpload);
    }

    // Переключение типа аккаунта
    const accountTypeInputs = document.querySelectorAll('input[name="accountType"]');
    accountTypeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            toggleAccountTypeFields(e.target.value);
        });
    });
}

// Рендеринг профиля
function renderProfile() {
    if (!currentUser) return;

    // Основная информация
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-phone').textContent = currentUser.phone || 'Не указан';
    
    // Аватар
    const avatarImg = document.getElementById('profile-avatar');
    if (avatarImg) {
        avatarImg.src = currentUser.avatar || '/assets/images/default-avatar.png';
        avatarImg.alt = `${currentUser.name}'s avatar`;
    }

    // Тип аккаунта
    const accountTypeLabel = document.getElementById('account-type-label');
    if (accountTypeLabel) {
        accountTypeLabel.textContent = getAccountTypeLabel(currentUser.accountType);
    }

    // Специфичные поля для типа аккаунта
    renderAccountTypeFields();

    // Статистика
    renderStatistics();
}

function renderAccountTypeFields() {
    const container = document.getElementById('account-specific-fields');
    if (!container || !currentUser) return;

    let html = '';
    
    if (currentUser.accountType === 'influencer') {
        html = `
            <div class="field">
                <label>Подписчики:</label>
                <span>${currentUser.followers?.toLocaleString() || 0}</span>
            </div>
            <div class="field">
                <label>Платформы:</label>
                <div class="platforms">
                    ${renderPlatforms(currentUser.platforms)}
                </div>
            </div>
            <div class="field">
                <label>Категории:</label>
                <div class="categories">
                    ${renderCategories(currentUser.categories)}
                </div>
            </div>
        `;
    } else if (currentUser.accountType === 'brand') {
        html = `
            <div class="field">
                <label>Компания:</label>
                <span>${escapeHtml(currentUser.company || '')}</span>
            </div>
            <div class="field">
                <label>Сайт:</label>
                <a href="${escapeHtml(currentUser.website || '')}" target="_blank" rel="noopener">
                    ${escapeHtml(currentUser.website || '')}
                </a>
            </div>
            <div class="field">
                <label>Интересующие категории:</label>
                <div class="categories">
                    ${renderCategories(currentUser.targetCategories)}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderPlatforms(platforms = []) {
    return platforms.map(platform => `
        <div class="platform">
            <i class="fab fa-${platform.icon}"></i>
            <span>${escapeHtml(platform.name)}</span>
            <a href="${escapeHtml(platform.url)}" target="_blank" rel="noopener">
                ${escapeHtml(platform.username)}
            </a>
        </div>
    `).join('');
}

function renderCategories(categories = []) {
    return categories.map(category => `
        <span class="category-badge">${escapeHtml(category)}</span>
    `).join('');
}

function renderStatistics() {
    const stats = document.getElementById('profile-stats');
    if (!stats || !currentUser) return;

    const statsData = currentUser.accountType === 'influencer' ? 
        getInfluencerStats() : getBrandStats();

    stats.innerHTML = statsData.map(stat => `
        <div class="stat-card">
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        </div>
    `).join('');
}

// Редактирование профиля
function toggleEditMode() {
    isEditMode = !isEditMode;
    const form = document.getElementById('profile-form');
    const viewMode = document.getElementById('profile-view');
    
    if (isEditMode) {
        fillFormData();
        form.style.display = 'block';
        viewMode.style.display = 'none';
        document.getElementById('edit-profile-btn').textContent = 'Отменить';
    } else {
        form.style.display = 'none';
        viewMode.style.display = 'block';
        document.getElementById('edit-profile-btn').textContent = 'Редактировать';
    }
}

function fillFormData() {
    if (!currentUser) return;

    const form = document.getElementById('profile-form');
    
    // Основная информация
    form.elements.name.value = currentUser.name || '';
    form.elements.email.value = currentUser.email || '';
    form.elements.phone.value = currentUser.phone || '';
    
    // Тип аккаунта
    const accountTypeInput = form.querySelector(`input[name="accountType"][value="${currentUser.accountType}"]`);
    if (accountTypeInput) {
        accountTypeInput.checked = true;
    }

    // Специфичные поля
    fillAccountTypeFields(form);
}

function fillAccountTypeFields(form) {
    if (currentUser.accountType === 'influencer') {
        form.elements.followers.value = currentUser.followers || '';
        
        // Платформы
        const platformsContainer = form.querySelector('.platforms-container');
        if (platformsContainer && currentUser.platforms) {
            currentUser.platforms.forEach(platform => {
                addPlatformFields(platformsContainer, platform);
            });
        }
        
        // Категории
        if (form.elements.categories) {
            currentUser.categories?.forEach(category => {
                const option = form.querySelector(`option[value="${category}"]`);
                if (option) option.selected = true;
            });
        }
    } else if (currentUser.accountType === 'brand') {
        form.elements.company.value = currentUser.company || '';
        form.elements.website.value = currentUser.website || '';
        
        // Целевые категории
        if (form.elements.targetCategories) {
            currentUser.targetCategories?.forEach(category => {
                const option = form.querySelector(`option[value="${category}"]`);
                if (option) option.selected = true;
            });
        }
    }
}

async function updateProfile(formData) {
    try {
        const data = Object.fromEntries(formData.entries());
        
        // Обработка массивов
        if (data.accountType === 'influencer') {
            data.platforms = getPlatformsData();
            data.categories = Array.from(formData.getAll('categories'));
        } else if (data.accountType === 'brand') {
            data.targetCategories = Array.from(formData.getAll('targetCategories'));
        }

        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to update profile');

        currentUser = await response.json();
        toggleEditMode();
        renderProfile();
        showNotification('Профиль успешно обновлен');
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Ошибка обновления профиля', 'error');
    }
}

// Загрузка аватара
async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('/api/profile/avatar', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to upload avatar');

        const result = await response.json();
        currentUser.avatar = result.avatarUrl;
        
        document.getElementById('profile-avatar').src = currentUser.avatar;
        showNotification('Аватар успешно обновлен');
    } catch (error) {
        console.error('Error uploading avatar:', error);
        showNotification('Ошибка загрузки аватара', 'error');
    }
}

// Вспомогательные функции
function getAccountTypeLabel(type) {
    const types = {
        'influencer': 'Блогер',
        'brand': 'Бренд'
    };
    return types[type] || type;
}

function toggleAccountTypeFields(accountType) {
    const influencerFields = document.getElementById('influencer-fields');
    const brandFields = document.getElementById('brand-fields');
    
    if (influencerFields && brandFields) {
        if (accountType === 'influencer') {
            influencerFields.style.display = 'block';
            brandFields.style.display = 'none';
        } else {
            influencerFields.style.display = 'none';
            brandFields.style.display = 'block';
        }
    }
}

function getPlatformsData() {
    const platforms = [];
    document.querySelectorAll('.platform-fields').forEach(field => {
        platforms.push({
            name: field.querySelector('[name="platformName"]').value,
            icon: field.querySelector('[name="platformIcon"]').value,
            username: field.querySelector('[name="platformUsername"]').value,
            url: field.querySelector('[name="platformUrl"]').value
        });
    });
    return platforms;
}

function getInfluencerStats() {
    return [
        {
            label: 'Выполнено заказов',
            value: currentUser.completedOrders || 0
        },
        {
            label: 'Активных заказов',
            value: currentUser.activeOrders || 0
        },
        {
            label: 'Средний рейтинг',
            value: (currentUser.rating || 0).toFixed(1)
        },
        {
            label: 'Подписчиков',
            value: (currentUser.followers || 0).toLocaleString()
        }
    ];
}

function getBrandStats() {
    return [
        {
            label: 'Размещено заказов',
            value: currentUser.totalOrders || 0
        },
        {
            label: 'Активных заказов',
            value: currentUser.activeOrders || 0
        },
        {
            label: 'Бюджет заказов',
            value: `${(currentUser.totalBudget || 0).toLocaleString()} ₽`
        },
        {
            label: 'Блогеров привлечено',
            value: currentUser.totalInfluencers || 0
        }
    ];
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

// Функция для сохранения данных
function handleSave() {
    // Проверяем валидность формы
    const form = document.getElementById('profile-form');
    if (!form.checkValidity()) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }

    // Собираем все данные из формы
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        telegram: document.getElementById('telegram').value,
        role: document.getElementById('role').value,
        description: document.getElementById('description').value,
        audience: document.getElementById('audience').value,
        price: document.getElementById('price').value,
        company: document.getElementById('company').value,
        website: document.getElementById('website').value,
        categories: Array.from(document.querySelectorAll('input[name="categories"]:checked'))
            .map(checkbox => checkbox.value),
        isRegistered: true
    };

    try {
        // Сохраняем в localStorage
        localStorage.setItem('userData', JSON.stringify(formData));
        
        // Показываем уведомление об успехе
        alert('Профиль успешно сохранен!');
        
        // Если открыто в Telegram WebApp
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.MainButton.setText('Профиль сохранен');
            window.Telegram.WebApp.MainButton.show();
            setTimeout(() => {
                window.Telegram.WebApp.MainButton.hide();
            }, 2000);
        }
        
        // Перезагружаем страницу
        window.location.reload();
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Произошла ошибка при сохранении профиля');
    }
}

// Функция для загрузки данных
function loadProfileData() {
    try {
        const savedData = localStorage.getItem('userData');
        if (savedData) {
            const data = JSON.parse(savedData);

            // Заполняем все поля
            document.getElementById('name').value = data.name || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('phone').value = data.phone || '';
            document.getElementById('telegram').value = data.telegram || '';
            document.getElementById('role').value = data.role || 'blogger';
            document.getElementById('description').value = data.description || '';
            document.getElementById('audience').value = data.audience || '';
            document.getElementById('price').value = data.price || '';
            document.getElementById('company').value = data.company || '';
            document.getElementById('website').value = data.website || '';

            // Отмечаем категории
            if (data.categories && Array.isArray(data.categories)) {
                document.querySelectorAll('input[name="categories"]').forEach(checkbox => {
                    checkbox.checked = data.categories.includes(checkbox.value);
                });
            }

            // Показываем/скрываем поля в зависимости от роли
            toggleRoleFields(data.role);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Функция переключения полей в зависимости от роли
function toggleRoleFields(role) {
    const bloggerFields = document.querySelector('.blogger-fields');
    const brandFields = document.querySelector('.brand-fields');

    if (role === 'blogger') {
        bloggerFields.style.display = 'block';
        brandFields.style.display = 'none';
    } else {
        bloggerFields.style.display = 'none';
        brandFields.style.display = 'block';
    }
}

// Обработчик изменения роли
document.getElementById('role').addEventListener('change', function(e) {
    toggleRoleFields(e.target.value);
});

// Загружаем данные при загрузке страницы
window.addEventListener('load', function() {
    loadProfileData();
    
    // Интеграция с Telegram WebApp
    if (window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        webApp.ready();
        
        if (webApp.colorScheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }
});

// Обработчики для сворачивания клавиатуры
document.querySelectorAll('input, textarea, select').forEach(element => {
    element.addEventListener('blur', function() {
        window.scrollTo(0, 0);
    });
});

// Сворачиваем клавиатуру при тапе вне полей ввода
document.addEventListener('click', function(e) {
    if (!e.target.matches('input, textarea, select, label')) {
        document.activeElement.blur();
    }
}); 