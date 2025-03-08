document.addEventListener('DOMContentLoaded', function () {
    const categoriesTableBody = document.getElementById('categoriesTableBody');
    const filterBtn = document.getElementById('filterBtn');
    const nameFilter = document.getElementById('nameFilter');
    const categoryForm = document.getElementById('categoryForm');
    const categoryNameInput = document.getElementById('categoryName');
    const resetFormBtn = document.getElementById('resetFormBtn');

    const API_URL = 'http://127.0.0.1:8000';

    // 从后端获取分类数据
    async function fetchCategories() {
        try {
            const response = await fetch(`${API_URL}/categories`);
            if (!response.ok) {
                throw new Error('获取分类数据失败');
            }
            const responseData = await response.json();  // 获取返回的 JSON 数据，并提取 data 属性
            // 确保获取到的是 data 数组
            if (Array.isArray(responseData.data)) {
                categories = responseData.data.sort((a, b) => a.catid - b.catid);  // 取出 data 数组，并按照升序排序
            } else {
                categories = [];  // 如果没有获取到数组，设置为空数组
            }
            displayCategories(categories);
        } catch (error) {
            showMessageDialog('获取分类数据失败，请稍后重试', 'danger');
        }
    }

    function displayCategories(categories) {
        if (!categoriesTableBody) return;
        categoriesTableBody.replaceChildren();
        const categoryTemplate = document.getElementById('category-row-template');
    
        categories.forEach(category => {
            // 克隆模板
            const rowClone = categoryTemplate.content.cloneNode(true);
    
            // 获取克隆后的行元素
            const row = rowClone.querySelector('tr');
            const nameCell = rowClone.querySelector('.category-name');
            const editButton = rowClone.querySelector('.edit-btn');
            const deleteButton = rowClone.querySelector('.delete-btn');
    
            // 设置数据
            row.setAttribute('data-catid', category.catid);
            nameCell.textContent = category.name;
    
            // 添加按钮的事件监听
            editButton.addEventListener('click', () => {
                showEditDialog(category.catid, category.name);
            });
            deleteButton.addEventListener('click', () => {
                showDeleteConfirmation(category.catid);
            });
    
            categoriesTableBody.appendChild(row);
        });
    }    

    // 查询按钮点击事件
    if (filterBtn) {
        filterBtn.addEventListener('click', function () {
            const keyword = nameFilter.value.trim().toLowerCase();
            // 筛选符合条件的分类
            const filteredCategories = categories.filter(category =>
                category.name.toLowerCase().includes(keyword)
            );
            // 如果没有符合条件的分类，显示提示信息
            if (filteredCategories.length === 0) {
                showMessageDialog('未找到匹配的分类！', 'danger');
            }
            // 显示筛选结果
            displayCategories(filteredCategories);
        });
    }

    // 删除分类
    async function deleteCategory(catid) {
        try {
            const response = await fetch(`${API_URL}/categories/${catid}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('删除分类失败');
            }

            // 更新本地数据
            fetchCategories();
            showMessageDialog('删除分类成功', 'success');
        } catch (error) {
            showMessageDialog('删除分类失败，请稍后重试', 'danger');
        }
    }

    // 编辑分类对话框
    function showEditDialog(catid, categoryName) {
        // 获取模板
        const modalTemplate = document.getElementById('edit-category-modal-template');
        // 克隆模板内容
        const modalClone = modalTemplate.content.cloneNode(true);
        // 获取关键元素
        const modal = modalClone.querySelector('.modal');
        const input = modalClone.querySelector('#editCategoryName');
        const completeBtn = modalClone.querySelector('#completeEditBtn');
        const cancelBtn = modalClone.querySelector('#cancelEditBtn');
        // 填充数据
        input.value = categoryName;
        // 添加事件监听
        completeBtn.addEventListener('click', () => {
            const newName = input.value.trim();
            if (newName === '') {
                showMessageDialog('分类名称不能为空', 'danger');
                return;
            }
            updateCategory(catid, newName, modal);
            document.body.removeChild(modal);
        });
    
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // 插入页面
        document.body.appendChild(modal);
    }

    // 更新分类
    async function updateCategory(catid, newName, modal) {
        try {
            const response = await fetch(`${API_URL}/categories/${catid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newName })
            });

            if (!response.ok) {
                const errorData = await response.json();
                showMessageDialog(errorData.msg || '分类已存在，更新分类失败', 'danger', modal);
                return;
            }

            // 更新本地数据
            fetchCategories();
            showMessageDialog('更新分类成功', 'success');
        } catch (error) {
            showMessageDialog('更新分类失败，请稍后重试', 'danger', modal);
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
    function showDeleteConfirmation(catid) {
        // 获取并克隆模板
        const modalTemplate = document.getElementById('delete-confirmation-template');
        const modalClone = modalTemplate.content.cloneNode(true);
        
        // 获取模态框中的关键元素
        const modal = modalClone.querySelector('.modal');
        const confirmBtn = modalClone.querySelector('#confirmDeleteBtn');
        const cancelBtn = modalClone.querySelector('#cancelDeleteBtn');

        // 添加事件监听
        confirmBtn.addEventListener('click', function () {
            deleteCategory(catid);
            document.body.removeChild(modal);
        });
        cancelBtn.addEventListener('click', function () {
            document.body.removeChild(modal);
        });

        // 插入模态框到页面
        document.body.appendChild(modal);
    }

    // 添加分类功能
    if (categoryForm) {
        categoryForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            // 获取表单数据
            const categoryName = categoryNameInput.value.trim();
            
            // 调用API添加分类
            await addCategory(categoryName);
        });
    }
    
    // 重置表单按钮事件监听
    if (resetFormBtn) {
        resetFormBtn.addEventListener('click', function () {
            categoryForm.reset();
        });
    }
    
    // 添加分类函数
    async function addCategory(categoryName) {
        try {
            const response = await fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: categoryName })
            });
            // 处理响应
            if (!response.ok) {
                const errorData = await response.json();
                showMessageDialog(errorData.msg || '分类已存在，添加分类失败', 'error');
                return;
            }

            // 添加成功
            showMessageDialog('添加分类成功！', 'success');
            categoryForm.reset();

            setTimeout(() => {
                window.location.href = 'categories-add.html';
            }, 2000);
        } catch (error) {
            showMessageDialog('添加分类失败，请稍后重试', 'error');
        }
    }

    // 页面加载时初始化，如果是分类列表页面，加载分类数据
    if (categoriesTableBody) {
        fetchCategories();
    }
});