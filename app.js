let tg = null;
let userId = null;

// Адрес вашего API (нужно будет заменить на реальный)
const API_URL = 'http://localhost:8000'; // Для теста локально
// Когда запустите на сервере: const API_URL = 'https://ваш-сервер.com';

// Проверяем, открыто ли приложение в Telegram
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userId = tg.initDataUnsafe.user.id;
        console.log('User ID:', userId);
    }
} else {
    console.log('Приложение открыто вне Telegram (режим отладки)');
    userId = 12345; // Тестовый ID
}

// Загружаем категории при старте
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
});

// Загрузка категорий с сервера
async function loadCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/categories`);
        const categories = await response.json();
        
        container.innerHTML = '';
        
        categories.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.textContent = cat.name;
            card.onclick = () => loadProducts(cat.id, cat.name);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        container.innerHTML = '<div class="loading">Ошибка загрузки. Проверьте подключение к серверу.</div>';
    }
}

// Загрузка товаров с сервера
async function loadProducts(categoryId, categoryName) {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/categories/${categoryId}/products`);
        const products = await response.json();
        
        container.innerHTML = '';
        
        if (products.length === 0) {
            container.innerHTML = '<p class="loading">В этой категории пока нет товаров</p>';
        } else {
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
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        container.innerHTML = '<div class="loading">Ошибка загрузки. Проверьте подключение к серверу.</div>';
    }
    
    const titleElement = document.getElementById('categoryTitle');
    if (titleElement) titleElement.textContent = categoryName;
    
    document.getElementById('categories').style.display = 'none';
    document.getElementById('products').style.display = 'block';
    document.getElementById('cart').style.display = 'none';
    document.getElementById('checkout').style.display = 'none';
}

// Добавление в корзину
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
            // Добавляем в локальную корзину для отображения
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
        console.error('Ошибка добавления в корзину:', error);
        alert('Ошибка при добавлении в корзину');
    }
}

// Просмотр корзины
async function viewCart() {
    if (!userId) return;
    
    const container = document.getElementById('cartItems');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/cart/${userId}`);
        const cartData = await response.json();
        
        container.innerHTML = '';
        
        if (cartData.items.length === 0) {
            container.innerHTML = '<p class="loading">Корзина пуста</p>';
            document.getElementById('checkoutBtn').style.display = 'none';
            document.getElementById('cartTotal').innerHTML = '';
        } else {
            let total = 0;
            
            cartData.items.forEach(item => {
                total += item.total;
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'cart-item';
                itemDiv.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">
                            ${item.price}₽ × ${item.quantity} = ${item.total}₽
                        </div>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.cart_id})">✕</button>
                `;
                container.appendChild(itemDiv);
            });
            
            document.getElementById('cartTotal').innerHTML = `<strong>Итого: ${total}₽</strong>`;
            document.getElementById('checkoutBtn').style.display = 'block';
        }
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        container.innerHTML = '<div class="loading">Ошибка загрузки корзины</div>';
    }
    
    document.getElementById('categories').style.display = 'none';
    document.getElementById('products').style.display = 'none';
    document.getElementById('cart').style.display = 'block';
    document.getElementById('checkout').style.display = 'none';
}

// Удаление из корзины
async function removeFromCart(cartId) {
    try {
        const response = await fetch(`${API_URL}/api/cart/${cartId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        
        if (result.success) {
            viewCart(); // Перезагружаем корзину
            updateCartCount();
        }
    } catch (error) {
        console.error('Ошибка удаления из корзины:', error);
    }
}

// Обновление счетчика корзины
async function updateCartCount() {
    if (!userId) return;
    
    try {
        const response = await fetch(`${API_URL}/api/cart/${userId}`);
        const cartData = await response.json();
        const count = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) cartCountElement.textContent = count;
    } catch (error) {
        console.error('Ошибка обновления счетчика:', error);
    }
}

// Оформление заказа
function checkout() {
    document.getElementById('cart').style.display = 'none';
    document.getElementById('checkout').style.display = 'block';
}

// Отправка формы заказа
const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('customerName').value;
        const phone = document.getElementById('customerPhone').value;
        
        if (!name || !phone) {
            if (tg) {
                tg.showAlert('Заполните все поля');
            } else {
                alert('Заполните все поля');
            }
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
                        message: `Спасибо, ${name}! Ваш заказ №${result.order_id}`,
                        buttons: [{ type: 'ok' }]
                    });
                } else {
                    alert(`✅ Спасибо, ${name}! Заказ №${result.order_id} оформлен.`);
                }
                
                // Очищаем форму
                document.getElementById('customerName').value = '';
                document.getElementById('customerPhone').value = '';
                
                updateCartCount();
                showCategories();
            }
        } catch (error) {
            console.error('Ошибка оформления заказа:', error);
            alert('Ошибка при оформлении заказа');
        }
    });
}

// Показать категории
function showCategories() {
    document.getElementById('categories').style.display = 'block';
    document.getElementById('products').style.display = 'none';
    document.getElementById('cart').style.display = 'none';
    document.getElementById('checkout').style.display = 'none';
}

// Скрыть корзину
function hideCart() {
    showCategories();
}

// Скрыть оформление
function hideCheckout() {
    document.getElementById('cart').style.display = 'block';
    document.getElementById('checkout').style.display = 'none';
}