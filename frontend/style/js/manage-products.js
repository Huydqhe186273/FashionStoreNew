let mockProducts = [
    { productId: 1, name: "Áo Polo Nam Premium Flex", categoryId: 1, categoryName: "Áo", basePrice: 350000, discountPrice: 299000, status: "active", viewCount: 1250, soldCount: 142, description: "Áo Polo nam chất liệu thun cotton thoáng mát" },
    { productId: 2, name: "Quần Jean Slimfit Co Giãn", categoryId: 2, categoryName: "Quần", basePrice: 550000, discountPrice: 480000, status: "active", viewCount: 890, soldCount: 98, description: "Quần Jean Slimfit co giãn 4 chiều cao cấp" },
    { productId: 3, name: "Váy Dáng Xòe Floral Spring", categoryId: 3, categoryName: "Váy", basePrice: 620000, discountPrice: 550000, status: "active", viewCount: 640, soldCount: 76, description: "Váy hoa nhí dáng xòe mỏng nhẹ phong cách Hàn Quốc" },
    { productId: 4, name: "Áo Khoác Bomber Minimalist", categoryId: 1, categoryName: "Áo", basePrice: 850000, discountPrice: 750000, status: "inactive", viewCount: 420, soldCount: 24, description: "Áo khoác Bomber chống gió chống nước nhẹ" }
];

let currentProducts = [];

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

async function fetchProducts() {
    const searchVal = document.getElementById('searchInput').value.trim();
    const statusVal = document.getElementById('statusFilter').value;
    const statusBadge = document.getElementById('apiStatusBadge');

    const queryParams = new URLSearchParams();
    if (searchVal) queryParams.append('keyword', searchVal);
    if (statusVal) queryParams.append('status', statusVal);

    try {
        const response = await fetch(`http://localhost:8080/api/admin/products?${queryParams.toString()}`);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        
        currentProducts = data;
        if (statusBadge) {
            statusBadge.innerHTML = '<span class="status-dot"></span> Backend Live Connected';
            statusBadge.style.color = 'var(--success)';
        }
        renderProducts(currentProducts);
        updateStats(currentProducts);

    } catch (err) {
        console.warn('API offline, using mock products data', err);
        if (statusBadge) {
            statusBadge.innerHTML = '<span class="status-dot" style="background: var(--warning); box-shadow: 0 0 8px var(--warning);"></span> Demo Mode';
            statusBadge.style.color = 'var(--warning)';
        }
        
        currentProducts = mockProducts.filter(p => {
            const matchSearch = !searchVal || p.name.toLowerCase().includes(searchVal.toLowerCase());
            const matchStatus = !statusVal || p.status.toLowerCase() === statusVal.toLowerCase();
            return matchSearch && matchStatus;
        });
        renderProducts(currentProducts);
        updateStats(mockProducts);
    }
}

function updateStats(list) {
    document.getElementById('statTotal').innerText = list.length;
    document.getElementById('statActive').innerText = list.filter(p => p.status === 'active').length;
    document.getElementById('statInactive').innerText = list.filter(p => p.status === 'inactive').length;
}

function renderProducts(list) {
    const tbody = document.getElementById('tableTbody');
    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">Không tìm thấy sản phẩm nào</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(p => {
        const isActive = p.status === 'active';
        return `
            <tr>
                <td><strong>#PRD-${p.productId}</strong></td>
                <td>
                    <div style="font-weight: 600; color: #ffffff;">${p.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 250px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${p.description || ''}</div>
                </td>
                <td><span class="role-tag role-staff">${p.categoryName || 'N/A'}</span></td>
                <td>
                    <div style="font-weight: 700; color: #ffffff;">${formatCurrency(p.discountPrice || p.basePrice)}</div>
                    ${p.discountPrice ? `<div style="font-size: 0.75rem; color: var(--text-muted); text-decoration: line-through;">${formatCurrency(p.basePrice)}</div>` : ''}
                </td>
                <td><strong style="color: var(--success);">${p.soldCount || 0}</strong> đã bán</td>
                <td><span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}">${isActive ? '✅ Kinh doanh' : '⛔ Ngừng bán'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action" onclick="openEditModal(${p.productId})">✏️ Sửa</button>
                        <button class="btn-action ${isActive ? 'btn-lock' : 'btn-unlock'}" onclick="toggleStatus(${p.productId})">
                            ${isActive ? '⛔ Vô hiệu' : '✅ Kích hoạt'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function toggleStatus(productId) {
    try {
        await fetch(`http://localhost:8080/api/admin/products/${productId}/status`, { method: 'PUT' });
        fetchProducts();
    } catch (err) {
        const p = mockProducts.find(x => x.productId === productId);
        if (p) p.status = p.status === 'active' ? 'inactive' : 'active';
        fetchProducts();
    }
}

function openAddModal() {
    document.getElementById('addModal').style.display = 'flex';
}

function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
}

async function createProduct(e) {
    e.preventDefault();
    const name = document.getElementById('addName').value;
    const categoryId = parseInt(document.getElementById('addCategoryId').value);
    const basePrice = parseFloat(document.getElementById('addBasePrice').value);
    const discountPrice = document.getElementById('addDiscountPrice').value ? parseFloat(document.getElementById('addDiscountPrice').value) : null;
    const status = document.getElementById('addStatus').value;
    const description = document.getElementById('addDescription').value;

    const payload = { categoryId, name, description, basePrice, discountPrice, status };

    try {
        await fetch('http://localhost:8080/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        closeAddModal();
        fetchProducts();
    } catch (err) {
        mockProducts.push({ productId: mockProducts.length + 1, name, categoryId, categoryName: 'Áo', basePrice, discountPrice, status, viewCount: 0, soldCount: 0, description });
        closeAddModal();
        fetchProducts();
    }
}

function openEditModal(productId) {
    const p = currentProducts.find(x => x.productId === productId) || mockProducts.find(x => x.productId === productId);
    if (!p) return;

    document.getElementById('editProductId').value = p.productId;
    document.getElementById('editName').value = p.name || '';
    document.getElementById('editCategoryId').value = p.categoryId || 1;
    document.getElementById('editBasePrice').value = p.basePrice || 0;
    document.getElementById('editDiscountPrice').value = p.discountPrice || '';
    document.getElementById('editStatus').value = p.status || 'active';
    document.getElementById('editDescription').value = p.description || '';

    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function saveEdit(e) {
    e.preventDefault();
    const productId = document.getElementById('editProductId').value;
    const name = document.getElementById('editName').value;
    const categoryId = parseInt(document.getElementById('editCategoryId').value);
    const basePrice = parseFloat(document.getElementById('editBasePrice').value);
    const discountPrice = document.getElementById('editDiscountPrice').value ? parseFloat(document.getElementById('editDiscountPrice').value) : null;
    const status = document.getElementById('editStatus').value;
    const description = document.getElementById('editDescription').value;

    try {
        await fetch(`http://localhost:8080/api/admin/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryId, name, description, basePrice, discountPrice, status })
        });
        closeEditModal();
        fetchProducts();
    } catch (err) {
        const p = mockProducts.find(x => x.productId == productId);
        if (p) {
            p.name = name; p.categoryId = categoryId; p.basePrice = basePrice; p.discountPrice = discountPrice; p.status = status; p.description = description;
        }
        closeEditModal();
        fetchProducts();
    }
}

window.addEventListener('DOMContentLoaded', fetchProducts);
