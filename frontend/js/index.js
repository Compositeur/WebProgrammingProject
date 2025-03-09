// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 获取 URL 参数，检查是否有 `catid`
    const urlParams = new URLSearchParams(window.location.search);
    const catid = urlParams.get('catid');
    const pid = urlParams.get('pid');
    if (!catid && !pid) {
        fetchCategories();
    }

    if (catid) {
        fetchCategories();
        fetchCategoryDetail(catid); // 更新分类名称
    }

    if (pid) {
        fetchProductDetail(pid); // 更新分类名称
    }

    // 恢复购物车数据
    const savedCart = JSON.parse(localStorage.getItem('cart'));
    if (savedCart) {
        cart.push(...savedCart); // 恢复购物车数据
        updateCart(); // 更新购物车显示
    }
});

// 配置常量
const API_URL = 'http://23.99.121.33:8080';
const cart = [];

// DOM 元素选择器
const categoryList = document.getElementById('category-list');
const breadContainer = document.getElementById('bread-container');
const productsContainer = document.getElementById('products-container');
const productsDisplay = document.getElementById('products-display');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalPrice = document.getElementById('cart-total-price');

// 模板元素
const categoryTemplate = document.getElementById('category-template');
const productTemplate = document.getElementById('product-template');
const cartItemTemplate = document.getElementById('cart-item-template');

// 获取分类列表
async function fetchCategories() {
    try {
        const response = await fetch(`${API_URL}/api/categories`);
        if (!response.ok) {
            throw new Error('获取分类数据失败');
        }

        const responseData = await response.json();
        const categories = Array.isArray(responseData.data) ? 
            responseData.data.sort((a, b) => a.catid - b.catid) : [];

        displayCategories(categories);
    } catch (error) {
        console.error('获取分类列表失败:', error);
    }
}

// 显示分类
function displayCategories(categories) {
    if (!categoryList) return;
    categoryList.replaceChildren();

    if (!categoryTemplate) {
        console.error('category-template 未找到，请检查 HTML 结构');
        return;
    }

    categories.forEach(category => {
        const categoryClone = categoryTemplate.content.cloneNode(true);
        const categoryItem = categoryClone.querySelector('li'); 
        const categoryLink = categoryItem.querySelector('a');

        categoryItem.setAttribute('data-catid', category.catid);
        categoryLink.textContent = category.name;
        categoryLink.href = `../categories/category.html?catid=${category.catid}`;

        categoryList.appendChild(categoryItem);
    });
}

// 获取分类名称并渲染
async function fetchCategoryDetail(catid) {
    try {
        const response = await fetch(`${API_URL}/api/categories/${catid}`);
        if (!response.ok) {
            throw new Error('获取分类名称失败');
        }
        const categoryData = await response.json();
        const category = categoryData.data;
        // 更新页面标题
        document.title = `${category.name} - 网上购物商城`;

        renderCategoryDetail(category);

        // 更新面包屑导航
        updateBreadcrumb(category);
    } catch (error) {
        console.error('获取分类名称失败:', error);
    }
}

// 获取商品详情并渲染
async function fetchProductDetail(pid) {
    try {
        const response = await fetch(`${API_URL}/api/products/${pid}`);
        if (!response.ok) {
            throw new Error('获取商品信息失败');
        }
        const productData = await response.json();
        const product = productData.data;
        // 更新页面标题
        document.title = `${product.name} - 网上购物商城`;

        // 渲染商品详情
        renderProductDetail(product);

        // 更新面包屑导航
        updateBreadcrumb(product);
    } catch (error) {
        console.error('获取商品信息失败:', error);
    }
}

// 更新面包屑导航
function updateBreadcrumb(data) {
    const breadcrumb = document.querySelector('.breadcrumb ul');

    if (!breadcrumb) {
        console.error("找不到面包屑导航容器");
        return;
    }

    // 添加分类
    const categoryItem = document.createElement('li');
    const categoryLink = document.createElement('a');
    categoryLink.href = `../categories/category.html?catid=${data.catid}`;
    categoryLink.textContent = data.categoryName || data.name; // 商品用 `categoryName`，分类用 `name`
    categoryItem.appendChild(categoryLink);
    breadcrumb.appendChild(categoryItem);

    // 如果是商品，再添加商品导航
    if (data.pid) {
        const productItem = document.createElement('li');
        const productLink = document.createElement('a');
        productLink.href = `../categories/product.html?pid=${data.pid}`;
        productLink.textContent = data.name;
        productItem.appendChild(productLink);
        breadcrumb.appendChild(productItem);
    }
}

// 渲染商品详情
function renderProductDetail(product) {
    const productContainer = document.getElementById('product-container');
    const template = document.getElementById('product-detail-template');

    if (!template || !productContainer) {
        console.error("找不到商品详情模板或容器");
        return;
    }

    // 克隆模板
    const productClone = template.content.cloneNode(true);

    // 填充数据
    productClone.querySelector('.product-detail-image').src = product.imageUrl;
    productClone.querySelector('.product-detail-image').alt = product.name;
    productClone.querySelector('.product-title').textContent = product.name;
    productClone.querySelector('.product-description').textContent = product.description;
    productClone.querySelector('.product-price').textContent = `¥${product.price}`;

    // 绑定“加入购物车”事件
    const addToCartButton = productClone.querySelector('.add-to-cart');
    addToCartButton.addEventListener('click', () => addToCart(product));

    // 渲染到页面
    productContainer.replaceChildren(productClone);
}

// 获取指定分类下的所有商品
async function renderCategoryDetail(category) {
    try {
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) {
            throw new Error('获取商品数据失败');
        }
        // 获取返回的 JSON 数据，并提取 data 属性
        const responseData = await response.json();
        
        // 确保获取到的是 data 数组
        if (responseData.data) {
            products = responseData.data.sort((a, b) => a.pid - b.pid);  // 取出 data 数组，并按照升序排序
        } else {
            products = [];  // 如果没有获取到数组，设置为空数组
        }
        const filteredProducts = [];
        for (let i = 0; i < products.length; i++) {
            if (products[i].catid === category.catid) {
                filteredProducts.push(products[i]);
            }
        }

        displayProducts(filteredProducts);
    } catch (error) {
        console.error('获取商品列表失败，请稍后重试', error);
    }
}

// 依据分类，显示商品列表
function displayProducts(products) {
    if (!productsContainer) return;
    productsContainer.replaceChildren();

    const productsDisplay = document.getElementById('products-display');
    products.forEach(product => {
        const productClone = productTemplate.content.cloneNode(true);
        const productCard = productClone.querySelector('.product-card');
        
        // 设置商品详情链接
        const productLink = productCard.querySelector('a');
        productLink.href = `./product.html?pid=${product.pid}`;
        productCard.querySelector('img').src = product.imageUrl;
        productCard.querySelector('img').alt = product.name;
        productCard.querySelector('h3').textContent = product.name;
        productCard.querySelector('.product-price').textContent = `¥${product.price}`;

        const addToCartButton = productCard.querySelector('.add-to-cart');
        addToCartButton.addEventListener('click', () => addToCart(product));

        productsDisplay.appendChild(productClone);
    });
}

// 添加到购物车
function addToCart(product) {
    const existingProduct = cart.find(item => item.pid === product.pid);
    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCart();
}

// 更新购物车
function updateCart() {
    cartItems.replaceChildren();

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    cartCount.textContent = `${totalItems}件商品`;
    cartTotalPrice.textContent = `¥${totalPrice.toFixed(2)}`;

    const fragment = document.createDocumentFragment();
    cart.forEach(item => {
        const cartItemClone = cartItemTemplate.content.cloneNode(true);
        const cartItem = cartItemClone.querySelector('.cart-item');

        cartItem.querySelector('img').src = item.thumbnailUrl;
        cartItem.querySelector('img').alt = item.name;
        cartItem.querySelector('.item-name').textContent = item.name;
        cartItem.querySelector('.item-price').textContent = `¥${item.price}`;

        const quantityInput = cartItem.querySelector('.item-quantity');
        quantityInput.value = item.quantity;
        quantityInput.addEventListener('change', (e) => updateItemQuantity(item.pid, e.target.value));

        const removeButton = cartItem.querySelector('.remove-item');
        removeButton.addEventListener('click', () => removeFromCart(item.pid));

        fragment.appendChild(cartItemClone);
    });

    cartItems.appendChild(fragment);

    // 同步到 localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
}

// 更新商品数量
function updateItemQuantity(productId, quantity) {
    const product = cart.find(item => item.pid === productId);
    if (product) {
        product.quantity = parseInt(quantity, 10);
        updateCart();
    }
}

// 从购物车移除商品
function removeFromCart(productId) {
    const index = cart.findIndex(item => item.pid === productId);
    if (index !== -1) {
        cart.splice(index, 1);
        updateCart();
    }
}