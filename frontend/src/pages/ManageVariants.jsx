import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { getVariants, createVariant, updateVariant, deleteVariant } from '../services/variantService';
import { getProducts } from '../services/productService';

const mockVariants = [
  { variantId: 1, productId: 1, productName: "Áo Polo Nam Premium Flex", size: "M", color: "Đen", sku: "POLO-BLK-M", stockQuantity: 45 },
  { variantId: 2, productId: 1, productName: "Áo Polo Nam Premium Flex", size: "L", color: "Đen", sku: "POLO-BLK-L", stockQuantity: 30 },
  { variantId: 3, productId: 1, productName: "Áo Polo Nam Premium Flex", size: "M", color: "Trắng", sku: "POLO-WHT-M", stockQuantity: 50 },
  { variantId: 4, productId: 2, productName: "Quần Jean Slimfit Co Giãn", size: "30", color: "Xanh Đậm", sku: "JEAN-BLU-30", stockQuantity: 20 },
  { variantId: 5, productId: 2, productName: "Quần Jean Slimfit Co Giãn", size: "31", color: "Xanh Đậm", sku: "JEAN-BLU-31", stockQuantity: 0 }
];

export default function ManageVariants() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProdParam = searchParams.get('productId') || '';

  const [variants, setVariants] = useState(mockVariants);
  const [products, setProducts] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState(initialProdParam);
  const [stockFilter, setStockFilter] = useState(''); // 'in_stock', 'out_of_stock'


  // Modal State (Gộp Thêm & Sửa làm 1)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null); // null: Thêm mới, object: Đang sửa

  const initialForm = {
    productId: '',
    size: 'M',
    color: 'Đen',
    sku: '',
    stockQuantity: 0
  };
  const [formData, setFormData] = useState(initialForm);
  const [errorMsg, setErrorMsg] = useState('');

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
      }
    } catch (err) {
      console.warn('Axios error loading products for variants:', err);
    }
  };

  const loadVariants = async () => {
    try {
      const params = {};
      if (productFilter) params.productId = productFilter;
      if (search) params.keyword = search;
      const data = await getVariants(params);
      setVariants(data);
      setIsLive(true);
    } catch (err) {
      console.warn('Axios error, fallback mock variants:', err);
      setIsLive(false);
      let filtered = mockVariants.filter(v => {
        const matchSearch = !search || 
          v.sku.toLowerCase().includes(search.toLowerCase()) || 
          v.color.toLowerCase().includes(search.toLowerCase()) || 
          v.size.toLowerCase().includes(search.toLowerCase()) ||
          (v.productName && v.productName.toLowerCase().includes(search.toLowerCase()));
        const matchProduct = !productFilter || String(v.productId) === String(productFilter);
        return matchSearch && matchProduct;
      });
      setVariants(filtered);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadVariants();
  }, [search, productFilter]);

  const handleOpenAdd = () => {
    setEditingVariant(null);
    setErrorMsg('');
    setFormData({
      ...initialForm,
      productId: products.length > 0 ? products[0].productId : 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVariant(v);
    setErrorMsg('');
    setFormData({
      productId: v.productId || (products.length > 0 ? products[0].productId : 1),
      size: v.size || '',
      color: v.color || '',
      sku: v.sku || '',
      stockQuantity: v.stockQuantity !== undefined && v.stockQuantity !== null ? v.stockQuantity : 0
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVariant(null);
    setFormData(initialForm);
    setErrorMsg('');
  };

  const handleGenerateSku = () => {
    const prodId = formData.productId || 'PRD';
    const colorCode = (formData.color || 'CLR').slice(0, 3).toUpperCase();
    const sizeCode = (formData.size || 'SZ').toUpperCase();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData(prev => ({
      ...prev,
      sku: `PRD${prodId}-${colorCode}-${sizeCode}-${randomSuffix}`
    }));
  };

  const handleSubmitVariant = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (parseInt(formData.stockQuantity) < 0) {
      setErrorMsg('Số lượng tồn kho phải lớn hơn hoặc bằng 0!');
      return;
    }

    if (!formData.sku || !formData.sku.trim()) {
      setErrorMsg('Mã SKU không được để trống!');
      return;
    }

    const payload = {
      productId: parseInt(formData.productId),
      size: formData.size.trim(),
      color: formData.color.trim(),
      sku: formData.sku.trim().toUpperCase(),
      stockQuantity: editingVariant ? (editingVariant.stockQuantity || 0) : 0
    };

    if (editingVariant) {
      try {
        await updateVariant(editingVariant.variantId, payload);
        handleCloseModal();
        loadVariants();
      } catch (err) {
        const message = err.response?.data?.message || err.response?.data?.error || 'Có lỗi xảy ra khi cập nhật biến thể!';
        setErrorMsg(message);
      }
    } else {
      try {
        await createVariant(payload);
        handleCloseModal();
        loadVariants();
      } catch (err) {
        const message = err.response?.data?.message || err.response?.data?.error || 'Có lỗi xảy ra khi tạo biến thể!';
        setErrorMsg(message);
      }
    }
  };

  const handleDelete = async (id, sku) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa biến thể SKU: ${sku}?`)) return;

    try {
      await deleteVariant(id);
      loadVariants();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Không thể xóa biến thể này (có thể đã phát sinh trong đơn hàng)!';
      alert(`⚠️ Lỗi: ${message}`);
    }
  };

  const displayedVariants = variants.filter(v => {
    if (stockFilter === 'in_stock') return v.stockQuantity > 0;
    if (stockFilter === 'out_of_stock') return v.stockQuantity <= 0;
    return true;
  });

  const totalStock = variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
  const outOfStockCount = variants.filter(v => v.stockQuantity <= 0).length;

  return (
    <main>
      <Header 
        title="Quản Lý Biến Thể Sản Phẩm (Variants)" 
        subtitle="Quản lý chi tiết kích cỡ (Size), màu sắc (Color), mã SKU duy nhất và tồn kho (Stock Quantity)"
        isLive={isLive}
        onRefresh={loadVariants}
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6366f1' }}>🏷️</div>
          <div>
            <div className="stat-val">{variants.length}</div>
            <div className="stat-label">Tổng Số Biến Thể</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>📊</div>
          <div>
            <div className="stat-val">{totalStock}</div>
            <div className="stat-label">Tổng Tồn Kho (Pieces)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ef4444' }}>⚠️</div>
          <div>
            <div className="stat-val">{outOfStockCount}</div>
            <div className="stat-label">Biến Thể Hết Hàng</div>
          </div>
        </div>
      </div>

      <div className="toolbar-card">
        <div className="filter-group">
          <input 
            type="text" 
            className="input-control" 
            placeholder="Tìm theo SKU, màu, size, tên SP..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <select 
            className="select-control" 
            value={productFilter} 
            onChange={(e) => setProductFilter(e.target.value)}
          >
            <option value="">Tất cả Sản Phẩm</option>
            {products.map(p => (
              <option key={p.productId} value={p.productId}>
                #{p.productId} - {p.name}
              </option>
            ))}
          </select>
          <select 
            className="select-control" 
            value={stockFilter} 
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="">Tất cả Tồn Kho</option>
            <option value="in_stock">Còn hàng (&gt; 0)</option>
            <option value="out_of_stock">Hết hàng (= 0)</option>
          </select>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>➕ Thêm Biến Thể Mới</button>
      </div>

      <div className="panel-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Mã SKU</th>
                <th>Sản Phẩm Thuộc Về</th>
                <th>Kích Cỡ (Size)</th>
                <th>Màu Sắc (Color)</th>
                <th>Tồn Kho (Stock)</th>
                <th>Tình Trạng</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {displayedVariants.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Không tìm thấy biến thể nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                displayedVariants.map(v => {
                  const isOutOfStock = (v.stockQuantity || 0) <= 0;
                  return (
                    <tr key={v.variantId}>
                      <td>
                        <strong style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                          {v.sku}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main, #111827)' }}>
                          {v.productName ? v.productName : `Sản phẩm #${v.productId}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mã SP: #{v.productId}</div>
                      </td>
                      <td>
                        <span className="role-tag role-staff" style={{ minWidth: '40px', textAlign: 'center' }}>
                          {v.size || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                          <span style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            display: 'inline-block',
                            backgroundColor: v.color?.toLowerCase() === 'trắng' ? '#f8fafc' : 
                                            v.color?.toLowerCase() === 'đen' ? '#000000' :
                                            v.color?.toLowerCase() === 'đỏ' ? '#ef4444' :
                                            v.color?.toLowerCase() === 'xanh' || v.color?.toLowerCase() === 'xanh đậm' ? '#2563eb' : '#a855f7',
                            border: '1px solid #4b5563'
                          }}></span>
                          {v.color || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '1rem', color: isOutOfStock ? '#ef4444' : '#10b981' }}>
                          {v.stockQuantity || 0}
                        </strong>
                      </td>
                      <td>
                        <span className={`badge ${isOutOfStock ? 'badge-inactive' : 'badge-active'}`}>
                          {isOutOfStock ? '⛔ Hết hàng' : '✅ Sẵn sàng'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-action" onClick={() => handleOpenEdit(v)}>✏️ Sửa</button>
                          <button 
                            className="btn-action btn-lock" 
                            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }} 
                            onClick={() => handleDelete(v.variantId, v.sku)}
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Unified Variant (Thêm / Sửa gộp làm 1) */}
      <Modal 
        isOpen={isModalOpen} 
        title={editingVariant ? `Chỉnh Sửa Biến Thể (${editingVariant.sku})` : "Thêm Biến Thể Mới"} 
        onClose={handleCloseModal}
      >
        <form onSubmit={handleSubmitVariant}>
          {errorMsg && (
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.15)', 
              color: '#fca5a5', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              fontSize: '0.875rem',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="form-group">
            <label>Sản Phẩm (Product)</label>
            {products.length > 0 ? (
              <select 
                className="select-control" 
                value={formData.productId} 
                onChange={e => setFormData({ ...formData, productId: e.target.value })}
                required
              >
                {products.map(p => (
                  <option key={p.productId} value={p.productId}>
                    #{p.productId} - {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <input 
                type="number" 
                className="input-control" 
                value={formData.productId} 
                onChange={e => setFormData({ ...formData, productId: e.target.value })} 
                required 
                placeholder="Nhập Product ID..."
              />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Kích Cỡ (Size)</label>
              <input 
                type="text" 
                className="input-control" 
                value={formData.size} 
                onChange={e => setFormData({ ...formData, size: e.target.value })} 
                required 
                placeholder="S, M, L, XL, 30, 31, Freesize..." 
              />
            </div>
            <div className="form-group">
              <label>Màu Sắc (Color)</label>
              <input 
                type="text" 
                className="input-control" 
                value={formData.color} 
                onChange={e => setFormData({ ...formData, color: e.target.value })} 
                required 
                placeholder="Đen, Trắng, Xanh Navy..." 
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ margin: 0 }}>Mã SKU (Duy nhất toàn hệ thống)</label>
              <button 
                type="button" 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#60a5fa', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer', 
                  textDecoration: 'underline' 
                }}
                onClick={handleGenerateSku}
              >
                ⚡ Tự sinh SKU gợi ý
              </button>
            </div>
            <input 
              type="text" 
              className="input-control" 
              value={formData.sku} 
              onChange={e => setFormData({ ...formData, sku: e.target.value })} 
              required 
              placeholder="ví dụ: POLO-BLK-M-01" 
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ margin: 0, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Số Lượng Tồn Kho</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  background: '#fef3c7', 
                  color: '#b45309', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontWeight: '600',
                  border: '1px solid #fde68a'
                }}>
                  🔒 Quản lý theo Lô FIFO
                </span>
              </label>
              {editingVariant && (
                <button 
                  type="button" 
                  onClick={() => {
                    handleCloseModal();
                    navigate(window.location.pathname.startsWith('/staff') ? '/staff/inbound' : '/admin/inbound');
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--primary)', 
                    fontSize: '0.82rem', 
                    cursor: 'pointer', 
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'underline' 
                  }}
                >
                  📦 Đi tới Nhập Kho (Theo Lô)
                </button>
              )}
            </div>
            <input 
              type="number" 
              className="input-control" 
              value={editingVariant ? (formData.stockQuantity || 0) : 0} 
              disabled
              readOnly
              style={{ 
                backgroundColor: '#f3f4f6', 
                cursor: 'not-allowed', 
                color: '#1f2937', 
                fontWeight: '700',
                border: '1px solid #e5e7eb'
              }}
            />
            <small style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '6px', display: 'block', lineHeight: '1.4' }}>
              {editingVariant ? (
                <>
                  💡 <em>Số lượng tồn kho được quản lý tự động từ các đợt nhập kho theo nguyên tắc FIFO. Để tăng số lượng, vui lòng sang mục <strong>Nhập Kho (Theo Lô)</strong> để ghi nhận giá vốn và mã lô mới.</em>
                </>
              ) : (
                <>
                  💡 <em>Biến thể mới tạo sẽ khởi tạo với số lượng tồn kho = <strong>0</strong>. Sau khi lưu, hãy tạo <strong>Đợt Nhập Kho Mới</strong> để nhập hàng và phân bổ theo lô.</em>
                </>
              )}
            </small>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleCloseModal}>Hủy</button>
            <button type="submit" className="btn-primary">
              {editingVariant ? "Lưu Thay Đổi" : "Tạo Biến Thể"}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
