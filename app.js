let tg = null;
let userId = null;
let currentRating = 0;
let cart = [];

// API URL
const API_URL = 'https://fish-shop-api.onrender.com';

// Инициализация Telegram
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userId = tg.initDataUnsafe.user.id;
        console.log('User ID:', userId);
        checkAdminStatus();
    }
} else {
    console.log('Режим отладки');
    userId = 12345;
}

// Загрузка при старте
document.addEventListener('DOMContentLoaded', function() {
    showMainMenu();
    loadCartFromServer();
});

// ==================== НАВИГАЦИЯ ====================

function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    menu.classList.toggle('open');
    overlay.classList.toggle('open');
}

function hideAllSections() {
    const sections = [
        'mainMenu', 'categories', 'products', 'cart', 'checkout',
        'orders', 'reviews', 'addReview', 'help', 'about', 'adminPanel', 'mailing'
    ];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function showMainMenu() {
    hideAllSections();
    document.getElementById('mainMenu').style.display = 'block';
    toggleMenu();
}

function showCategories() {
    hideAllSections();
    document.getElementById('categories').style.display = 'block';
    loadCategories();
    toggleMenu();
}

function showProducts(categoryId, categoryName) {
    hideAllSections();
    document.getElementById('products').style.display = 'block';
    document.getElementById('categoryTitle').textContent = categoryName;
    loadProducts(categoryId);
}

function showCart() {
    hideAllSections();
    document.getElementById('cart').style.display = 'block';
    loadCart();
    toggleMenu();
}

function showCheckout() {
    hideAllSections();
    document.getElementById('checkout').style.display = 'block';
}

function showOrders() {
    hideAllSections();
    document.getElementById('orders').style.display = 'block';
    loadOrders();
    toggleMenu();
}

function showReviews() {
    hideAllSections();
    document.getElementById('reviews').style.display = 'block';
    loadReviews();
    toggleMenu();
}

function showAddReview() {
    hideAllSections();
    document.getElementById('addReview').style.display = 'block';
}

function showHelp() {
    hideAllSections();
    document.getElementById('help').style.display = 'block';
    toggleMenu();
}

function showAbout() {
    hideAllSections();
    document.getElementById('about').style.display = 'block';
    toggleMenu();
}

function showAdminPanel() {
    hideAllSections();
    document.getElementById('adminPanel').style.display = 'block';
    loadAdminData();
    toggleMenu();
}

function showMailing() {
    hideAllSections();
    document.getElementById('mailing').style.display = 'block';
}

function hideCheckout() {
    showCart();
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================

async function loadCategories() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/categories`);
        const categories = await response.json();
        
        container.innerHTML = '';
        categories.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.textContent = cat.name;
            card.onclick = () => showProducts(cat.id, cat.name);
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

async function loadProducts(categoryId) {
    const container = document.getElementById('productsList');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/categories/${categoryId}/products`);
        const products = await response.json();
        
        container.innerHTML = '';
        if (products.length === 0) {
            container.innerHTML = '<div class="loading">В этой категории нет товаров</div>';
            return;
        }
        
        products.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            let tagHtml = prod.special_tag ? 
                `<span class="product-tag">✨ ${prod.special_tag}</span>` : '';
            
            card.innerHTML = `
                <div class="product-info">
                    <h3>${prod.name}</h3>
                    ${tagHtml}
                    <div class="product-price">${prod.price}₽ / ${prod.unit}</div>
                </div>
                <button class="add-to-cart-btn" onclick="addToCart(${prod.id}, '${prod.name}', ${prod.price}, '${prod.unit}')">
                    В корзину
                </button>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

// ==================== КОРЗИНА ====================

async function loadCartFromServer() {
    if (!userId) return;
    
    try {
        const response = await fetch(`${API_URL}/api/cart/${userId}`);
        const cartData = await response.json();
        
        cart = cartData.items.map(item => ({
            id: item.product_id,
            name: item.name,
            price: item.price,
            unit: item.unit,
            quantity: item.quantity,
            cart_id: item.cart_id
        }));
        
        updateCartCount();
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

async function addToCart(productId, name, price, unit) {
    if (!userId) {
        alert('Ошибка: не удалось определить пользователя');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/cart/add?user_id=${userId}&product_id=${productId}`, {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            const existingItem = cart.find(item => item.id === productId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: productId,
                    name: name,
                    price: price,
                    unit: unit,
                    quantity: 1
                });
            }
            
            updateCartCount();
            
            if (tg) {
                tg.showPopup({
                    title: '✅ Добавлено!',
                    message: `${name} добавлен в корзину`,
                    buttons: [{ type: 'ok' }]
                });
            } else {
                alert(`✅ ${name} добавлен в корзину!`);
            }
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при добавлении в корзину');
    }
}

async function loadCart() {
    if (!userId) return;
    
    const container = document.getElementById('cartItems');
    const totalElement = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/cart/${userId}`);
        const cartData = await response.json();
        
        cart = cartData.items.map(item => ({
            id: item.product_id,
            name: item.name,
            price: item.price,
            unit: item.unit,
            quantity: item.quantity,
            cart_id: item.cart_id
        }));
        
        if (cart.length === 0) {
            container.innerHTML = '<div class="loading">Корзина пуста</div>';
            totalElement.innerHTML = '';
            checkoutBtn.style.display = 'none';
            return;
        }
        
        let total = 0;
        container.innerHTML = '';
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div class="cart-item-header">
                    <span class="cart-item-name">${item.name}</span>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.cart_id})">✕</button>
                </div>
                <div class="cart-item-details">
                    <span>${item.price}₽ × ${item.quantity}</span>
                    <span>= ${itemTotal}₽</span>
                </div>
            `;
            container.appendChild(itemDiv);
        });
        
        totalElement.innerHTML = `<strong>💰 Итого: ${total} ₽</strong>`;
        checkoutBtn.style.display = 'block';
        
    } catch (error) {
        container.innerHTML = '<div class="error">Ошибка загрузки корзины</div>';
    }
}

async function removeFromCart(cartId) {
    try {
        const response = await fetch(`${API_URL}/api/cart/${cartId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        
        if (result.success) {
            cart = cart.filter(item => item.cart_id !== cartId);
            updateCartCount();
            loadCart();
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

async function clearCart() {
    if (!userId) return;
    
    if (!confirm('Очистить корзину?')) return;
    
    try {
        for (const item of cart) {
            if (item.cart_id) {
                await fetch(`${API_URL}/api/cart/${item.cart_id}`, {
                    method: 'DELETE'
                });
            }
        }
        cart = [];
        updateCartCount();
        loadCart();
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) cartCountElement.textContent = count;
}

// ==================== ЗАКАЗЫ ====================

document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    
    if (!name || !phone) {
        alert('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch(
            `${API_URL}/api/order/create?user_id=${userId}&customer_name=${encodeURIComponent(name)}&customer_phone=${encodeURIComponent(phone)}`,
            { method: 'POST' }
        );
        const result = await response.json();
        
        if (result.success) {
            if (tg) {
                tg.showPopup({
                    title: '✅ Заказ оформлен!',
                    message: `Заказ №${result.order_id}`,
                    buttons: [{ type: 'ok' }]
                });
            } else {
                alert(`✅ Заказ №${result.order_id} оформлен!`);
            }
            
            cart = [];
            updateCartCount();
            showOrders();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при оформлении заказа');
    }
});

async function loadOrders() {
    if (!userId) return;
    
    const container = document.getElementById('ordersList');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/user/${userId}/orders`);
        const orders = await response.json();
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="loading">У вас еще нет заказов</div>';
            return;
        }
        
        container.innerHTML = '';
        orders.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order-card';
            orderDiv.innerHTML = `
                <div class="order-header">
                    <span>Заказ №${order.id}</span>
                    <span class="order-status">${order.status}</span>
                </div>
                <div class="order-details">
                    <div>Дата: ${order.date}</div>
                    <div>Доставка: ${order.delivery_date}</div>
                    <div>Товаров: ${order.items.length}</div>
                    <div class="order-total">💰 ${order.total}₽</div>
                </div>
            `;
            container.appendChild(orderDiv);
        });
    } catch (error) {
        container.innerHTML = '<div class="error">Ошибка загрузки заказов</div>';
    }
}

// ==================== ОТЗЫВЫ ====================

function setRating(rating) {
    currentRating = rating;
    const stars = document.querySelectorAll('.rating-select span');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.background = '#ffd700';
            star.style.color = 'black';
        } else {
            star.style.background = 'var(--tg-theme-secondary-bg-color, #f0f0f0)';
            star.style.color = 'var(--tg-theme-text-color)';
        }
    });
}

async function submitReview() {
    if (!userId) return;
    if (!currentRating) {
        alert('Выберите оценку');
        return;
    }
    
    const text = document.getElementById('reviewText').value;
    
    try {
        const response = await fetch(
            `${API_URL}/api/review/add?user_id=${userId}&rating=${currentRating}&text=${encodeURIComponent(text)}`,
            { method: 'POST' }
        );
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Спасибо за отзыв!');
            showReviews();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при отправке отзыва');
    }
}

async function loadReviews() {
    const statsContainer = document.getElementById('reviewsStats');
    const listContainer = document.getElementById('reviewsList');
    
    try {
        const response = await fetch(`${API_URL}/api/reviews`);
        const data = await response.json();
        
        statsContainer.innerHTML = `
            <div>⭐ Всего отзывов: ${data.stats.total}</div>
            <div>📊 Средний рейтинг: ${data.stats.avg_rating}/5</div>
        `;
        
        listContainer.innerHTML = '';
        data.reviews.forEach(review => {
            const reviewDiv = document.createElement('div');
            reviewDiv.className = 'review-card';
            reviewDiv.innerHTML = `
                <div class="review-header">
                    <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
                    <span class="review-date">${review.date}</span>
                </div>
                <div class="review-author">${review.username}</div>
                <div class="review-text">${review.text || 'Без текста'}</div>
            `;
            listContainer.appendChild(reviewDiv);
        });
    } catch (error) {
        console.error('Ошибка:', error);
        statsContainer.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

// ==================== АДМИН ПАНЕЛЬ ====================

async function checkAdminStatus() {
    if (!userId) return;
    
    try {
        const response = await fetch(`${API_URL}/api/admin/check?user_id=${userId}`);
        const data = await response.json();
        
        if (data.is_admin) {
            document.getElementById('adminBtn').style.display = 'block';
            document.getElementById('adminMenuItem').style.display = 'block';
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

async function loadAdminData() {
    if (!userId) return;
    
    try {
        // Загружаем новые заказы
        const ordersResponse = await fetch(`${API_URL}/api/admin/pending-orders`);
        const orders = await ordersResponse.json();
        
        const ordersContainer = document.getElementById('adminOrdersList');
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<div class="loading">Нет новых заказов</div>';
        } else {
            ordersContainer.innerHTML = '';
            orders.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.className = 'admin-order-item';
                orderDiv.innerHTML = `
                    <div class="admin-order-header">
                        <span>Заказ №${order.id}</span>
                        <span>${order.customer_name}</span>
                    </div>
                    <div>💰 ${order.total}₽ | 📞 ${order.phone}</div>
                    <div class="admin-order-actions">
                        <button class="accept-order" onclick="acceptOrder(${order.id})">✅ Принять</button>
                        <button class="cancel-order" onclick="cancelOrder(${order.id})">❌ Отменить</button>
                    </div>
                `;
                ordersContainer.appendChild(orderDiv);
            });
        }
        
        // Загружаем отзывы на модерацию
        const reviewsResponse = await fetch(`${API_URL}/api/admin/pending-reviews`);
        const reviews = await reviewsResponse.json();
        
        const reviewsContainer = document.getElementById('adminReviewsList');
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<div class="loading">Нет отзывов на модерации</div>';
        } else {
            reviewsContainer.innerHTML = '';
            reviews.forEach(review => {
                const reviewDiv = document.createElement('div');
                reviewDiv.className = 'admin-order-item';
                reviewDiv.innerHTML = `
                    <div>⭐ ${review.rating}/5 от ${review.username}</div>
                    <div>${review.text || 'Без текста'}</div>
                    <div class="admin-order-actions">
                        <button class="accept-order" onclick="approveReview(${review.id})">✅ Одобрить</button>
                        <button class="cancel-order" onclick="deleteReview(${review.id})">❌ Удалить</button>
                    </div>
                `;
                reviewsContainer.appendChild(reviewDiv);
            });
        }
        
        // Загружаем статистику
        const statsResponse = await fetch(`${API_URL}/api/admin/stats`);
        const stats = await statsResponse.json();
        
        document.getElementById('adminStats').innerHTML = `
            <div><span>📦 Заказов:</span> <span>${stats.total_orders}</span></div>
            <div><span>💰 Выручка:</span> <span>${stats.total_revenue}₽</span></div>
            <div><span>🦐 Товаров:</span> <span>${stats.total_products}</span></div>
            <div><span>📁 Категорий:</span> <span>${stats.total_categories}</span></div>
            <div><span>⭐ Отзывов:</span> <span>${stats.total_reviews}</span></div>
            <div><span>🆕 Новых заказов:</span> <span>${stats.new_orders}</span></div>
            <div><span>✅ Принятых:</span> <span>${stats.accepted_orders}</span></div>
            <div><span>🚚 Доставленных:</span> <span>${stats.delivered_orders}</span></div>
            <div><span>❌ Отмененных:</span> <span>${stats.cancelled_orders}</span></div>
        `;
        
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

async function acceptOrder(orderId) {
    try {
        const response = await fetch(`${API_URL}/api/admin/order/${orderId}/accept`, {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            loadAdminData();
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

async function cancelOrder(orderId) {
    try {
        const response = await fetch(`${API_URL}/api/admin/order/${orderId}/cancel`, {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            loadAdminData();
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

async function approveReview(reviewId) {
    try {
        const response = await fetch(`${API_URL}/api/admin/review/${reviewId}/approve`, {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            loadAdminData();
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

async function deleteReview(reviewId) {
    try {
        const response = await fetch(`${API_URL}/api/admin/review/${reviewId}/delete`, {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            loadAdminData();
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function exportOrders() {
    window.open(`${API_URL}/api/admin/export-orders`, '_blank');
}

async function sendMailing() {
    const text = document.getElementById('mailingText').value;
    if (!text) {
        alert('Введите текст рассылки');
        return;
    }
    
    try {
        const response = await fetch(
            `${API_URL}/api/admin/mailing?text=${encodeURIComponent(text)}`,
            { method: 'POST' }
        );
        const result = await response.json();
        
        alert(`✅ Рассылка отправлена ${result.sent} пользователям`);
        showAdminPanel();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при отправке рассылки');
    }
}

// ==================== ПСЕВДОНИМЫ ====================
function viewCart() {
    showCart();
}