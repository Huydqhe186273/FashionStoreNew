let mockStaff = [
    { userId: 1, fullName: "Admin Hệ Thống", email: "admin@fashionstore.vn", phone: "0901234567", role: "admin", status: "active", createdAt: "2026-01-10T08:00:00" },
    { userId: 2, fullName: "Trần Thị B", email: "staff_thib@fashionstore.vn", phone: "0912345678", role: "staff", status: "active", createdAt: "2026-03-01T09:15:00" }
];

let currentStaff = [];

async function fetchStaff() {
    const searchVal = document.getElementById('searchInput').value.trim();
    const roleVal = document.getElementById('roleFilter').value;
    const statusVal = document.getElementById('statusFilter').value;
    const statusBadge = document.getElementById('apiStatusBadge');

    const queryParams = new URLSearchParams();
    if (searchVal) queryParams.append('keyword', searchVal);
    if (roleVal) queryParams.append('role', roleVal);
    if (statusVal) queryParams.append('status', statusVal);

    try {
        const response = await fetch(`http://localhost:8080/api/admin/staff?${queryParams.toString()}`);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        
        currentStaff = data;
        if (statusBadge) {
            statusBadge.innerHTML = '<span class="status-dot"></span> Backend Live Connected';
            statusBadge.style.color = 'var(--success)';
        }
        renderStaff(currentStaff);
        updateStats(currentStaff);

    } catch (err) {
        console.warn('API offline, using mock staff data', err);
        if (statusBadge) {
            statusBadge.innerHTML = '<span class="status-dot" style="background: var(--warning); box-shadow: 0 0 8px var(--warning);"></span> Demo Mode';
            statusBadge.style.color = 'var(--warning)';
        }
        
        currentStaff = mockStaff.filter(s => {
            const matchSearch = !searchVal || s.fullName.toLowerCase().includes(searchVal.toLowerCase()) || s.email.toLowerCase().includes(searchVal.toLowerCase());
            const matchRole = !roleVal || s.role.toLowerCase() === roleVal.toLowerCase();
            const matchStatus = !statusVal || s.status.toLowerCase() === statusVal.toLowerCase();
            return matchSearch && matchRole && matchStatus;
        });
        renderStaff(currentStaff);
        updateStats(mockStaff);
    }
}

function updateStats(list) {
    document.getElementById('statTotal').innerText = list.length;
    document.getElementById('statStaffRole').innerText = list.filter(s => s.role === 'staff').length;
    document.getElementById('statAdminRole').innerText = list.filter(s => s.role === 'admin').length;
}

function renderStaff(list) {
    const tbody = document.getElementById('tableTbody');
    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">Không tìm thấy nhân viên nào</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(s => {
        const isLocked = s.status === 'locked';
        const isAdmin = s.role === 'admin';
        return `
            <tr>
                <td><strong>#STF-${s.userId}</strong></td>
                <td>
                    <div style="font-weight: 600;">${s.fullName}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${s.email}</div>
                </td>
                <td>${s.phone || 'Chưa có'}</td>
                <td><span class="role-tag ${isAdmin ? 'role-admin' : 'role-staff'}">${isAdmin ? '👑 Admin' : '👔 Staff'}</span></td>
                <td><span class="badge ${isLocked ? 'badge-locked' : 'badge-active'}">${isLocked ? '🔒 Locked' : '✅ Active'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action" onclick="openEditModal(${s.userId})">✏️ Sửa Role</button>
                        <button class="btn-action ${isLocked ? 'btn-unlock' : 'btn-lock'}" onclick="toggleLock(${s.userId})">
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
        await fetch(`http://localhost:8080/api/admin/staff/${userId}/lock`, { method: 'PUT' });
        fetchStaff();
    } catch (err) {
        const s = mockStaff.find(x => x.userId === userId);
        if (s) s.status = s.status === 'locked' ? 'active' : 'locked';
        fetchStaff();
    }
}

function openAddModal() {
    document.getElementById('addModal').style.display = 'flex';
}

function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
}

async function createStaff(e) {
    e.preventDefault();
    const fullName = document.getElementById('addFullName').value;
    const email = document.getElementById('addEmail').value;
    const password = document.getElementById('addPassword').value;
    const phone = document.getElementById('addPhone').value;
    const role = document.getElementById('addRole').value;

    const payload = { fullName, email, password, phone, role, status: 'active' };

    try {
        await fetch('http://localhost:8080/api/admin/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        closeAddModal();
        fetchStaff();
    } catch (err) {
        mockStaff.push({ userId: mockStaff.length + 1, fullName, email, phone, role, status: 'active', createdAt: new Date().toISOString() });
        closeAddModal();
        fetchStaff();
    }
}

function openEditModal(userId) {
    const s = currentStaff.find(x => x.userId === userId) || mockStaff.find(x => x.userId === userId);
    if (!s) return;

    document.getElementById('editUserId').value = s.userId;
    document.getElementById('editFullName').value = s.fullName || '';
    document.getElementById('editRole').value = s.role || 'staff';
    document.getElementById('editStatus').value = s.status || 'active';

    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function saveEdit(e) {
    e.preventDefault();
    const userId = document.getElementById('editUserId').value;
    const fullName = document.getElementById('editFullName').value;
    const role = document.getElementById('editRole').value;
    const status = document.getElementById('editStatus').value;

    try {
        await fetch(`http://localhost:8080/api/admin/staff/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, role, status })
        });
        closeEditModal();
        fetchStaff();
    } catch (err) {
        const s = mockStaff.find(x => x.userId == userId);
        if (s) { s.fullName = fullName; s.role = role; s.status = status; }
        closeEditModal();
        fetchStaff();
    }
}

window.addEventListener('DOMContentLoaded', fetchStaff);
