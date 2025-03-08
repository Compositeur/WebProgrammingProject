document.addEventListener('DOMContentLoaded', function() {
    const categoryFilter = document.getElementById('categoryFilter');
    const nameFilter = document.getElementById('nameFilter');
    const filterBtn = document.getElementById('filterBtn');
    const productsTableBody = document.getElementById('productsTableBody');
    const productForm = document.getElementById('productForm');
    const editProductForm = document.getElementById('editProductForm');
    const productNameInput = document.getElementById('productName');
    const productCategoryInput = document.getElementById('categorySelect');
    const productPriceInput = document.getElementById('productPrice');
    const productDescriptionInput = document.getElementById('productDescription');
    const productId = new URLSearchParams(window.location.search).get('pid');
    const productImageInput = document.getElementById('productImage');
    const resetFormBtn = document.getElementById('resetFormBtn');

    const API_URL = 'http://23.99.121.33:8080';

    // 从后端获取商品数据
    async function fetchProducts() {
        try {
            const response = await fetch(`${API_URL}/products`);
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
            displayProducts(products);
        } catch (error) {
            showMessageDialog('获取商品数据失败，请稍后重试', 'danger');
        }
    }

    async function fetchProductDetails(pid) {
        try {
            const response = await fetch(`${API_URL}/products/${pid}`);
            if (!response.ok) {
                throw new Error('获取商品详情失败');
            }
            // 获取返回的 JSON 数据，并提取 data 属性
            const responseData = await response.json();

            // 确保获取到的是 data 数组
            if (responseData.data && typeof responseData.data === "object") {
                product = responseData.data;  // 直接取对象
            } else {
                product = null;
            }
            // 填充商品信息到表单
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('categorySelect').value = product.catid;
        } catch (error) {
            showMessageDialog('获取商品详情失败，请稍后重试', 'danger');
        }
    }

    // 从后端获取分类数据
    async function fetchCategories() {
        try {
            const response = await fetch(`${API_URL}/categories`);
            if (!response.ok) {
                throw new Error('获取分类数据失败');
            }
            // 获取返回的 JSON 数据，并提取 data 属性
            const responseData = await response.json();
            
            // 确保获取到的是 data 数组
            if (Array.isArray(responseData.data)) {
                categories = responseData.data.sort((a, b) => a.catid - b.catid);  // 取出 data 数组，并按照升序排序
                loadCategoryOptions();
            } else {
                categories = [];  // 如果没有获取到数组，设置为空数组
            }
        } catch (error) {
            showMessageDialog('获取分类数据失败，请稍后重试', 'danger');
        }
    }

    // 加载分类选择器选项
    function loadCategoryOptions() {
        if (categoryFilter) {
            // 清空现有选项
            categoryFilter.replaceChildren();
            
            // 添加默认空选项
            let defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "全部分类";
            categoryFilter.appendChild(defaultOption);
            
            // 添加分类选项
            categories.forEach(category => {
                let option = document.createElement("option");
                option.value = category.catid;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }

        // 如果是添加商品页面，还需要加载产品分类选择器
        if (productCategoryInput) {
            productCategoryInput.replaceChildren();
            
            // 添加一个提示选择的选项
            let promptOption = document.createElement("option");
            promptOption.value = "";
            promptOption.textContent = "-- 请选择分类 --";
            productCategoryInput.appendChild(promptOption);
            
            // 添加分类选项
            categories.forEach(category => {
                let option = document.createElement("option");
                option.value = category.catid;
                option.textContent = category.name;
                productCategoryInput.appendChild(option);
            });
        }
    }

    // 显示商品
    function displayProducts(products) {
        if (!productsTableBody) return;
        productsTableBody.replaceChildren();
    
        products.forEach(product => {
            const rowClone = document.getElementById('product-row-template').content.cloneNode(true);
        
            // 获取克隆后的元素
            const row = rowClone.querySelector('tr');
            const nameCell = row.querySelector('.product-name');
            const categoryCell = row.querySelector('.product-category');
            const priceCell = row.querySelector('.product-price');
            const descriptionCell = row.querySelector('.product-description');
            const editButton = row.querySelector('.edit-btn');
            const deleteButton = row.querySelector('.delete-btn');
        
            // 设置商品数据
            nameCell.textContent = product.name;
            categoryCell.textContent = product.categoryName;
            priceCell.textContent = `¥${product.price.toFixed(2)}`;
            descriptionCell.textContent = product.description || '-';
        
            // 添加事件监听
            editButton.addEventListener('click', function () {
                window.location.href = `products-edit.html?pid=${product.pid}`;
            });
            deleteButton.addEventListener('click', function () {
                showDeleteConfirmation(product.pid);
            });
            productsTableBody.appendChild(row);
        });
    }

    // 查询按钮点击事件
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            const categoryId = categoryFilter.value.trim();
            const keyword = nameFilter.value.trim().toLowerCase();

            // 筛选符合条件的商品
            const filteredProducts = products.filter(product =>
                (categoryId === '' || product.catid == categoryId) &&
                (keyword === '' || product.name.toLowerCase().includes(keyword))
            );

            // 如果没有符合条件的商品，显示提示信息
            if (filteredProducts.length === 0) {
                showMessageDialog('未找到匹配的商品！', 'danger');
            }

            // 显示筛选结果
            displayProducts(filteredProducts);
        });
    }

    // 删除商品
    async function deleteProduct(pid) {
        try {
            const response = await fetch(`${API_URL}/products/${pid}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('删除商品失败');
            }

            // 更新本地数据
            fetchProducts();
            showMessageDialog('删除商品成功', 'success');
        } catch (error) {
            showMessageDialog('删除商品失败，请稍后重试', 'danger');
        }
    }

    // 更新商品
    async function updateProduct(pid, name, catid, price, description, image) {
        try {
            // 最大允许上传大小（10MB）
            const MAX_FILE_SIZE = 10 * 1024 * 1024;  

            if (image && image.size > MAX_FILE_SIZE) {
                showMessageDialog('图片大小不能超过 10MB！', 'error');
                return;
            }
            // 创建FormData对象用于上传文件
            const formData = new FormData();
            formData.append("pid", pid);
            formData.append("name", name);
            formData.append("catid", catid);
            formData.append("price", price);
            formData.append("description", description);

            if (image) {
                formData.append('image', image);
            }
            const response = await fetch(`${API_URL}/products/${pid}`, {
                method: 'PUT',
                body: formData // 不需要设置Content-Type，浏览器会自动设置
            });

            if (!response.ok) {
                const errorData = await response.json();
                showMessageDialog(errorData.msg || '该分类中，商品已存在，更新商品失败', 'danger');
                return;
            }
            // 更新本地数据
            showMessageDialog('更新商品成功', 'success');
        } catch (error) {
            console.log("错误类型:", error);
            showMessageDialog('更新商品失败，请稍后重试', 'danger');
        }
    }

    // 显示消息对话框
    function showMessageDialog(message, type, parentModal = null) {
        // 获取和克隆模板
        const messageTemplate = document.getElementById('message-dialog-template');
        const messageClone = messageTemplate.content.cloneNode(true);
    
        // 获取克隆后的元素
        const messageModal = messageClone.querySelector('.message-modal');
        const messageContent = messageClone.querySelector('.message-modal-content');
        const closeButton = messageClone.querySelector('#closeMessageDialog');
    
        // 设置标题和消息内容
        const statusText = messageContent.querySelector('h4');
        statusText.textContent = type === 'success' ? '✅ 成功' : '❌ 失败';
        messageContent.querySelector('p').textContent = message;
    
        // 将克隆的模态框添加到页面
        document.body.appendChild(messageModal);
    
        // 添加关闭按钮的事件监听
        closeButton.addEventListener('click', function () {
            document.body.removeChild(messageModal);
            if (parentModal && type === 'success') {
                document.body.removeChild(parentModal);
            }
        });
    
        // 自动关闭消息
        setTimeout(() => {
            if (document.body.contains(messageModal)) {
                document.body.removeChild(messageModal);
                if (parentModal && type === 'success') {
                    document.body.removeChild(parentModal);
                }
            }
        }, 3000);
    }

    // 显示删除确认框
    function showDeleteConfirmation(pid) {
        // 获取并克隆模板
        const modalTemplate = document.getElementById('delete-confirmation-template');
        const modalClone = modalTemplate.content.cloneNode(true);
        
        // 获取模态框中的关键元素
        const modal = modalClone.querySelector('.modal');
        const confirmBtn = modalClone.querySelector('#confirmDeleteBtn');
        const cancelBtn = modalClone.querySelector('#cancelDeleteBtn');

        // 添加事件监听
        confirmBtn.addEventListener('click', function () {
            deleteProduct(pid);
            document.body.removeChild(modal);
        });
        cancelBtn.addEventListener('click', function () {
            document.body.removeChild(modal);
        });

        // 插入模态框到页面
        document.body.appendChild(modal);
    }

    // 添加商品功能
    if (productForm) {
        productForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // 获取表单数据
            const productName = productNameInput.value.trim();
            const productCategory = productCategoryInput.value;
            const productPrice = productPriceInput.value;
            const productDescription = productDescriptionInput.value.trim();
            const productImage = productImageInput.files[0];
            
            // 调用API添加商品
            await addProduct(productName, productCategory, productPrice, productDescription, productImage);
        });
    }

    // 添加表单提交事件监听器
    if (editProductForm) {
        editProductForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // 获取表单数据
            const productId = new URLSearchParams(window.location.search).get('pid');
            const productName = productNameInput.value.trim();
            const productCategory = productCategoryInput.value;
            const productPrice = productPriceInput.value;
            const productDescription = productDescriptionInput.value.trim();
            const productImage = productImageInput.files[0];
            
            // 调用API更新商品
            await updateProduct(productId, productName, productCategory, productPrice, productDescription, productImage);
        });
    }
    
    // 重置表单按钮事件监听
    if (resetFormBtn) {
        resetFormBtn.addEventListener('click', function() {
            productForm.reset();
        });
    }
    
    // 添加商品函数
    async function addProduct(name, catid, price, description, image) {
        try {
            // 最大允许上传大小（10MB）
            const MAX_FILE_SIZE = 10 * 1024 * 1024;  

            if (image && image.size > MAX_FILE_SIZE) {
                showMessageDialog('图片大小不能超过 10MB！', 'error');
                return;
            }
            // 创建FormData对象用于上传文件
            const formData = new FormData();
            formData.append("name", name);
            formData.append("catid", catid);
            formData.append("price", price);
            formData.append("description", description);
            formData.append('image', image);

            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formData // 不需要设置Content-Type，浏览器会自动设置
            });
            
            // 处理响应
            if (!response.ok) {
                const errorData = await response.json();
                showMessageDialog(errorData.msg || '该分类中，商品已存在，添加商品失败', 'error');
                return;
            }

            // 添加成功
            showMessageDialog('添加商品成功！', 'success');
            productForm.reset();

            // 3秒后跳转回列表页
            setTimeout(() => {
                window.location.href = 'products-add.html';
            }, 3000);
        } catch (error) {
            showMessageDialog('添加商品失败，请稍后重试', 'error');
        }
    }

    // 页面加载时初始化
    // 加载分类数据（无论是商品列表页面还是新增商品页面都需要）
    fetchCategories();
    
    // 如果是商品列表页面，加载商品数据
    if (productsTableBody) {
        fetchProducts();
    }
    
    // 如果是编辑页面，获取并填充商品详情
    if (productId) {
        fetchProductDetails(productId);
    }
});