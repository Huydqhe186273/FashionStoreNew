let mockCategories = [
    { categoryId: 1, name: "Áo", gender: "unisex", season: "Tất cả", parentId: null, parentName: null, productCount: 15 },
    { categoryId: 2, name: "Quần", gender: "unisex", season: "Tất cả", parentId: null, parentName: null, productCount: 12 },
    { categoryId: 3, name: "Váy", gender: "nu", season: "Xuân Hè", parentId: null, parentName: null, productCount: 8 },
    { categoryId: 4, name: "Áo sơ mi nam", gender: "nam", season: "Thu Đông", parentId: 1, parentName: "Áo", productCount: 5 }
];

let currentCategories = [];

async function fetchCategories() {
    const searchVal = document.getElementById('searchInput').value.trim();
    const genderVal = document.getElementById('genderFilter').value;
    const statusBadge = document.getElementById('apiStatusBadge');

    const queryParams = new URLSearchParams();
    if (searchVal) queryParams.append('keyword', searchVal);
    if (genderVal) queryParams.append('gender', genderVal);

    try {
        const response = await fetch(`http://localhost:8080/api/admin/categories?${queryParams.toString()}`);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        
        currentCategories = data;
        if (statusBadge) {
            statusBadge.innerHTML = '<span class="status-dot"></span> Backend Live Connected';
            statusBadge.style.color = 'var(--success)';
        }
        renderCategories(currentCategories);
        populateParentSelect(currentCategories);
        document.getElementById('statTotal').innerText = currentCategories.length;

    } catch (err) {
        console.warn('API offline, using mock categories data', err);
        if (statusBadge) {
            statusBadge.innerHTML = '<span class="status-dot" style="background: var(--warning); box-shadow: 0 0 8px var(--warning);"></span> Demo Mode';
            statusBadge.style.color = 'var(--warning)';
        }
        
        currentCategories = mockCategories.filter(c => {
            const matchSearch = !searchVal || c.name.toLowerCase().includes(searchVal.toLowerCase());
            const matchGender = !genderVal || c.gender === genderVal;
            return matchSearch && matchGender;
        });
        renderCategories(currentCategories);
        populateParentSelect(mockCategories);
        document.getElementById('statTotal').innerText = mockCategories.length;
    }
}

function populateParentSelect(list) {
    const addParent = document.getElementById('addParentId');
    const editParent = document.getElementById('editParentId');
    const options = '<option value="">-- Không có (Danh mục gốc) --</option>' + 
        list.map(c => `<option value="${c.categoryId}">${c.name}</option>`).join('');

    if (addParent) addParent.innerHTML = options;
    if (editParent) editParent.innerHTML = options;
}

function renderCategories(list) {
    const tbody = document.getElementById('tableTbody');
    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">Không tìm thấy danh mục nào</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(c => `
        <tr>
            <td><strong>#CAT-${c.categoryId}</strong></td>
            <td><strong style="color: #ffffff;">${c.name}</strong></td>
            <td>${c.parentName ? `<span class="role-tag role-staff">📁 ${c.parentName}</span>` : '<span style="color: var(--text-muted);">Gốc (Root)</span>'}</td>
            <td><span class="role-tag role-customer">${c.gender || 'Unisex'}</span></td>
            <td>${c.season || 'Tất cả'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action" onclick="openEditModal(${c.categoryId})">✏️ Sửa</button>
                    <button class="btn-action btn-lock" onclick="deleteCategory(${c.categoryId})">🗑️ Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddModal() {
    document.getElementById('addModal').style.display = 'flex';
}

function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
}

async function createCategory(e) {
    e.preventDefault();
    const name = document.getElementById('addName').value;
    const gender = document.getElementById('addGender').value;
    const season = document.getElementById('addSeason').value;
    const parentId = document.getElementById('addParentId').value ? parseInt(document.getElementById('addParentId').value) : null;

    const payload = { name, gender, season, parentId };

    try {
        await fetch('http://localhost:8080/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        closeAddModal();
        fetchCategories();
    } catch (err) {
        const parent = mockCategories.find(x => x.categoryId === parentId);
        mockCategories.push({ categoryId: mockCategories.length + 1, name, gender, season, parentId, parentName: parent ? parent.name : null, productCount: 0 });
        closeAddModal();
        fetchCategories();
    }
}

function openEditModal(id) {
    const c = currentCategories.find(x => x.categoryId === id) || mockCategories.find(x => x.categoryId === id);
    if (!c) return;

    document.getElementById('editCategoryId').value = c.categoryId;
    document.getElementById('editName').value = c.name || '';
    document.getElementById('editGender').value = c.gender || 'unisex';
    document.getElementById('editSeason').value = c.season || '';
    document.getElementById('editParentId').value = c.parentId || '';

    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function saveEdit(e) {
    e.preventDefault();
    const id = document.getElementById('editCategoryId').value;
    const name = document.getElementById('editName').value;
    const gender = document.getElementById('editGender').value;
    const season = document.getElementById('editSeason').value;
    const parentId = document.getElementById('editParentId').value ? parseInt(document.getElementById('editParentId').value) : null;

    try {
        await fetch(`http://localhost:8080/api/admin/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, gender, season, parentId })
        });
        closeEditModal();
        fetchCategories();
    } catch (err) {
        const c = mockCategories.find(x => x.categoryId == id);
        if (c) {
            const parent = mockCategories.find(x => x.categoryId === parentId);
            c.name = name; c.gender = gender; c.season = season; c.parentId = parentId; c.parentName = parent ? parent.name : null;
        }
        closeEditModal();
        fetchCategories();
    }
}

async function deleteCategory(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
        await fetch(`http://localhost:8080/api/admin/categories/${id}`, { method: 'DELETE' });
        fetchCategories();
    } catch (err) {
        mockCategories = mockCategories.filter(c => c.categoryId !== id);
        fetchCategories();
    }
}

window.addEventListener('DOMContentLoaded', fetchCategories);
