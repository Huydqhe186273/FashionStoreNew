import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { useToast } from '../context/ToastContext';

const mockCategories = [
  { categoryId: 1, name: "Áo", gender: "unisex", season: "Tất cả", parentId: null, parentName: null, productCount: 15 },
  { categoryId: 2, name: "Quần", gender: "unisex", season: "Tất cả", parentId: null, parentName: null, productCount: 12 },
  { categoryId: 3, name: "Váy", gender: "nu", season: "Xuân Hè", parentId: null, parentName: null, productCount: 8 },
  { categoryId: 4, name: "Áo sơ mi nam", gender: "nam", season: "Thu Đông", parentId: 1, parentName: "Áo", productCount: 5 }
];

export default function ManageCategories() {
  const { toast, confirm } = useToast();
  const [categories, setCategories] = useState(mockCategories);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Modal State (Gộp Thêm & Sửa làm 1)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null: Thêm mới, object: Đang sửa

  const initialForm = { name: '', gender: 'unisex', season: 'Tất cả', parentId: '' };
  const [formData, setFormData] = useState(initialForm);

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

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      gender: cat.gender || 'unisex',
      season: cat.season || '',
      parentId: cat.parentId || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData(initialForm);
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      gender: formData.gender,
      season: formData.season,
      parentId: formData.parentId ? parseInt(formData.parentId) : null
    };

    if (editingCategory) {
      // Cập nhật danh mục
      try {
        await updateCategory(editingCategory.categoryId, payload);
        handleCloseModal();
        loadCategories();
      } catch (err) {
        setCategories(prev => prev.map(c => c.categoryId === editingCategory.categoryId ? { ...c, ...payload } : c));
        handleCloseModal();
      }
    } else {
      // Tạo danh mục mới
      try {
        await createCategory(payload);
        handleCloseModal();
        loadCategories();
      } catch (err) {
        const parent = mockCategories.find(x => x.categoryId === payload.parentId);
        setCategories(prev => [...prev, { ...payload, categoryId: prev.length + 1, parentName: parent ? parent.name : null }]);
        handleCloseModal();
      }
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Xóa danh mục',
      message: 'Bạn có chắc chắn muốn xóa danh mục này không?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger'
    });
    if (!ok) return;
    try {
      await deleteCategory(id);
      loadCategories();
      toast.success('Đã xóa danh mục thành công!');
    } catch (err) {
      setCategories(prev => prev.filter(c => c.categoryId !== id));
      toast.success('Đã xóa danh mục!');
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
        <button className="btn-primary" onClick={handleOpenAdd}>➕ Thêm Danh Mục Mới</button>
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
                  <td><strong style={{ color: '#0f0f0fff' }}>{c.name}</strong></td>
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

      {/* Modal Thêm & Sửa Danh Mục (Đã gộp làm 1) */}
      <Modal
        isOpen={isModalOpen}
        title={editingCategory ? `Chỉnh Sửa Danh Mục (#CAT-${editingCategory.categoryId})` : "Thêm Danh Mục Mới"}
        onClose={handleCloseModal}
      >
        <form onSubmit={handleSubmitCategory}>
          <div className="form-group">
            <label>Tên Danh Mục</label>
            <input
              type="text"
              className="input-control"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="ví dụ: Áo Sơ Mi..."
            />
          </div>
          <div className="form-group">
            <label>Danh Mục Cha</label>
            <select
              className="select-control"
              value={formData.parentId}
              onChange={e => setFormData({ ...formData, parentId: e.target.value })}
            >
              <option value="">-- Không có (Danh mục gốc) --</option>
              {categories
                .filter(cat => !editingCategory || cat.categoryId !== editingCategory.categoryId)
                .map(cat => (
                  <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label>Giới Tính</label>
            <select
              className="select-control"
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="unisex">Unisex</option>
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mùa Thích Hợp</label>
            <input
              type="text"
              className="input-control"
              value={formData.season}
              onChange={e => setFormData({ ...formData, season: e.target.value })}
              placeholder="Xuân Hè, Thu Đông, Tất cả..."
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleCloseModal}>Hủy</button>
            <button type="submit" className="btn-primary">
              {editingCategory ? "Lưu Thay Đổi" : "Tạo Danh Mục"}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
