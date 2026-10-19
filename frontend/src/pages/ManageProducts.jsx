import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { getProducts, createProduct, updateProduct, toggleProductStatus } from '../services/productService';
import { getCategories } from '../services/categoryService';

const mockProducts = [
  { productId: 1, name: "Áo Polo Nam Premium Flex", categoryId: 1, categoryName: "Áo", basePrice: 350000, discountPrice: 299000, status: "active", soldCount: 142, description: "Áo Polo cotton thoáng mát" },
  { productId: 2, name: "Quần Jean Slimfit Co Giãn", categoryId: 2, categoryName: "Quần", basePrice: 550000, discountPrice: 480000, status: "active", soldCount: 98, description: "Quần Jean co giãn 4 chiều" },
  { productId: 3, name: "Váy Dáng Xòe Floral Spring", categoryId: 3, categoryName: "Váy", basePrice: 620000, discountPrice: 550000, status: "active", soldCount: 76, description: "Váy hoa nhí Hàn Quốc" },
  { productId: 4, name: "Áo Khoác Bomber Minimalist", categoryId: 1, categoryName: "Áo", basePrice: 850000, discountPrice: 750000, status: "inactive", soldCount: 24, description: "Áo khoác Bomber cao cấp" }
];

export default function ManageProducts() {
  const [products, setProducts] = useState(mockProducts);
  const [categories, setCategories] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State (Gộp Thêm & Sửa làm 1)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null: Thêm mới, object: Đang sửa

  const initialForm = {
    name: '',
    categoryId: 1,
    basePrice: '',
    status: 'active',
    description: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      }
    } catch (err) {
      console.warn('Could not load categories for product form:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts({ keyword: search, status: statusFilter });
      setProducts(data);
      setIsLive(true);
    } catch (err) {
      console.warn('Axios error, fallback mock products:', err);
      setIsLive(false);
      let filtered = mockProducts.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || p.status === statusFilter;
        return matchSearch && matchStatus;
      });
      setProducts(filtered);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, statusFilter]);

  useEffect(() => {
    loadCategories();
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      await toggleProductStatus(id);
      loadProducts();
    } catch (err) {
      setProducts(prev => prev.map(p => p.productId === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p));
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      ...initialForm,
      categoryId: categories.length > 0 ? categories[0].categoryId : 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      categoryId: prod.categoryId || (categories.length > 0 ? categories[0].categoryId : 1),
      basePrice: prod.basePrice !== undefined && prod.basePrice !== null ? prod.basePrice : (prod.discountPrice || ''),
      status: prod.status || 'active',
      description: prod.description || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(initialForm);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    const priceVal = parseFloat(formData.basePrice) || 0;
    const payload = {
      name: formData.name,
      categoryId: parseInt(formData.categoryId),
      basePrice: priceVal,
      discountPrice: null,
      status: formData.status,
      description: formData.description
    };

    if (editingProduct) {
      // Cập nhật sản phẩm
      try {
        await updateProduct(editingProduct.productId, payload);
        handleCloseModal();
        loadProducts();
      } catch (err) {
        setProducts(prev => prev.map(p => p.productId === editingProduct.productId ? { ...p, ...payload } : p));
        handleCloseModal();
      }
    } else {
      // Tạo sản phẩm mới
      try {
        await createProduct(payload);
        handleCloseModal();
        loadProducts();
      } catch (err) {
        const cat = categories.find(c => c.categoryId === payload.categoryId);
        setProducts(prev => [...prev, {
          ...payload,
          productId: prev.length + 1,
          categoryName: cat ? cat.name : 'Khác',
          soldCount: 0
        }]);
        handleCloseModal();
      }
    }
  };

  return (
    <main>
      <Header 
        title="Quản Lý Sản Phẩm Thời Trang" 
        subtitle="Thêm sản phẩm mới, chỉnh sửa giá bán, mô tả, danh mục và vô hiệu hóa / kích hoạt kinh doanh"
        isLive={isLive}
        onRefresh={loadProducts}
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6366f1' }}>📦</div>
          <div>
            <div className="stat-val">{products.length}</div>
            <div className="stat-label">Tổng Số Sản Phẩm</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>✅</div>
          <div>
            <div className="stat-val">{products.filter(p => p.status === 'active').length}</div>
            <div className="stat-label">Đang Kinh Doanh</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ef4444' }}>⛔</div>
          <div>
            <div className="stat-val">{products.filter(p => p.status === 'inactive').length}</div>
            <div className="stat-label">Đã Ngừng Bán</div>
          </div>
        </div>
      </div>

      <div className="toolbar-card">
        <div className="filter-group">
          <input 
            type="text" 
            className="input-control" 
            placeholder="Tìm tên sản phẩm..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <select className="select-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả Trạng Thái</option>
            <option value="active">Active (Đang bán)</option>
            <option value="inactive">Inactive (Ngừng bán)</option>
          </select>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>➕ Thêm Sản Phẩm Mới</button>
      </div>

      <div className="panel-card">
        <div className="table-responsive">
          <table style={{ minWidth: '950px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '100px', whiteSpace: 'nowrap' }}>Mã SP</th>
                <th style={{ minWidth: '220px', whiteSpace: 'nowrap' }}>Tên Sản Phẩm / Mô Tả</th>
                <th style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>Danh Mục</th>
                <th style={{ width: '140px', whiteSpace: 'nowrap' }}>Giá Bán Ra</th>
                <th style={{ width: '100px', whiteSpace: 'nowrap' }}>Đã Bán</th>
                <th style={{ width: '130px', whiteSpace: 'nowrap' }}>Trạng Thái</th>
                <th style={{ width: '180px', textAlign: 'center', whiteSpace: 'nowrap' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isActive = p.status === 'active';
                return (
                  <tr key={p.productId}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        border: '1px solid #dbeafe',
                        whiteSpace: 'nowrap'
                      }}>
                        #PRD-{p.productId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main, #111827)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.description || ''}</div>
                    </td>
                    <td><span className="role-tag role-staff">{p.categoryName || 'N/A'}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong style={{ color: 'var(--text-main, #111827)', fontSize: '0.95rem' }}>
                        {formatCurrency(p.basePrice || p.discountPrice)}
                      </strong>
                    </td>
                    <td><strong style={{ color: 'var(--success)' }}>{p.soldCount || 0}</strong> đã bán</td>
                    <td><span className={`badge ${isActive ? 'badge-active' : 'badge-inactive'}`}>{isActive ? '✅ Kinh doanh' : '⛔ Ngừng bán'}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons" style={{ justifyContent: 'center' }}>
                        <Link to={`/admin/variants?productId=${p.productId}`} className="btn-action" style={{ textDecoration: 'none' }} title="Xem và quản lý các size, màu sắc của sản phẩm này">
                          🏷️ Biến thể
                        </Link>
                        <button className="btn-action" onClick={() => handleOpenEdit(p)}>✏️ Sửa</button>
                        <button className={`btn-action ${isActive ? 'btn-lock' : 'btn-unlock'}`} onClick={() => handleToggleStatus(p.productId)}>
                          {isActive ? '⛔ Vô hiệu' : '✅ Kích hoạt'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Unified Product (Thêm / Sửa gộp làm 1) */}
      <Modal 
        isOpen={isModalOpen} 
        title={editingProduct ? `Chỉnh Sửa Sản Phẩm (#PRD-${editingProduct.productId})` : "Thêm Sản Phẩm Mới"} 
        onClose={handleCloseModal}
      >
        <form onSubmit={handleSubmitProduct}>
          <div className="form-group">
            <label>Tên Sản Phẩm</label>
            <input 
              type="text" 
              className="input-control" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              required 
              placeholder="ví dụ: Áo Polo Nam Premium Flex..." 
            />
          </div>
          <div className="form-group">
            <label>Danh Mục</label>
            {categories.length > 0 ? (
              <select 
                className="select-control" 
                value={formData.categoryId} 
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                {categories.map(cat => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.name} ({cat.gender || 'unisex'})
                  </option>
                ))}
              </select>
            ) : (
              <input 
                type="number" 
                className="input-control" 
                value={formData.categoryId} 
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })} 
                required 
              />
            )}
          </div>
          <div className="form-group">
            <label>Giá Bán Ra (VNĐ)</label>
            <input 
              type="number" 
              className="input-control" 
              value={formData.basePrice} 
              onChange={e => setFormData({ ...formData, basePrice: e.target.value })} 
              required 
              min="0"
              placeholder="ví dụ: 350000" 
            />
          </div>
          <div className="form-group">
            <label>Trạng Thái</label>
            <select 
              className="select-control" 
              value={formData.status} 
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active (Đang bán)</option>
              <option value="inactive">Inactive (Tạm ngừng)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mô Tả Sản Phẩm</label>
            <textarea 
              className="input-control" 
              rows="3" 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chất liệu, form dáng, tính năng..."
            ></textarea>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleCloseModal}>Hủy</button>
            <button type="submit" className="btn-primary">
              {editingProduct ? "Lưu Thay Đổi" : "Tạo Sản Phẩm"}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
