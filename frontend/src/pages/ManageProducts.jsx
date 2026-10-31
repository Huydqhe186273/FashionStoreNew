import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ProductImageModal from '../components/ProductImageModal';
import { getProducts, createProduct, updateProduct, toggleProductStatus } from '../services/productService';
import { getVariants } from '../services/variantService';
import { getCategories } from '../services/categoryService';
import { uploadProductImage, addProductImageUrl } from '../services/productImageService';
import { useToast } from '../context/ToastContext';

const mockProducts = [
  { productId: 1, name: "Áo Polo Nam Premium Flex", categoryId: 1, categoryName: "Áo", basePrice: 350000, discountPrice: 299000, status: "active", soldCount: 142, description: "Áo Polo cotton thoáng mát" },
  { productId: 2, name: "Quần Jean Slimfit Co Giãn", categoryId: 2, categoryName: "Quần", basePrice: 550000, discountPrice: 480000, status: "active", soldCount: 98, description: "Quần Jean co giãn 4 chiều" },
  { productId: 3, name: "Váy Dáng Xòe Floral Spring", categoryId: 3, categoryName: "Váy", basePrice: 620000, discountPrice: 550000, status: "active", soldCount: 76, description: "Váy hoa nhí Hàn Quốc" },
  { productId: 4, name: "Áo Khoác Bomber Minimalist", categoryId: 1, categoryName: "Áo", basePrice: 850000, discountPrice: 750000, status: "inactive", soldCount: 24, description: "Áo khoác Bomber cao cấp" }
];

export default function ManageProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(mockProducts);
  const [categories, setCategories] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [variantFilter, setVariantFilter] = useState(''); // '' | 'missing' | 'has'

  // Modal State (Gộp Thêm & Sửa làm 1)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null: Thêm mới, object: Đang sửa
  const [imageModalProduct, setImageModalProduct] = useState(null); // Quản lý ảnh Cloudinary
  const [createdProductPrompt, setCreatedProductPrompt] = useState(null); // { productId, name }

  // State hình ảnh sản phẩm trong Modal Thêm / Sửa
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [productImageUrl, setProductImageUrl] = useState('');
  const [imageInputMode, setImageInputMode] = useState('file'); // 'file' | 'url'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
      const [prodsData, variantsData] = await Promise.all([
        getProducts({ keyword: search, status: statusFilter }),
        getVariants().catch(() => [])
      ]);
      const countMap = {};
      const stockMap = {};
      if (Array.isArray(variantsData)) {
        variantsData.forEach(v => {
          if (v.productId) {
            countMap[v.productId] = (countMap[v.productId] || 0) + 1;
            stockMap[v.productId] = (stockMap[v.productId] || 0) + (v.stockQuantity || 0);
          }
        });
      }
      const enriched = prodsData.map(p => ({
        ...p,
        variantCount: (p.variantCount !== undefined && p.variantCount !== null) ? p.variantCount : (countMap[p.productId] || 0),
        totalStock: (p.totalStock !== undefined && p.totalStock !== null) ? p.totalStock : (stockMap[p.productId] || 0)
      }));
      setProducts(enriched);
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
    setProductImageFile(null);
    setProductImagePreview(null);
    setProductImageUrl('');
    setImageInputMode('file');
    setFormData({
      ...initialForm,
      categoryId: categories.length > 0 ? categories[0].categoryId : 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setProductImageFile(null);
    setProductImagePreview(prod.primaryImageUrl || null);
    setProductImageUrl('');
    setImageInputMode('file');
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
    setProductImageFile(null);
    setProductImagePreview(null);
    setProductImageUrl('');
    setIsSubmitting(false);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
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

        // Tải ảnh mới lên Cloudinary nếu có chọn
        if (productImageFile) {
          try {
            await uploadProductImage(editingProduct.productId, productImageFile, true);
            toast.success('Đã cập nhật sản phẩm và tải ảnh mới lên Cloudinary!');
          } catch (imgErr) {
            toast.warning('Đã cập nhật thông tin nhưng lỗi tải ảnh: ' + (imgErr.response?.data?.message || imgErr.message));
          }
        } else if (productImageUrl.trim()) {
          try {
            await addProductImageUrl(editingProduct.productId, productImageUrl.trim(), true);
            toast.success('Đã cập nhật sản phẩm và lưu link ảnh!');
          } catch (imgErr) {
            toast.warning('Đã cập nhật thông tin nhưng lỗi lưu link ảnh: ' + (imgErr.response?.data?.message || imgErr.message));
          }
        } else {
          toast.success('Cập nhật sản phẩm thành công!');
        }

        handleCloseModal();
        loadProducts();
      } catch (err) {
        toast.error('Lỗi khi cập nhật sản phẩm: ' + (err.response?.data?.message || err.message));
        handleCloseModal();
      }
    } else {
      // Tạo sản phẩm mới
      try {
        const created = await createProduct(payload);
        const newId = created?.productId;

        if (newId) {
          if (productImageFile) {
            try {
              await uploadProductImage(newId, productImageFile, true);
              toast.success('Tạo sản phẩm và tải ảnh lên Cloudinary thành công!');
            } catch (imgErr) {
              toast.warning('Tạo sản phẩm thành công nhưng tải ảnh thất bại: ' + (imgErr.response?.data?.message || imgErr.message));
            }
          } else if (productImageUrl.trim()) {
            try {
              await addProductImageUrl(newId, productImageUrl.trim(), true);
              toast.success('Tạo sản phẩm và lưu link ảnh thành công!');
            } catch (imgErr) {
              toast.warning('Tạo sản phẩm thành công nhưng lưu link ảnh thất bại: ' + (imgErr.response?.data?.message || imgErr.message));
            }
          } else {
            toast.success('Tạo sản phẩm mới thành công!');
          }
        } else {
          toast.success('Tạo sản phẩm mới thành công!');
        }

        handleCloseModal();
        loadProducts();
        if (newId) {
          setCreatedProductPrompt({ productId: newId, name: payload.name });
        }
      } catch (err) {
        toast.error('Lỗi khi tạo sản phẩm: ' + (err.response?.data?.message || err.message));
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
        <div
          className="stat-card"
          onClick={() => setVariantFilter(variantFilter === 'missing' ? '' : 'missing')}
          style={{
            cursor: 'pointer',
            border: products.filter(p => !p.variantCount || p.variantCount === 0).length > 0 ? '1px solid #fecaca' : undefined,
            backgroundColor: products.filter(p => !p.variantCount || p.variantCount === 0).length > 0 ? '#fff5f5' : undefined
          }}
          title="Nhấp để lọc danh sách sản phẩm thiếu biến thể"
        >
          <div className="stat-icon" style={{ color: products.filter(p => !p.variantCount || p.variantCount === 0).length > 0 ? '#dc2626' : '#10b981' }}>
            {products.filter(p => !p.variantCount || p.variantCount === 0).length > 0 ? '⚠️' : '🎉'}
          </div>
          <div>
            <div className="stat-val" style={{ color: products.filter(p => !p.variantCount || p.variantCount === 0).length > 0 ? '#dc2626' : undefined }}>
              {products.filter(p => !p.variantCount || p.variantCount === 0).length}
            </div>
            <div className="stat-label">Chưa Có Biến Thể {products.filter(p => !p.variantCount || p.variantCount === 0).length > 0 ? '(Cần bổ sung)' : '(Đầy đủ)'}</div>
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
          <select
            className="select-control"
            value={variantFilter}
            onChange={(e) => setVariantFilter(e.target.value)}
            style={variantFilter === 'missing' ? { borderColor: '#ef4444', backgroundColor: '#fef2f2', color: '#b91c1c', fontWeight: 600 } : {}}
          >
            <option value="">Tất cả Biến Thể</option>
            <option value="missing">⚠️ Chưa có biến thể ({products.filter(p => !p.variantCount || p.variantCount === 0).length})</option>
            <option value="has">✅ Đã có biến thể ({products.filter(p => p.variantCount > 0).length})</option>
          </select>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>➕ Thêm Sản Phẩm Mới</button>
      </div>

      <div className="panel-card" style={{ padding: '16px' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center', padding: '10px 4px', whiteSpace: 'nowrap' }}>Ảnh</th>
                <th style={{ width: '65px', padding: '10px 4px', whiteSpace: 'nowrap' }}>Mã SP</th>
                <th style={{ minWidth: '160px', padding: '10px 6px' }}>Tên Sản Phẩm / Mô Tả</th>
                <th style={{ width: '100px', padding: '10px 4px', whiteSpace: 'nowrap' }}>Danh Mục</th>
                <th style={{ width: '110px', padding: '10px 6px', whiteSpace: 'nowrap' }}>Giá & Đã Bán</th>
                <th style={{ width: '140px', padding: '10px 6px', whiteSpace: 'nowrap' }}>Biến Thể & Kho</th>
                <th style={{ width: '100px', padding: '10px 4px', whiteSpace: 'nowrap' }}>Trạng Thái</th>
                <th style={{ width: '150px', textAlign: 'center', padding: '10px 4px', whiteSpace: 'nowrap' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {products
                .filter(p => {
                  if (variantFilter === 'missing') return !p.variantCount || p.variantCount === 0;
                  if (variantFilter === 'has') return p.variantCount > 0;
                  return true;
                })
                .map(p => {
                const isActive = p.status === 'active';
                const hasNoVariants = !p.variantCount || p.variantCount === 0;
                return (
                  <tr key={p.productId} style={hasNoVariants && isActive ? { backgroundColor: '#fffbfb' } : {}}>
                    <td style={{ textAlign: 'center', padding: '10px 6px' }}>
                      <div
                        onClick={() => setImageModalProduct(p)}
                        title="Nhấp để tải hoặc quản lý ảnh Cloudinary"
                        style={{
                          cursor: 'pointer',
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          margin: '0 auto',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.08)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {p.primaryImageUrl ? (
                          <img
                            src={p.primaryImageUrl}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement.innerHTML = '📷';
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '1.1rem', color: '#94a3b8' }}>📷</span>
                        )}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', padding: '10px 6px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        fontFamily: 'monospace',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        border: '1px solid #dbeafe',
                        whiteSpace: 'nowrap'
                      }}>
                        #{p.productId}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main, #111827)', fontSize: '0.9rem', lineHeight: '1.3' }}>{p.name}</div>
                      {p.description && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          maxWidth: '240px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '2px'
                        }}>
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 6px', whiteSpace: 'nowrap' }}>
                      <span className="role-tag role-staff" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                        {p.categoryName || 'N/A'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', padding: '10px 8px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main, #111827)', fontSize: '0.92rem' }}>
                        {formatCurrency(p.basePrice || p.discountPrice)}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                        {p.soldCount || 0} đã bán
                      </div>
                    </td>
                    <td style={{ padding: '10px 6px', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/variants?productId=${p.productId}&openMatrix=true`)}
                        style={{
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          backgroundColor: hasNoVariants ? '#fee2e2' : '#ecfdf5',
                          color: hasNoVariants ? '#dc2626' : '#059669',
                          border: hasNoVariants ? '1px solid #fca5a5' : '1px solid #a7f3d0',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                        title="Nhấp để tạo ma trận hoặc xem biến thể sản phẩm này"
                      >
                        {hasNoVariants ? '⚠️ 0 biến thể ↗' : `📦 ${p.variantCount} biến thể (${p.totalStock ?? 0} cái) ↗`}
                      </button>
                    </td>
                    <td style={{ padding: '10px 6px', whiteSpace: 'nowrap' }}>
                      <span className={`badge ${isActive ? 'badge-active' : 'badge-inactive'}`} style={{ padding: '4px 8px', fontSize: '0.76rem' }}>
                        {isActive ? '✅ Kinh doanh' : '⛔ Ngừng bán'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 6px', whiteSpace: 'nowrap' }}>
                      <div className="action-buttons" style={{ justifyContent: 'center', gap: '4px', flexWrap: 'nowrap' }}>
                        <button
                          className="btn-action"
                          onClick={() => setImageModalProduct(p)}
                          title="Tải ảnh lên Cloudinary & quản lý thư viện ảnh"
                          style={{ backgroundColor: '#eef2ff', borderColor: '#c7d2fe', color: '#4f46e5', padding: '4px 8px', fontSize: '0.78rem' }}
                        >
                          🖼️ Ảnh {p.images && p.images.length > 0 ? `(${p.images.length})` : ''}
                        </button>
                        <button
                          className="btn-action"
                          onClick={() => handleOpenEdit(p)}
                          title="Chỉnh sửa sản phẩm"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          className={`btn-action ${isActive ? 'btn-lock' : 'btn-unlock'}`}
                          onClick={() => handleToggleStatus(p.productId)}
                          title={isActive ? 'Ngừng bán sản phẩm' : 'Kích hoạt lại'}
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        >
                          {isActive ? '⛔ Ngừng' : '✅ Bán'}
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
          {/* Mục Thêm / Tải Ảnh Lên Cloudinary */}
          <div className="form-group" style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              <span>🖼️ Hình Ảnh Sản Phẩm (Lưu trên Cloudinary)</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setImageInputMode('file')}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    backgroundColor: imageInputMode === 'file' ? '#4f46e5' : '#e2e8f0',
                    color: imageInputMode === 'file' ? '#fff' : '#475569',
                  }}
                >
                  📁 Chọn File
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    backgroundColor: imageInputMode === 'url' ? '#4f46e5' : '#e2e8f0',
                    color: imageInputMode === 'url' ? '#fff' : '#475569',
                  }}
                >
                  🔗 Nhập Link
                </button>
              </div>
            </label>

            {imageInputMode === 'file' ? (
              <div>
                <input
                  type="file"
                  id="modal-product-image-file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) {
                      toast.error('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP, GIF)!');
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error('Dung lượng ảnh tối đa 10MB!');
                      return;
                    }
                    setProductImageFile(file);
                    const reader = new FileReader();
                    reader.onload = () => setProductImagePreview(reader.result);
                    reader.readAsDataURL(file);
                  }}
                />

                <div
                  onClick={() => document.getElementById('modal-product-image-file')?.click()}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '14px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '75px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
                >
                  {productImagePreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                      <img
                        src={productImagePreview}
                        alt="Xem trước ảnh"
                        style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                      />
                      <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#10b981' }}>
                          ✓ {productImageFile ? productImageFile.name : 'Ảnh đại diện hiện tại'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {productImageFile ? `(${(productImageFile.size / 1024).toFixed(1)} KB) - Tự động tải lên Cloudinary khi tạo` : 'Nhấp vào đây để chọn ảnh mới thay thế'}
                        </div>
                      </div>
                      {productImageFile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductImageFile(null);
                            setProductImagePreview(editingProduct?.primaryImageUrl || null);
                          }}
                          style={{ border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                          ✕ Hủy
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>☁️</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                        Nhấp để chọn ảnh tải lên Cloudinary
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 10MB)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  className="input-control"
                  placeholder="https://res.cloudinary.com/... hoặc link ảnh bất kỳ"
                  value={productImageUrl}
                  onChange={(e) => {
                    setProductImageUrl(e.target.value);
                    setProductImagePreview(e.target.value || null);
                  }}
                />
              </div>
            )}
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
            <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={isSubmitting}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "⏳ Đang lưu & tải ảnh..." : (editingProduct ? "Lưu Thay Đổi" : "Tạo Sản Phẩm")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Quản lý & Tải hình ảnh lên Cloudinary */}
      <ProductImageModal
        isOpen={Boolean(imageModalProduct)}
        product={imageModalProduct}
        onClose={() => setImageModalProduct(null)}
        onImagesUpdated={loadProducts}
      />

      {/* Modal Wizard: Nhắc nhở sinh biến thể ngay sau khi tạo sản phẩm thành công */}
      <Modal
        isOpen={Boolean(createdProductPrompt)}
        title="🎉 Sản Phẩm Mới Đã Tạo Thành Công!"
        onClose={() => setCreatedProductPrompt(null)}
      >
        <div style={{ textAlign: 'center', padding: '16px 8px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 16px'
          }}>
            ⚡
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            Sinh Biến Thể Cho #{createdProductPrompt?.productId} - {createdProductPrompt?.name}
          </h3>
          <p style={{ color: '#4b5563', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px' }}>
            Sản phẩm vừa tạo hiện <strong>chưa có biến thể (Màu sắc & Kích thước)</strong> nào. Nếu không thêm biến thể, khách hàng sẽ không thể chọn mua sản phẩm này trên cửa hàng.<br /><br />
            Bạn có muốn <strong>sinh tự động hàng loạt biến thể theo ma trận Màu × Size</strong> ngay bây giờ không?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCreatedProductPrompt(null)}
              style={{ padding: '10px 20px', borderRadius: '8px' }}
            >
              Để sau
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const pid = createdProductPrompt?.productId;
                setCreatedProductPrompt(null);
                navigate(`/admin/variants?productId=${pid}&openMatrix=true`);
              }}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                backgroundColor: '#4f46e5',
                borderColor: '#4338ca',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ⚡ Tạo Ma Trận Biến Thể Ngay
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
