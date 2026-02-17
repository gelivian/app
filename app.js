// Telegram WebApp
let tg = window.Telegram.WebApp;
let userId = null;
let currentRating = 0;
let cart = [];
let currentCategoryId = null;
let currentCategoryName = '';
let currentEditProduct = null;
let headerImageUrl = localStorage.getItem('headerImage') || 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600';

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
    loadHeaderImage();
}

// ==================== ФУНКЦИИ ДЛЯ ШАПКИ ====================

function loadHeaderImage() {
    document.getElementById('headerImage').src = headerImageUrl;
}

function changeHeaderImage() {
    const newImageUrl = prompt('Введите URL картинки для шапки:', headerImageUrl);
    if (newImageUrl && newImageUrl.trim()) {
        headerImageUrl = newImageUrl.trim();
        localStorage.setItem('headerImage', headerImageUrl);
        loadHeaderImage();
        
        tg.showPopup({
            title: '✅ Успешно',
            message: 'Картинка шапки обновлена',
            buttons: [{ type: 'ok' }]
        });
    }
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
    // Главное меню теперь внизу, просто показываем категории
    showCategories();
}

function showCategories() {
    hideAll();
    document.getElementById('categoriesPage').style.display = 'block';
    loadCategories();
}

// ... (остальные функции навигации без изменений) ...

// ==================== ИСПРАВЛЕННЫЕ ФУНКЦИИ ЭКСПОРТА/ИМПОРТА ====================

async function exportProducts() {
    if (!userId) {
        alert('Ошибка авторизации');
        return;
    }
    
    try {
        // Показываем загрузку
        const statusDiv = document.getElementById('importStatus');
        if (statusDiv) {
            statusDiv.className = 'import-status';
            statusDiv.innerText = '⏳ Подготовка файла...';
        }
        
        // Создаем ссылку для скачивания
        const response = await fetch(`${API_URL}/api/admin/export-products?user_id=${userId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });
        
        if (!response.ok) throw new Error('Ошибка экспорта');
        
        // Получаем blob с файлом
        const blob = await response.blob();
        
        // Создаем ссылку для скачивания
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_export_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        if (statusDiv) {
            statusDiv.className = 'import-status success';
            statusDiv.innerText = '✅ Файл успешно скачан';
            setTimeout(() => {
                statusDiv.innerText = '';
                statusDiv.className = 'import-status';
            }, 3000);
        }
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        const statusDiv = document.getElementById('importStatus');
        if (statusDiv) {
            statusDiv.className = 'import-status error';
            statusDiv.innerText = '❌ Ошибка при экспорте';
        }
    }
}

async function exportOrders() {
    if (!userId) {
        alert('Ошибка авторизации');
        return;
    }
    
    try {
        const statusDiv = document.getElementById('importStatus');
        if (statusDiv) {
            statusDiv.className = 'import-status';
            statusDiv.innerText = '⏳ Подготовка файла...';
        }
        
        const response = await fetch(`${API_URL}/api/admin/export-orders?user_id=${userId}`, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv'
            }
        });
        
        if (!response.ok) throw new Error('Ошибка экспорта');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_export_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        if (statusDiv) {
            statusDiv.className = 'import-status success';
            statusDiv.innerText = '✅ Файл успешно скачан';
            setTimeout(() => {
                statusDiv.innerText = '';
                statusDiv.className = 'import-status';
            }, 3000);
        }
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        const statusDiv = document.getElementById('importStatus');
        if (statusDiv) {
            statusDiv.className = 'import-status error';
            statusDiv.innerText = '❌ Ошибка при экспорте';
        }
    }
}

function importProducts() {
    document.getElementById('importFile').click();
}

async function uploadImportFile() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    if (!file) return;
    
    // Проверка расширения файла
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
        alert('Пожалуйста, выберите файл Excel (.xlsx, .xls) или CSV');
        fileInput.value = '';
        return;
    }
    
    // Проверка размера файла (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер 5MB');
        fileInput.value = '';
        return;
    }
    
    const statusDiv = document.getElementById('importStatus');
    statusDiv.className = 'import-status';
    statusDiv.innerText = '⏳ Загрузка и обработка файла...';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    
    try {
        const response = await fetch(`${API_URL}/api/admin/import-products`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            statusDiv.className = 'import-status success';
            statusDiv.innerText = `✅ Импорт завершен! Добавлено: ${result.added || 0}, Обновлено: ${result.updated || 0}`;
            
            // Обновляем список товаров если открыта страница редактирования
            if (document.getElementById('editProductsSection').style.display === 'block') {
                loadProductsForEdit();
            }
            
            // Показываем уведомление
            tg.showPopup({
                title: '✅ Импорт завершен',
                message: `Добавлено: ${result.added || 0}\nОбновлено: ${result.updated || 0}`,
                buttons: [{ type: 'ok' }]
            });
        } else {
            statusDiv.className = 'import-status error';
            statusDiv.innerText = `❌ Ошибка: ${result.error || 'Неизвестная ошибка'}`;
        }
    } catch (error) {
        console.error('Ошибка импорта:', error);
        statusDiv.className = 'import-status error';
        statusDiv.innerText = '❌ Ошибка при импорте файла';
    }
    
    fileInput.value = '';
}

// ==================== ИСПРАВЛЕННАЯ ФУНКЦИЯ РЕДАКТИРОВАНИЯ ТОВАРА ====================

async function saveProduct() {
    if (!currentEditProduct) {
        alert('Ошибка: товар не выбран');
        return;
    }
    
    // Валидация полей
    const name = document.getElementById('editName').value.trim();
    const price = parseInt(document.getElementById('editPrice').value);
    
    if (!name) {
        alert('Введите название товара');
        return;
    }
    
    if (!price || price <= 0) {
        alert('Введите корректную цену');
        return;
    }
    
    const updatedProduct = {
        id: currentEditProduct.id,
        name: name,
        description: document.getElementById('editDescription').value.trim(),
        full_description: document.getElementById('editFullDescription').value.trim(),
        price: price,
        unit: document.getElementById('editUnit').value.trim() || 'шт',
        weight_info: document.getElementById('editWeight').value.trim(),
        origin: document.getElementById('editOrigin').value.trim(),
        special_tag: document.getElementById('editTag').value.trim()
    };
    
    // Показываем загрузку
    const saveBtn = document.querySelector('#editProductForm .green-btn');
    const originalText = saveBtn.innerText;
    saveBtn.innerText = '⏳ СОХРАНЕНИЕ...';
    saveBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/api/admin/product/${currentEditProduct.id}?user_id=${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct)
        });
        
        const result = await response.json();
        
        if (result.success) {
            tg.showPopup({
                title: '✅ Успешно',
                message: 'Товар успешно обновлен',
                buttons: [{ type: 'ok' }]
            });
            
            cancelEdit();
            loadProductsForEdit();
        } else {
            alert('❌ Ошибка при обновлении товара');
        }
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('❌ Ошибка соединения с сервером');
    } finally {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
}

async function loadProductsForEdit() {
    const container = document.getElementById('productsEditList');
    container.innerHTML = '<div class="loading">Загрузка товаров...</div>';
    
    try {
        const response = await fetch(`${API_URL}/api/admin/products?user_id=${userId}`);
        if (!response.ok) throw new Error('Ошибка загрузки');
        
        const products = await response.json();
        
        container.innerHTML = '';
        
        if (products.length === 0) {
            container.innerHTML = '<div class="loading">Нет товаров для редактирования</div>';
            return;
        }
        
        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-edit-item';
            div.onclick = () => showEditForm(p);
            div.innerHTML = `
                <div class="product-edit-info">
                    <h4>${escapeHtml(p.name)}</h4>
                    <div class="product-edit-price">${p.price}₽ / ${p.unit || 'шт'}</div>
                </div>
                <div class="edit-icon">✏️</div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        container.innerHTML = '<div class="error">Ошибка загрузки товаров</div>';
    }
}

// Вспомогательная функция для экранирования HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Обновляем функцию showEditForm для лучшего отображения
function showEditForm(product) {
    currentEditProduct = product;
    document.getElementById('editProductTitle').innerText = `✏ РЕДАКТИРОВАНИЕ: ${product.name}`;
    document.getElementById('editName').value = product.name || '';
    document.getElementById('editDescription').value = product.description || '';
    document.getElementById('editFullDescription').value = product.full_description || '';
    document.getElementById('editPrice').value = product.price || '';
    document.getElementById('editUnit').value = product.unit || 'шт';
    document.getElementById('editWeight').value = product.weight_info || '';
    document.getElementById('editOrigin').value = product.origin || '';
    document.getElementById('editTag').value = product.special_tag || '';
    
    document.getElementById('editProductsSection').style.display = 'none';
    document.getElementById('editProductForm').style.display = 'block';
    
    // Плавный скролл к форме
    document.getElementById('editProductForm').scrollIntoView({ behavior: 'smooth' });
}

// Остальные функции остаются без изменений...
// (loadCategories, loadProducts, addToCart, и т.д.)