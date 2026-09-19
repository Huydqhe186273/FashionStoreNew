import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { getProducts, createProduct, updateProduct, toggleProductStatus } from '../services/productService';

const mockProducts = [
  { productId: 1, name: "Áo Polo Nam Premium Flex", categoryId: 1, categoryName: "Áo", basePrice: 350000, discountPrice: 299000, status: "active", soldCount: 142, description: "Áo Polo cotton thoáng mát" },
  { productId: 2, name: "Quần Jean Slimfit Co Giãn", categoryId: 2, categoryName: "Quần", basePrice: 550000, discountPrice: 480000, status: "active", soldCount: 98, description: "Quần Jean co giãn 4 chiều" },
  { productId: 3, name: "Váy Dáng Xòe Floral Spring", categoryId: 3, categoryName: "Váy", basePrice: 620000, discountPrice: 550000, status: "active", soldCount: 76, description: "Váy hoa nhí Hàn Quốc" },
  { productId: 4, name: "Áo Khoác Bomber Minimalist", categoryId: 1, categoryName: "Áo", basePrice: 850000, discountPrice: 750000, status: "inactive", soldCount: 24, description: "Áo khoác Bomber cao cấp" }
];

export default function ManageProducts() {
  const [products, setProducts] = useState(mockProducts);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProd, setSelectedProd] = useState(null);

  const [addForm, setAddForm] = useState({ name: '', categoryId: 1, basePrice: '', discountPrice: '', status: 'active', description: '' });
  const [editForm, setEditForm] = useState({ name: '', categoryId: 1, basePrice: '', discountPrice: '', status: 'active', description: '' });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
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

  const handleToggleStatus = async (id) => {
    try {
      await toggleProductStatus(id);
      loadProducts();
    } catch (err) {
      setProducts(prev => prev.map(p => p.productId === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = {
      name: addForm.name,
      categoryId: parseInt(addForm.categoryId),
      basePrice: parseFloat(addForm.basePrice),
      discountPrice: addForm.discountPrice ? parseFloat(addForm.discountPrice) : null,
      status: addForm.status,
      description: addForm.description
    };

    try {
      await createProduct(payload);
      setIsAddOpen(false);
      setAddForm({ name: '', categoryId: 1, basePrice: '', discountPrice: '', status: 'active', description: '' });
      loadProducts();
    } catch (err) {
      setProducts(prev => [...prev, { ...payload, productId: prev.length + 1, categoryName: 'Áo', soldCount: 0 }]);
      setIsAddOpen(false);
    }
  };

  const handleOpenEdit = (prod) => {
    setSelectedProd(prod);
    setEditForm({
      name: prod.name || '',
      categoryId: prod.categoryId || 1,
      basePrice: prod.basePrice || '',
      discountPrice: prod.discountPrice || '',
      status: prod.status || 'active',
      description: prod.description || ''
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const payload = {
      name: editForm.name,
      categoryId: parseInt(editForm.categoryId),
      basePrice: parseFloat(editForm.basePrice),
      discountPrice: editForm.discountPrice ? parseFloat(editForm.discountPrice) : null,
      status: editForm.status,
      description: editForm.description
    };

    try {
      await updateProduct(selectedProd.productId, payload);
      setIsEditOpen(false);
      loadProducts();
    } catch (err) {
      setProducts(prev => prev.map(p => p.productId === selectedProd.productId ? { ...p, ...payload } : p));
      setIsEditOpen(false);
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
        <button className="btn-primary" onClick={() => setIsAddOpen(true)}>➕ Thêm Sản Phẩm Mới</button>
      </div>

      <div className="panel-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Mã SP</th>
                <th>Tên Sản Phẩm / Mô Tả</th>
                <th>Danh Mục</th>
                <th>Giá Bán</th>
                <th>Đã Bán</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isActive = p.status === 'active';
                return (
                  <tr key={p.productId}>
                    <td><strong>#PRD-{p.productId}</strong></td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.description || ''}</div>
                    </td>
                    <td><span className="role-tag role-staff">{p.categoryName || 'N/A'}</span></td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{formatCurrency(p.discountPrice || p.basePrice)}</div>
                      {p.discountPrice ? <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatCurrency(p.basePrice)}</div> : null}
                    </td>
                    <td><strong style={{ color: 'var(--success)' }}>{p.soldCount || 0}</strong> đã bán</td>
                    <td><span className={`badge ${isActive ? 'badge-active' : 'badge-inactive'}`}>{isActive ? '✅ Kinh doanh' : '⛔ Ngừng bán'}</span></td>
                    <td>
                      <div className="action-buttons">
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

      {/* Modal Add Product */}
      <Modal isOpen={isAddOpen} title="Thêm Sản Phẩm Mới" onClose={() => setIsAddOpen(false)}>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Tên Sản Phẩm</label>
            <input type="text" className="input-control" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Mã Danh Mục (CategoryId)</label>
            <input type="number" className="input-control" value={addForm.categoryId} onChange={e => setAddForm({ ...addForm, categoryId: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Giá Gốc (Base Price - VNĐ)</label>
            <input type="number" className="input-control" value={addForm.basePrice} onChange={e => setAddForm({ ...addForm, basePrice: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Giá Khuyến Mãi (Discount Price - VNĐ)</label>
            <input type="number" className="input-control" value={addForm.discountPrice} onChange={e => setAddForm({ ...addForm, discountPrice: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Trạng Thái</label>
            <select className="select-control" value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })}>
              <option value="active">Active (Bán ngay)</option>
              <option value="inactive">Inactive (Tạm ngừng)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mô Tả Sản Phẩm</label>
            <textarea className="input-control" rows="3" value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })}></textarea>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setIsAddOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Tạo Sản Phẩm</button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Product */}
      <Modal isOpen={isEditOpen} title="Chỉnh Sửa Sản Phẩm" onClose={() => setIsEditOpen(false)}>
        <form onSubmit={handleSaveEdit}>
          <div className="form-group">
            <label>Tên Sản Phẩm</label>
            <input type="text" className="input-control" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Mã Danh Mục (CategoryId)</label>
            <input type="number" className="input-control" value={editForm.categoryId} onChange={e => setEditForm({ ...editForm, categoryId: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Giá Gốc (Base Price - VNĐ)</label>
            <input type="number" className="input-control" value={editForm.basePrice} onChange={e => setEditForm({ ...editForm, basePrice: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Giá Khuyến Mãi (Discount Price - VNĐ)</label>
            <input type="number" className="input-control" value={editForm.discountPrice} onChange={e => setEditForm({ ...editForm, discountPrice: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Trạng Thái</label>
            <select className="select-control" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="active">Active (Kinh doanh)</option>
              <option value="inactive">Inactive (Ngừng bán)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mô Tả Sản Phẩm</label>
            <textarea className="input-control" rows="3" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}></textarea>
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
