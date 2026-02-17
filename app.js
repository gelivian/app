// Telegram WebApp
let tg = window.Telegram.WebApp;
let userId = null;
let currentRating = 0;
let cart = [];

// API адрес
const API_URL = 'https://fish-shop-api.onrender.com';

// Инициализация
tg.ready();
tg.expand();

if (tg.initDataUnsafe?.user) {
    userId = tg.initDataUnsafe.user.id;
    console.log('Пользователь:', userId);
    checkAdmin();
    loadCart();
}

// ==================== НАВИГАЦИЯ ====================

function hideAll() {
    const pages = ['mainMenu', 'categoriesPage', 'productsPage', 'cartPage', 
                   'checkoutPage', 'ordersPage', 'reviewsPage', 'addReviewPage',
                   'helpPage', 'aboutPage', 'adminPage'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function showMainMenu() {
    hideAll();
    document.getElementById('mainMenu').style.display = 'block';
}

function showCategories() {
    hideAll();
    document.getElementById('categoriesPage').style.display = 'block';
    loadCategories();
}

function showProducts(categoryId, categoryName) {
    hideAll();
    document.getElementById('productsPage').style.display = 'block';
    document.getElementById('categoryTitle').innerText = categoryName;
    loadProducts(categoryId);
}

function goToCart() {
    hideAll();
    document.getElementById('cartPage').style.display = 'block';
    showCart();
}

function goToCheckout() {
    hideAll();
    document.getElementById('checkoutPage').style.display = 'block';
}

function showOrders() {
    hideAll();
    document.getElementById('ordersPage').style.display = 'block';
    loadOrders();
}

function showReviews() {
    hideAll();
    document.getElementById('reviewsPage').style.display = 'block';
    loadReviews();
}

function showAddReview() {
    hideAll();
    document.getElementById('addReviewPage').style.display = 'block';
}

function showHelp() {
    hideAll();
    document.getElementById('helpPage').style.display = 'block';
}

function showAbout() {
    hideAll();
    document.getElementById('aboutPage').style.display = 'block';
}

function showAdmin() {
    hideAll();
    document.getElementById('adminPage').style.display = 'block';
    loadAdminData();
}

// ==================== КАТАЛОГ ====================

async function loadCategories() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const res = await fetch(`${API_URL}/api/categories`);
        const cats = await res.json();
        
        container.innerHTML = '';
        cats.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'category-card';
            div.innerText = cat.name;
            div.onclick = () => showProducts(cat.id, cat.name);
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = '<div>Ошибка загрузки</div>';
    }
}

async function loadProducts(categoryId) {
    const container = document.getElementById('productsList');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const res = await fetch(`${API_URL}/api/categories/${categoryId}/products`);
        const products = await res.json();
        
        container.innerHTML = '';
        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.innerHTML = `
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <div class="product-price">${p.price}₽ / ${p.unit}</div>
                </div>
                <button class="add-btn" onclick="addToCart(${p.id}, '${p.name}', ${p.price}, '${p.unit}')">
                    В корзину
                </button>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = '<div>Ошибка загрузки</div>';
    }
}

// ==================== КОРЗИНА ====================

async function addToCart(id, name, price, unit) {
    if (!userId) return alert('Ошибка пользователя');
    
    try {
        const res = await fetch(`${API_URL}/api/cart/add?user_id=${userId}&product_id=${id}`, {
            method: 'POST'
        });
        const data = await res.json();
        
        if (data.success) {
            const exist = cart.find(item => item.id === id);
            if (exist) {
                exist.quantity++;
            } else {
                cart.push({ id, name, price, unit, quantity: 1 });
            }
            updateCartCount();
            tg.showPopup({ title: '✅ Готово', message: `${name} в корзине` });
        }
    } catch (e) {
        alert('Ошибка');
    }
}

async function loadCart() {
    if (!userId) return;
    
    try {
        const res = await fetch(`${API_URL}/api/cart/${userId}`);
        const data = await res.json();
        
        cart = data.items.map(item => ({
            id: item.product_id,
            name: item.name,
            price: item.price,
            unit: item.unit,
            quantity: item.quantity,
            cart_id: item.cart_id
        }));
        updateCartCount();
    } catch (e) {
        console.log('Ошибка загрузки корзины');
    }
}

function showCart() {
    const container = document.getElementById('cartList');
    const totalDiv = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="loading">Корзина пуста</div>';
        totalDiv.innerHTML = '';
        return;
    }
    
    let total = 0;
    container.innerHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <div><b>${item.name}</b></div>
                <div>${item.price}₽ × ${item.quantity} = ${itemTotal}₽</div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.cart_id})">✕</button>
        `;
        container.appendChild(div);
    });
    
    totalDiv.innerHTML = `<strong>💰 Итого: ${total}₽</strong>`;
}

async function removeFromCart(cartId) {
    try {
        await fetch(`${API_URL}/api/cart/${cartId}`, { method: 'DELETE' });
        cart = cart.filter(item => item.cart_id !== cartId);
        updateCartCount();
        showCart();
    } catch (e) {
        alert('Ошибка');
    }
}

async function clearCart() {
    if (!confirm('Очистить корзину?')) return;
    
    for (let item of cart) {
        if (item.cart_id) {
            await fetch(`${API_URL}/api/cart/${item.cart_id}`, { method: 'DELETE' });
        }
    }
    cart = [];
    updateCartCount();
    showCart();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').innerText = count;
}

// ==================== ЗАКАЗЫ ====================

async function createOrder() {
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    
    if (!name || !phone) return alert('Заполните все поля');
    
    try {
        const res = await fetch(
            `${API_URL}/api/order/create?user_id=${userId}&customer_name=${encodeURIComponent(name)}&customer_phone=${encodeURIComponent(phone)}`,
            { method: 'POST' }
        );
        const data = await res.json();
        
        if (data.success) {
            cart = [];
            updateCartCount();
            alert(`✅ Заказ №${data.order_id} оформлен`);
            showOrders();
        }
    } catch (e) {
        alert('Ошибка');
    }
}

async function loadOrders() {
    const container = document.getElementById('ordersList');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const res = await fetch(`${API_URL}/api/user/${userId}/orders`);
        const orders = await res.json();
        
        container.innerHTML = '';
        orders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'order-card';
            div.innerHTML = `
                <div><b>Заказ №${order.id}</b> - ${order.status}</div>
                <div>${order.date} | ${order.total}₽</div>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = '<div>Ошибка</div>';
    }
}

// ==================== ОТЗЫВЫ ====================

function setRating(r) {
    currentRating = r;
    document.querySelectorAll('.stars span').forEach((star, i) => {
        star.style.color = i < r ? '#ffd700' : '#ddd';
    });
}

async function submitReview() {
    if (!currentRating) return alert('Выберите оценку');
    const text = document.getElementById('reviewText').value;
    
    try {
        await fetch(
            `${API_URL}/api/review/add?user_id=${userId}&rating=${currentRating}&text=${encodeURIComponent(text)}`,
            { method: 'POST' }
        );
        alert('✅ Спасибо за отзыв!');
        showReviews();
    } catch (e) {
        alert('Ошибка');
    }
}

async function loadReviews() {
    const container = document.getElementById('reviewsList');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const res = await fetch(`${API_URL}/api/reviews`);
        const data = await res.json();
        
        container.innerHTML = '';
        data.reviews.forEach(r => {
            const div = document.createElement('div');
            div.className = 'review-card';
            div.innerHTML = `
                <div><b>${'⭐'.repeat(r.rating)}</b> ${r.username}</div>
                <div>${r.text || 'Без текста'}</div>
                <div style="font-size:12px;color:#666">${r.date}</div>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = '<div>Ошибка</div>';
    }
}

// ==================== АДМИН ====================

async function checkAdmin() {
    try {
        const res = await fetch(`${API_URL}/api/admin/check?user_id=${userId}`);
        const data = await res.json();
        if (data.is_admin) {
            document.getElementById('adminBtn').style.display = 'block';
        }
    } catch (e) {}
}

async function loadAdminData() {
    const ordersDiv = document.getElementById('adminOrders');
    const reviewsDiv = document.getElementById('adminReviews');
    const statsDiv = document.getElementById('adminStats');
    
    try {
        const [orders, reviews, stats] = await Promise.all([
            fetch(`${API_URL}/api/admin/pending-orders`).then(r => r.json()),
            fetch(`${API_URL}/api/admin/pending-reviews`).then(r => r.json()),
            fetch(`${API_URL}/api/admin/stats`).then(r => r.json())
        ]);
        
        ordersDiv.innerHTML = '<h3>📦 Новые заказы</h3>' + 
            orders.map(o => `
                <div class="admin-section">
                    <div>Заказ №${o.id} - ${o.customer_name}</div>
                    <div>${o.total}₽ | ${o.phone}</div>
                    <div class="admin-actions">
                        <button class="accept" onclick="acceptOrder(${o.id})">✅ Принять</button>
                        <button class="reject" onclick="rejectOrder(${o.id})">❌ Отклонить</button>
                    </div>
                </div>
            `).join('');
        
        reviewsDiv.innerHTML = '<h3>⭐ Отзывы</h3>' +
            reviews.map(r => `
                <div class="admin-section">
                    <div>${'⭐'.repeat(r.rating)} от ${r.username}</div>
                    <div>${r.text || 'Нет текста'}</div>
                    <div class="admin-actions">
                        <button class="accept" onclick="approveReview(${r.id})">✅ OK</button>
                        <button class="reject" onclick="deleteReview(${r.id})">❌ Удалить</button>
                    </div>
                </div>
            `).join('');
        
        statsDiv.innerHTML = '<h3>📊 Статистика</h3>' +
            `<div class="admin-section">
                <div>📦 Заказов: ${stats.total_orders}</div>
                <div>💰 Выручка: ${stats.total_revenue}₽</div>
                <div>🦐 Товаров: ${stats.total_products}</div>
            </div>`;
    } catch (e) {}
}

async function acceptOrder(id) {
    await fetch(`${API_URL}/api/admin/order/${id}/accept`, { method: 'POST' });
    loadAdminData();
}

async function rejectOrder(id) {
    await fetch(`${API_URL}/api/admin/order/${id}/cancel`, { method: 'POST' });
    loadAdminData();
}

async function approveReview(id) {
    await fetch(`${API_URL}/api/admin/review/${id}/approve`, { method: 'POST' });
    loadAdminData();
}

async function deleteReview(id) {
    await fetch(`${API_URL}/api/admin/review/${id}/delete`, { method: 'POST' });
    loadAdminData();
}

// Старт
showMainMenu();