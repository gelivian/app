let tg = null;
let userId = null;

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
    // Для отладки в браузере
    userId = 12345;
}

// Загружаем категории при старте
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
});

// ВРЕМЕННЫЕ ДАННЫЕ (пока нет бэкенда)
const mockCategories = [
    { id: 1, name: 'РЫБА' },
    { id: 2, name: 'ИКРА И ДЕЛИКАТЕСЫ' },
    { id: 3, name: 'КОНСЕРВЫ' },
    { id: 4, name: 'КРЕВЕТКИ' },
    { id: 5, name: 'СУПОВЫЕ НАБОРЫ' },
    { id: 6, name: 'ПОЛУФАБРИКАТЫ' }
];

const mockProducts = {
    1: [ // РЫБА
        { id: 1, name: 'Форель икорная', price: 1050, unit: 'кг', special_tag: 'Икорность 98%' },
        { id: 2, name: 'Филе свежее Форели', price: 1650, unit: 'кг', special_tag: '' },
        { id: 3, name: 'Филе слабой соли Форели', price: 1750, unit: 'кг', special_tag: '' },
    ],
    2: [ // ИКРА
        { id: 7, name: 'Икра горбуши 2025', price: 2200, unit: '250 гр', special_tag: '2025 год' },
        { id: 8, name: 'Икра форели 2025', price: 3250, unit: '0.5 кг', special_tag: '2025 год' },
    ],
    3: [ // КОНСЕРВЫ
        { id: 9, name: 'Тунец в натуральном соку', price: 650, unit: '450 гр', special_tag: '' },
        { id: 10, name: 'Морской коктейль', price: 750, unit: '450 гр', special_tag: '' },
    ],
    4: [ // КРЕВЕТКИ
        { id: 13, name: 'Креветка Ванамей', price: 1350, unit: 'кг', special_tag: '16/20' },
    ],
    5: [ // СУПОВЫЕ НАБОРЫ
        { id: 14, name: 'Том Ям острый', price: 550, unit: 'уп', special_tag: 'острый' },
        { id: 15, name: 'Суповые наборы', price: 250, unit: 'кг', special_tag: 'В наличии' },
    ],
    6: [ // ПОЛУФАБРИКАТЫ
        { id: 16, name: 'Рулет мраморный', price: 3300, unit: 'кг', special_tag: 'Мраморный' },
        { id: 17, name: 'Фарш Форели', price: 1550, unit: 'кг', special_tag: '100% форель' },
    ]
};

let cart = [];

// Загрузка категорий
function loadCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    mockCategories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.textContent = cat.name;
        card.onclick = () => loadProducts(cat.id, cat.name);
        container.appendChild(card);
    });
}

// Загрузка товаров
function loadProducts(categoryId, categoryName) {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    const products = mockProducts[categoryId] || [];
    
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
    
    const titleElement = document.getElementById('categoryTitle');
    if (titleElement) titleElement.textContent = categoryName;
    
    // Переключаем видимость секций
    document.getElementById('categories').style.display = 'none';
    document.getElementById('products').style.display = 'block';
    document.getElementById('cart').style.display = 'none';
    document.getElementById('checkout').style.display = 'none';
}

// Добавление в корзину
function addToCart(id, name, price, unit) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            unit: unit,
            quantity: 1
        });
    }
    
    updateCartCount();
    
    // Показываем уведомление только в Telegram
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

// Просмотр корзины
function viewCart() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="loading">Корзина пуста</p>';
        document.getElementById('checkoutBtn').style.display = 'none';
        document.getElementById('cartTotal').innerHTML = '';
    } else {
        let total = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">
                        ${item.price}₽ × ${item.quantity} = ${itemTotal}₽
                    </div>
                </div>
                <button class="remove-item" onclick="removeFromCart(${index})">✕</button>
            `;
            container.appendChild(itemDiv);
        });
        
        document.getElementById('cartTotal').innerHTML = `<strong>Итого: ${total}₽</strong>`;
        document.getElementById('checkoutBtn').style.display = 'block';
    }
    
    document.getElementById('categories').style.display = 'none';
    document.getElementById('products').style.display = 'none';
    document.getElementById('cart').style.display = 'block';
    document.getElementById('checkout').style.display = 'none';
}

// Удаление из корзины
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    viewCart();
}

// Обновление счетчика
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) cartCountElement.textContent = count;
}

// Оформление заказа
function checkout() {
    document.getElementById('cart').style.display = 'none';
    document.getElementById('checkout').style.display = 'block';
}

// Отправка формы
const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', function(e) {
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
        
        if (tg) {
            tg.showPopup({
                title: '✅ Заказ оформлен!',
                message: `Спасибо, ${name}! Скоро с вами свяжутся.`,
                buttons: [{ type: 'ok' }]
            });
        } else {
            alert(`✅ Спасибо, ${name}! Заказ оформлен.`);
        }
        
        // Очищаем корзину
        cart = [];
        updateCartCount();
        showCategories();
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