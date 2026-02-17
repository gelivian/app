// Telegram WebApp
let tg = window.Telegram.WebApp;
let userId = null;
let currentRating = 0;
let cart = [];
let currentCategoryId = null;
let currentCategoryName = '';
let currentEditProduct = null;

// API адрес
const API_URL = 'https://fish-shop-api.onrender.com';

// Инициализация
tg.ready();
tg.expand();

if (tg.initDataUnsafe?.user) {
    userId = tg.initDataUnsafe.user.id;
    console.log('👤 Пользователь:', userId);
    checkAdmin();
    loadCart();
}

// ==================== НАВИГАЦИЯ ====================

function hideAll() {
    const pages = [
        'mainMenu', 'categoriesPage', 'productsPage', 'productDetailPage',
        'cartPage', 'checkoutPage', 'ordersPage', 'reviewsPage', 
        'addReviewPage', 'helpPage', 'aboutPage', 'adminPage'
    ];
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
    currentCategoryId = categoryId;
    currentCategoryName = categoryName;
    hideAll();
    document.getElementById('productsPage').style.display = 'block';
    document.getElementById('categoryTitle').innerText = categoryName;
    loadProducts(categoryId);
}

function showProductDetail(productId) {
    hideAll();
    document.getElementById('productDetailPage').style.display = 'block';
    loadProductDetail(productId);
}

function goToCart() {
    hideAll();
    document.getElementById('cartPage').style.display = 'block';
    displayCart();
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
    resetRating();
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

function showEditProducts() {
    document.getElementById('editProductsSection').style.display = 'block';
    document.getElementById('editProductForm').style.display = 'none';
    loadProductsForEdit();
}

function hideEditProducts() {
    document.getElementById('editProductsSection').style.display = 'none';
}

function showEditForm(product) {
    currentEditProduct = product;
    document.getElementById('editProductTitle').innerText = `✏ РЕДАКТИРОВАНИЕ: ${product.name}`;
    document.getElementById('editName').value = product.name || '';
    document.getElementById('editDescription').value = product.description || '';
    document.getElementById('editFullDescription').value = product.full_description || '';
    document.getElementById('editPrice').value = product.price || '';
    document.getElementById('editUnit').value = product.unit || '';
    document.getElementById('editWeight').value = product.weight_info || '';
    document.getElementById('editOrigin').value = product.origin || '';
    document.getElementById('editTag').value = product.special_tag || '';
    
    document.getElementById('editProductsSection').style.display = 'none';
    document.getElementById('editProductForm').style.display = 'block';
}

function cancelEdit() {
    document.getElementById('editProductForm').style.display = 'none';
    document.getElementById('editProductsSection').style.display = 'block';
    currentEditProduct = null;
}

// ==================== КАТАЛОГ ====================

async function loadCategories() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/categories`);
        const categories = await response.json();
        
        container.innerHTML = '';
        categories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'category-card';
            div.innerText = cat.name;
            div.onclick = () => showProducts(cat.id, cat.name);
            container.appendChild(div);
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
        
        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.onclick = () => showProductDetail(p.id);
            
            let tagHtml = p.special_tag ? 
                `<span class="product-tag">✨ ${p.special_tag}</span>` : '';
            
            div.innerHTML = `
                <div class="product-info">
                    <h3>${p.name}</h3>
                    ${tagHtml}
                    <div class="product-price">${p.price}₽ / ${p.unit}</div>
                </div>
                <button class="add-btn" onclick="event.stopPropagation(); addToCart(${p.id}, '${p.name}', ${p.price}, '${p.unit}')">
                    В корзину
                </button>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        container.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

async function loadProductDetail(productId) {
    const container = document.getElementById('productDetail');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/product/${productId}`);
        const p = await response.json();
        
        let photos = '';
        if (p.photos && p.photos.length > 0) {
            photos = `<img src="${p.photos[0].photo_id}" class="product-image" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">`;
        } else {
            photos = '<div class="product-image">🦐</div>';
        }
        
        let tagHtml = p.special_tag ? 
            `<span class="product-tag">✨ ${p.special_tag}</span>` : '';
        
        let preorderHtml = p.is_preorder ? 
            '<div class="product-tag" style="background:#3390ec; color:white;">⏳ ПОД ЗАКАЗ</div>' : '';
        
        container.innerHTML = `
            ${photos}
            <h2>${p.name} ${tagHtml}</h2>
            <div class="price">${p.price}₽ / ${p.unit}</div>
            ${preorderHtml}
            
            <div class="product-description">
                <p>${p.description || 'Нет описания'}</p>
            </div>
            
            ${p.full_description ? `
                <div class="product-full-desc">
                    <p>${p.full_description}</p>
                </div>
            ` : ''}
            
            <div class="product-meta">
                ${p.weight_info ? `
                    <div class="meta-item">
                        <span>⚖️ Вес</span>
                        ${p.weight_info}
                    </div>
                ` : ''}
                ${p.origin ? `
                    <div class="meta-item">
                        <span>📍 Происхождение</span>
                        ${p.origin}
                    </div>
                ` : ''}
            </div>
            
            <button class="big-btn" onclick="addToCart(${p.id}, '${p.name}', ${p.price}, '${p.unit}')">
                🛒 ДОБАВИТЬ В КОРЗИНУ
            </button>
        `;
    } catch (error) {
        container.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

// ==================== КОРЗИНА ====================

async function addToCart(id, name, price, unit) {
    if (!userId) return alert('Ошибка пользователя');
    
    try {
        const response = await fetch(`${API_URL}/api/cart/add?user_id=${userId}&product_id=${id}`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            const exist = cart.find(item => item.id === id);
            if (exist) {
                exist.quantity++;
            } else {
                cart.push({ id, name, price, unit, quantity: 1 });
            }
            updateCartCount();
            
            tg.showPopup({
                title: '✅ Добавлено!',
                message: `${name} добавлен в корзину`,
                buttons: [{ type: 'ok' }]
            });
        }
    } catch (error) {
        alert('Ошибка при добавлении');
    }
}

async function loadCart() {
    if (!userId) return;
    
    try {
        const response = await fetch(`${API_URL}/api/cart/${userId}`);
        const data = await response.json();
        
        cart = data.items.map(item => ({
            id: item.product_id,
            name: item.name,
            price: item.price,
            unit: item.unit,
            quantity: item.quantity,
            cart_id: item.cart_id
        }));
        updateCartCount();
    } catch (error) {
        console.log('Ошибка загрузки корзины');
    }
}

function displayCart() {
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
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price}₽ × ${item.quantity} = ${itemTotal}₽</div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.cart_id})">✕</button>
        `;
        container.appendChild(div);
    });
    
    totalDiv.innerHTML = `<strong>💰 Итого: ${total} ₽</strong>`;
}

async function removeFromCart(cartId) {
    try {
        const response = await fetch(`${API_URL}/api/cart/${cartId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
            cart = cart.filter(item => item.cart_id !== cartId);
            updateCartCount();
            displayCart();
        }
    } catch (error) {
        alert('Ошибка удаления');
    }
}

async function clearCart() {
    if (!confirm('Очистить корзину?')) return;
    
    try {
        for (let item of cart) {
            if (item.cart_id) {
                await fetch(`${API_URL}/api/cart/${item.cart_id}`, {
                    method: 'DELETE'
                });
            }
        }
        cart = [];
        updateCartCount();
        displayCart();
    } catch (error) {
        alert('Ошибка');
    }
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').innerText = count;
}

// ==================== ЗАКАЗЫ ====================

async function createOrder() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    
    if (!name || !phone) {
        alert('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch(
            `${API_URL}/api/order/create?user_id=${userId}&customer_name=${encodeURIComponent(name)}&customer_phone=${encodeURIComponent(phone)}`,
            { method: 'POST' }
        );
        const data = await response.json();
        
        if (data.success) {
            cart = [];
            updateCartCount();
            
            tg.showPopup({
                title: '✅ Заказ оформлен!',
                message: `Ваш заказ №${data.order_id}`,
                buttons: [{ type: 'ok' }]
            });
            
            showOrders();
        }
    } catch (error) {
        alert('Ошибка оформления заказа');
    }
}

async function loadOrders() {
    const container = document.getElementById('ordersList');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/user/${userId}/orders`);
        const orders = await response.json();
        
        container.innerHTML = '';
        if (orders.length === 0) {
            container.innerHTML = '<div class="loading">У вас еще нет заказов</div>';
            return;
        }
        
        orders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'order-card';
            
            let itemsHtml = '';
            if (order.items && order.items.length > 0) {
                itemsHtml = '<div class="order-products">';
                order.items.forEach(item => {
                    itemsHtml += `<div class="order-product-item">${item.name} - ${item.quantity} × ${item.price}₽ = ${item.total}₽</div>`;
                });
                itemsHtml += '</div>';
            }
            
            div.innerHTML = `
                <div class="order-header">
                    <span>Заказ №${order.id}</span>
                    <span class="order-status">${order.status}</span>
                </div>
                <div>Дата: ${order.date}</div>
                <div>Доставка: ${order.delivery_date}</div>
                ${itemsHtml}
                <div class="order-total">💰 ${order.total}₽</div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        container.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

// ==================== ОТЗЫВЫ ====================

function setRating(r) {
    currentRating = r;
    document.querySelectorAll('.stars span').forEach((star, i) => {
        if (i < r) {
            star.style.color = '#ffd700';
            star.classList.add('selected');
        } else {
            star.style.color = '#ddd';
            star.classList.remove('selected');
        }
    });
}

function resetRating() {
    currentRating = 0;
    document.querySelectorAll('.stars span').forEach(star => {
        star.style.color = '#ddd';
        star.classList.remove('selected');
    });
    document.getElementById('reviewText').value = '';
}

async function submitReview() {
    if (!currentRating) {
        alert('Выберите оценку');
        return;
    }
    
    const text = document.getElementById('reviewText').value.trim();
    
    try {
        const response = await fetch(
            `${API_URL}/api/review/add?user_id=${userId}&rating=${currentRating}&text=${encodeURIComponent(text)}`,
            { method: 'POST' }
        );
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Спасибо за отзыв!');
            showReviews();
        }
    } catch (error) {
        alert('Ошибка при отправке');
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
        if (data.reviews.length === 0) {
            listContainer.innerHTML = '<div class="loading">Пока нет отзывов</div>';
            return;
        }
        
        data.reviews.forEach(r => {
            const div = document.createElement('div');
            div.className = 'review-card';
            div.innerHTML = `
                <div class="review-header">
                    <span class="review-rating">${'⭐'.repeat(r.rating)}</span>
                    <span class="review-date">${r.date}</span>
                </div>
                <div class="review-author">${r.username}</div>
                <div class="review-text">${r.text || 'Без текста'}</div>
            `;
            listContainer.appendChild(div);
        });
    } catch (error) {
        statsContainer.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

// ==================== АДМИН ПАНЕЛЬ ====================

async function checkAdmin() {
    try {
        const response = await fetch(`${API_URL}/api/admin/check?user_id=${userId}`);
        const data = await response.json();
        if (data.is_admin) {
            document.getElementById('adminBtn').style.display = 'block';
        }
    } catch (error) {}
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
        
        // Статистика
        statsDiv.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.total_orders || 0}</div>
                <div class="stat-label">Всего заказов</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.total_revenue || 0}₽</div>
                <div class="stat-label">Выручка</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.total_products || 0}</div>
                <div class="stat-label">Товаров</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.total_categories || 0}</div>
                <div class="stat-label">Категорий</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.total_reviews || 0}</div>
                <div class="stat-label">Отзывов</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.new_orders || 0}</div>
                <div class="stat-label">Новых</div>
            </div>
        `;
        
        // Новые заказы
        if (orders.length === 0) {
            ordersDiv.innerHTML = '<div class="loading">Нет новых заказов</div>';
        } else {
            ordersDiv.innerHTML = orders.map(o => `
                <div class="order-item">
                    <div class="order-header">
                        <span>Заказ №${o.id}</span>
                        <span>${o.customer_name}</span>
                    </div>
                    <div>📞 ${o.phone}</div>
                    <div>💰 ${o.total}₽</div>
                    <div>📅 ${o.date}</div>
                    <div class="admin-actions">
                        <button class="accept-btn" onclick="acceptOrder(${o.id})">✅ Принять</button>
                        <button class="reject-btn" onclick="rejectOrder(${o.id})">❌ Отклонить</button>
                    </div>
                </div>
            `).join('');
        }
        
        // Отзывы на модерацию
        if (reviews.length === 0) {
            reviewsDiv.innerHTML = '<div class="loading">Нет отзывов на модерации</div>';
        } else {
            reviewsDiv.innerHTML = reviews.map(r => `
                <div class="order-item">
                    <div class="order-header">
                        <span>${'⭐'.repeat(r.rating)}</span>
                        <span>${r.username}</span>
                    </div>
                    <div>${r.text || 'Без текста'}</div>
                    <div>📅 ${r.date}</div>
                    <div class="admin-actions">
                        <button class="accept-btn" onclick="approveReview(${r.id})">✅ Одобрить</button>
                        <button class="reject-btn" onclick="deleteReview(${r.id})">❌ Удалить</button>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки админ данных:', error);
    }
}

async function acceptOrder(id) {
    try {
        await fetch(`${API_URL}/api/admin/order/${id}/accept`, { method: 'POST' });
        loadAdminData();
    } catch (error) {}
}

async function rejectOrder(id) {
    try {
        await fetch(`${API_URL}/api/admin/order/${id}/cancel`, { method: 'POST' });
        loadAdminData();
    } catch (error) {}
}

async function approveReview(id) {
    try {
        await fetch(`${API_URL}/api/admin/review/${id}/approve`, { method: 'POST' });
        loadAdminData();
    } catch (error) {}
}

async function deleteReview(id) {
    try {
        await fetch(`${API_URL}/api/admin/review/${id}/delete`, { method: 'POST' });
        loadAdminData();
    } catch (error) {}
}

// ==================== УПРАВЛЕНИЕ ТОВАРАМИ ====================

async function exportProducts() {
    window.open(`${API_URL}/api/admin/export-products`, '_blank');
}

async function exportOrders() {
    window.open(`${API_URL}/api/admin/export-orders`, '_blank');
}

function importProducts() {
    document.getElementById('importFile').click();
}

async function uploadImportFile() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    if (!file) return;
    
    const statusDiv = document.getElementById('importStatus');
    statusDiv.className = 'import-status';
    statusDiv.innerText = '⏳ Загрузка файла...';
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_URL}/api/admin/import-products`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        
        if (result.success) {
            statusDiv.className = 'import-status success';
            statusDiv.innerText = `✅ Импорт завершен! Добавлено: ${result.added}, Обновлено: ${result.updated}`;
        } else {
            statusDiv.className = 'import-status error';
            statusDiv.innerText = `❌ Ошибка: ${result.error}`;
        }
    } catch (error) {
        statusDiv.className = 'import-status error';
        statusDiv.innerText = '❌ Ошибка импорта';
    }
    
    fileInput.value = '';
}

async function loadProductsForEdit() {
    const container = document.getElementById('productsEditList');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/admin/products`);
        const products = await response.json();
        
        container.innerHTML = '';
        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-edit-item';
            div.onclick = () => showEditForm(p);
            div.innerHTML = `
                <div class="product-edit-info">
                    <h4>${p.name}</h4>
                    <div class="product-edit-price">${p.price}₽ / ${p.unit}</div>
                </div>
                <div class="edit-icon">✏️</div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        container.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

async function saveProduct() {
    if (!currentEditProduct) return;
    
    const updatedProduct = {
        id: currentEditProduct.id,
        name: document.getElementById('editName').value.trim(),
        description: document.getElementById('editDescription').value.trim(),
        full_description: document.getElementById('editFullDescription').value.trim(),
        price: parseInt(document.getElementById('editPrice').value) || 0,
        unit: document.getElementById('editUnit').value.trim(),
        weight_info: document.getElementById('editWeight').value.trim(),
        origin: document.getElementById('editOrigin').value.trim(),
        special_tag: document.getElementById('editTag').value.trim()
    };
    
    try {
        const response = await fetch(`${API_URL}/api/admin/product/${currentEditProduct.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct)
        });
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Товар обновлен');
            cancelEdit();
            loadProductsForEdit();
        } else {
            alert('❌ Ошибка обновления');
        }
    } catch (error) {
        alert('❌ Ошибка');
    }
}

// Старт
showMainMenu();