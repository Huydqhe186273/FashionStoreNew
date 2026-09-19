let mockUsers = [
    { userId: 1, fullName: "Nguyễn Văn A", email: "customer1@example.com", phone: "0987654321", role: "customer", status: "active", createdAt: "2026-02-15T10:30:00", totalOrders: 5 },
    { userId: 2, fullName: "Lê Hoàng C", email: "hoangc@example.com", phone: "0933445566", role: "customer", status: "active", createdAt: "2026-04-12T14:20:00", totalOrders: 8 },
    { userId: 3, fullName: "Phạm Minh D", email: "minhd@example.com", phone: "0977889900", role: "customer", status: "locked", createdAt: "2026-05-18T16:45:00", totalOrders: 1 }
];

let currentUsers = [];

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
}

async function fetchUsers() {
    const searchVal = document.getElementById('searchInput').value.trim();
    const statusVal = document.getElementById('statusFilter').value;
    const statusBadge = document.getElementById('apiStatusBadge');

    const queryParams = new URLSearchParams();
    if (searchVal) queryParams.append('keyword', searchVal);
    if (statusVal) queryParams.append('status', statusVal);

    try {
        const response = await fetch(`http://localhost:8080/api/admin/users?${queryParams.toString()}`);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        
        currentUsers = data;
        if (statusBadge) {
            statusBadge.innerHTML = '<span class="status-dot"></span> Backend Live Connected';
            statusBadge.style.color = 'var(--success)';
        }
        renderUsers(currentUsers);
        updateStats(currentUsers);

    } catch (err) {
        console.warn('API offline, using mock customer data', err);
        if (statusBadge) {
            statusBadge.innerHTML = '<span class="status-dot" style="background: var(--warning); box-shadow: 0 0 8px var(--warning);"></span> Demo Mode';
            statusBadge.style.color = 'var(--warning)';
        }
        
        currentUsers = mockUsers.filter(u => {
            const matchSearch = !searchVal || u.fullName.toLowerCase().includes(searchVal.toLowerCase()) || u.email.toLowerCase().includes(searchVal.toLowerCase());
            const matchStatus = !statusVal || u.status.toLowerCase() === statusVal.toLowerCase();
            return matchSearch && matchStatus;
        });
        renderUsers(currentUsers);
        updateStats(mockUsers);
    }
}

function updateStats(list) {
    document.getElementById('statTotal').innerText = list.length;
    document.getElementById('statActive').innerText = list.filter(u => u.status === 'active').length;
    document.getElementById('statLocked').innerText = list.filter(u => u.status === 'locked').length;
}

function renderUsers(list) {
    const tbody = document.getElementById('tableTbody');
    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">Không tìm thấy khách hàng nào</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(u => {
        const isLocked = u.status === 'locked';
        return `
            <tr>
                <td><strong>#CUST-${u.userId}</strong></td>
                <td>
                    <div style="font-weight: 600;">${u.fullName || 'Chưa cập nhật'}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${u.email}</div>
                </td>
                <td>${u.phone || 'Chưa có'}</td>
                <td>${formatDate(u.createdAt)}</td>
                <td><span class="badge ${isLocked ? 'badge-locked' : 'badge-active'}">${isLocked ? '🔒 Locked' : '✅ Active'}</span></td>
                <td><strong style="color: var(--primary);">${u.totalOrders || 0}</strong> đơn</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action" onclick="openEditModal(${u.userId})">✏️ Sửa</button>
                        <button class="btn-action ${isLocked ? 'btn-unlock' : 'btn-lock'}" onclick="toggleLock(${u.userId})">
                            ${isLocked ? '🔓 Mở Khóa' : '🔒 Khóa TK'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function toggleLock(userId) {
    try {
        await fetch(`http://localhost:8080/api/admin/users/${userId}/lock`, { method: 'PUT' });
        fetchUsers();
    } catch (err) {
        const u = mockUsers.find(x => x.userId === userId);
        if (u) u.status = u.status === 'locked' ? 'active' : 'locked';
        fetchUsers();
    }
}

function openEditModal(userId) {
    const u = currentUsers.find(x => x.userId === userId) || mockUsers.find(x => x.userId === userId);
    if (!u) return;

    document.getElementById('editUserId').value = u.userId;
    document.getElementById('editFullName').value = u.fullName || '';
    document.getElementById('editEmail').value = u.email || '';
    document.getElementById('editPhone').value = u.phone || '';
    document.getElementById('editStatus').value = u.status || 'active';

    document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function saveEdit(e) {
    e.preventDefault();
    const userId = document.getElementById('editUserId').value;
    const fullName = document.getElementById('editFullName').value;
    const phone = document.getElementById('editPhone').value;
    const status = document.getElementById('editStatus').value;

    try {
        await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, phone, status })
        });
        closeModal();
        fetchUsers();
    } catch (err) {
        const u = mockUsers.find(x => x.userId == userId);
        if (u) { u.fullName = fullName; u.phone = phone; u.status = status; }
        closeModal();
        fetchUsers();
    }
}

window.addEventListener('DOMContentLoaded', fetchUsers);
