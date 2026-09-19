import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';

const mockCategories = [
  { categoryId: 1, name: "Áo", gender: "unisex", season: "Tất cả", parentId: null, parentName: null, productCount: 15 },
  { categoryId: 2, name: "Quần", gender: "unisex", season: "Tất cả", parentId: null, parentName: null, productCount: 12 },
  { categoryId: 3, name: "Váy", gender: "nu", season: "Xuân Hè", parentId: null, parentName: null, productCount: 8 },
  { categoryId: 4, name: "Áo sơ mi nam", gender: "nam", season: "Thu Đông", parentId: 1, parentName: "Áo", productCount: 5 }
];

export default function ManageCategories() {
  const [categories, setCategories] = useState(mockCategories);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);

  const [addForm, setAddForm] = useState({ name: '', gender: 'unisex', season: 'Tất cả', parentId: '' });
  const [editForm, setEditForm] = useState({ name: '', gender: 'unisex', season: 'Tất cả', parentId: '' });

  const loadCategories = async () => {
    try {
      const data = await getCategories({ keyword: search, gender: genderFilter });
      setCategories(data);
      setIsLive(true);
    } catch (err) {
      console.warn('Axios error, fallback mock categories:', err);
      setIsLive(false);
      let filtered = mockCategories.filter(c => {
        const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
        const matchGender = !genderFilter || c.gender === genderFilter;
        return matchSearch && matchGender;
      });
      setCategories(filtered);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [search, genderFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = {
      name: addForm.name,
      gender: addForm.gender,
      season: addForm.season,
      parentId: addForm.parentId ? parseInt(addForm.parentId) : null
    };

    try {
      await createCategory(payload);
      setIsAddOpen(false);
      setAddForm({ name: '', gender: 'unisex', season: 'Tất cả', parentId: '' });
      loadCategories();
    } catch (err) {
      const parent = mockCategories.find(x => x.categoryId === payload.parentId);
      setCategories(prev => [...prev, { ...payload, categoryId: prev.length + 1, parentName: parent ? parent.name : null }]);
      setIsAddOpen(false);
    }
  };

  const handleOpenEdit = (cat) => {
    setSelectedCat(cat);
    setEditForm({
      name: cat.name || '',
      gender: cat.gender || 'unisex',
      season: cat.season || '',
      parentId: cat.parentId || ''
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const payload = {
      name: editForm.name,
      gender: editForm.gender,
      season: editForm.season,
      parentId: editForm.parentId ? parseInt(editForm.parentId) : null
    };

    try {
      await updateCategory(selectedCat.categoryId, payload);
      setIsEditOpen(false);
      loadCategories();
    } catch (err) {
      setCategories(prev => prev.map(c => c.categoryId === selectedCat.categoryId ? { ...c, ...payload } : c));
      setIsEditOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (err) {
      setCategories(prev => prev.filter(c => c.categoryId !== id));
    }
  };

  return (
    <main>
      <Header 
        title="Quản Lý Danh Mục Sản Phẩm" 
        subtitle="Thêm danh mục mới, chỉnh sửa phân cấp danh mục (Parent-Child), giới tính và mùa thời trang"
        isLive={isLive}
        onRefresh={loadCategories}
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6366f1' }}>📁</div>
          <div>
            <div className="stat-val">{categories.length}</div>
            <div className="stat-label">Tổng Số Danh Mục</div>
          </div>
        </div>
      </div>

      <div className="toolbar-card">
        <div className="filter-group">
          <input 
            type="text" 
            className="input-control" 
            placeholder="Tìm tên danh mục..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <select className="select-control" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
            <option value="">Tất cả Giới tính</option>
            <option value="nam">Nam</option>
            <option value="nu">Nữ</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setIsAddOpen(true)}>➕ Thêm Danh Mục Mới</button>
      </div>

      <div className="panel-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Mã DM</th>
                <th>Tên Danh Mục</th>
                <th>Danh Mục Cha (Parent)</th>
                <th>Giới Tính</th>
                <th>Mùa (Season)</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.categoryId}>
                  <td><strong>#CAT-{c.categoryId}</strong></td>
                  <td><strong style={{ color: '#ffffff' }}>{c.name}</strong></td>
                  <td>{c.parentName ? <span className="role-tag role-staff">📁 {c.parentName}</span> : <span style={{ color: 'var(--text-muted)' }}>Gốc (Root)</span>}</td>
                  <td><span className="role-tag role-customer">{c.gender || 'Unisex'}</span></td>
                  <td>{c.season || 'Tất cả'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" onClick={() => handleOpenEdit(c)}>✏️ Sửa</button>
                      <button className="btn-action btn-lock" onClick={() => handleDelete(c.categoryId)}>🗑️ Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Category */}
      <Modal isOpen={isAddOpen} title="Thêm Danh Mục Mới" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Tên Danh Mục</label>
            <input type="text" className="input-control" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} required placeholder="ví dụ: Áo Sơ Mi..." />
          </div>
          <div className="form-group">
            <label>Danh Mục Cha</label>
            <select className="select-control" value={addForm.parentId} onChange={e => setAddForm({ ...addForm, parentId: e.target.value })}>
              <option value="">-- Không có (Danh mục gốc) --</option>
              {categories.map(cat => (
                <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Giới Tính</label>
            <select className="select-control" value={addForm.gender} onChange={e => setAddForm({ ...addForm, gender: e.target.value })}>
              <option value="unisex">Unisex</option>
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mùa Thích Hợp</label>
            <input type="text" className="input-control" value={addForm.season} onChange={e => setAddForm({ ...addForm, season: e.target.value })} placeholder="Xuân Hè, Thu Đông, Tất cả..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setIsAddOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Tạo Danh Mục</button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Category */}
      <Modal isOpen={isEditOpen} title="Chỉnh Sửa Danh Mục" onClose={() => setIsEditOpen(false)}>
        <form onSubmit={handleSaveEdit}>
          <div className="form-group">
            <label>Tên Danh Mục</label>
            <input type="text" className="input-control" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Danh Mục Cha</label>
            <select className="select-control" value={editForm.parentId} onChange={e => setEditForm({ ...editForm, parentId: e.target.value })}>
              <option value="">-- Không có (Danh mục gốc) --</option>
              {categories.map(cat => (
                <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Giới Tính</label>
            <select className="select-control" value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })}>
              <option value="unisex">Unisex</option>
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mùa Thích Hợp</label>
            <input type="text" className="input-control" value={editForm.season} onChange={e => setEditForm({ ...editForm, season: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setIsEditOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu Thay Đổi</button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
