import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { getVariants, createVariant, updateVariant, deleteVariant, generateMatrixVariants } from '../services/variantService';
import { getProducts } from '../services/productService';
import { useToast } from '../context/ToastContext';

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
  const { toast } = useToast();

  // Matrix Generator State
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [matrixProductId, setMatrixProductId] = useState('');
  const [matrixColors, setMatrixColors] = useState(['Đen', 'Trắng']);
  const [newColorInput, setNewColorInput] = useState('');
  const [matrixSizes, setMatrixSizes] = useState(['S', 'M', 'L', 'XL']);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [matrixInitialStock, setMatrixInitialStock] = useState(0);
  const [isGeneratingMatrix, setIsGeneratingMatrix] = useState(false);
  const [matrixError, setMatrixError] = useState('');

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
      const [data, allVariants] = await Promise.all([
        getProducts(),
        getVariants().catch(() => [])
      ]);
      const countMap = {};
      if (Array.isArray(allVariants)) {
        allVariants.forEach(v => {
          if (v.productId) {
            countMap[v.productId] = (countMap[v.productId] || 0) + 1;
          }
        });
      }
      if (Array.isArray(data) && data.length > 0) {
        const enriched = data.map(p => ({
          ...p,
          variantCount: (p.variantCount !== undefined && p.variantCount !== null) ? p.variantCount : (countMap[p.productId] || 0)
        }));
        setProducts(enriched);
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

  const handleOpenMatrix = (prodId) => {
    const selectedId = prodId || productFilter || (products.length > 0 ? products[0].productId : '');
    setMatrixProductId(selectedId);
    setMatrixError('');
    setIsMatrixModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('openMatrix') === 'true' && products.length > 0) {
      const pid = searchParams.get('productId');
      if (pid) {
        setProductFilter(pid);
        handleOpenMatrix(pid);
      } else {
        handleOpenMatrix();
      }
    }
  }, [searchParams, products]);

  const handleAddColor = (color) => {
    const trimmed = (color || newColorInput).trim();
    if (!trimmed) return;
    if (!matrixColors.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setMatrixColors(prev => [...prev, trimmed]);
    }
    setNewColorInput('');
  };

  const handleRemoveColor = (colorToRemove) => {
    setMatrixColors(prev => prev.filter(c => c !== colorToRemove));
  };

  const handleAddSize = (size) => {
    const trimmed = (size || newSizeInput).trim();
    if (!trimmed) return;
    if (!matrixSizes.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setMatrixSizes(prev => [...prev, trimmed]);
    }
    setNewSizeInput('');
  };

  const handleRemoveSize = (sizeToRemove) => {
    setMatrixSizes(prev => prev.filter(s => s !== sizeToRemove));
  };

  const slugify = (text) => {
    if (!text) return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  };

  const handleSubmitMatrix = async (e) => {
    e.preventDefault();
    if (!matrixProductId) {
      setMatrixError('Vui lòng chọn sản phẩm cần sinh biến thể!');
      return;
    }
    if (matrixColors.length === 0) {
      setMatrixError('Vui lòng chọn hoặc nhập ít nhất 1 màu sắc!');
      return;
    }
    if (matrixSizes.length === 0) {
      setMatrixError('Vui lòng chọn hoặc nhập ít nhất 1 kích thước!');
      return;
    }

    setIsGeneratingMatrix(true);
    setMatrixError('');
    try {
      const payload = {
        productId: parseInt(matrixProductId),
        colors: matrixColors,
        sizes: matrixSizes,
        initialStock: parseInt(matrixInitialStock) || 0
      };
      
      let createdCount = 0;
      try {
        const res = await generateMatrixVariants(payload);
        createdCount = Array.isArray(res) ? res.length : 0;
      } catch (matrixErr) {
        // Fallback an toàn: Nếu Backend chưa kịp restart (chưa nạp route /matrix mới),
        // hệ thống tự động fallback tạo từng biến thể qua endpoint createVariant chuẩn!
        console.warn('Matrix endpoint unavailable, fallback to sequential creation:', matrixErr);
        const itemsToCreate = combinations.filter(item => !item.exists);
        for (const item of itemsToCreate) {
          const singlePayload = {
            productId: parseInt(matrixProductId),
            color: item.color.trim(),
            size: item.size.trim(),
            sku: item.sku,
            stockQuantity: parseInt(matrixInitialStock) || 0
          };
          try {
            await createVariant(singlePayload);
            createdCount++;
          } catch (createErr) {
            console.warn(`Bỏ qua biến thể trùng SKU hoặc lỗi (${item.sku}):`, createErr);
          }
        }
      }

      toast.success(`🎉 Đã sinh thành công ${createdCount} biến thể mới theo ma trận!`);
      setIsMatrixModalOpen(false);
      setProductFilter(String(matrixProductId));
      loadVariants();
      loadProducts();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Có lỗi xảy ra khi sinh biến thể!';
      setMatrixError(msg);
      toast.error('Lỗi sinh biến thể: ' + msg);
    } finally {
      setIsGeneratingMatrix(false);
    }
  };

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

    const stockNum = parseInt(formData.stockQuantity) || 0;
    if (stockNum < 0 || stockNum > 1000000) {
      setErrorMsg('Số lượng tồn kho phải nằm trong khoảng từ 0 đến 1,000,000!');
      return;
    }

    const cleanSku = (formData.sku || '').trim().toUpperCase();
    if (!cleanSku) {
      setErrorMsg('Mã SKU không được để trống!');
      return;
    }
    if (cleanSku.length > 50) {
      setErrorMsg('Mã SKU không được vượt quá 50 ký tự!');
      return;
    }
    if (!/^[A-Z0-9_-]+$/.test(cleanSku)) {
      setErrorMsg('Mã SKU chỉ được chứa ký tự chữ cái, số, gạch ngang (-) hoặc gạch dưới (_) !');
      return;
    }

    if (formData.size && formData.size.trim().length > 50) {
      setErrorMsg('Kích thước không được vượt quá 50 ký tự!');
      return;
    }
    if (formData.color && formData.color.trim().length > 50) {
      setErrorMsg('Màu sắc không được vượt quá 50 ký tự!');
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

  const currVariants = variants.filter(v => String(v.productId) === String(matrixProductId));
  const combinations = [];
  for (const c of matrixColors) {
    for (const s of matrixSizes) {
      const exists = currVariants.some(v => 
        (v.color || '').trim().toLowerCase() === c.trim().toLowerCase() &&
        (v.size || '').trim().toLowerCase() === s.trim().toLowerCase()
      );
      const skuPreview = `PRD${matrixProductId || 'X'}-${slugify(c) || 'DEF'}-${slugify(s) || 'STD'}`;
      combinations.push({ color: c, size: s, exists, sku: skuPreview });
    }
  }
  const newCombinationsCount = combinations.filter(item => !item.exists).length;

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

      {products.some(p => (!p.variantCount || p.variantCount === 0)) && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#92400e', fontSize: '0.92rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
            <span>
              Phát hiện <strong>{products.filter(p => !p.variantCount || p.variantCount === 0).length} sản phẩm</strong> chưa có bất kỳ biến thể nào! Khách hàng sẽ không thể đặt mua các sản phẩm này.
            </span>
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{
              backgroundColor: '#d97706',
              borderColor: '#b45309',
              padding: '7px 16px',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
            onClick={() => {
              const firstMissing = products.find(p => !p.variantCount || p.variantCount === 0);
              if (firstMissing) handleOpenMatrix(firstMissing.productId);
            }}
          >
            ⚡ Tạo Ma Trận Cho Sản Phẩm Thiếu Ngay
          </button>
        </div>
      )}

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
                #{p.productId} - {p.name} {(!p.variantCount || p.variantCount === 0) ? '⚠️ (Chưa có biến thể)' : `(${p.variantCount} biến thể)`}
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleOpenMatrix(productFilter || (products.length > 0 ? products[0].productId : ''))}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              borderColor: '#4338ca',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)'
            }}
          >
            ⚡ Tạo Ma Trận Biến Thể (Màu × Size)
          </button>
          <button className="btn-secondary" onClick={handleOpenAdd}>➕ Thêm Thủ Công</button>
        </div>
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

      {/* Modal Sinh Biến Thể Hàng Loạt Theo Ma Trận (Màu sắc x Kích thước) */}
      <Modal
        isOpen={isMatrixModalOpen}
        title="⚡ Sinh Ma Trận Biến Thể Tự Động (Màu × Size)"
        onClose={() => setIsMatrixModalOpen(false)}
      >
        <form onSubmit={handleSubmitMatrix}>
          {matrixError && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              marginBottom: '16px'
            }}>
              ⚠️ {matrixError}
            </div>
          )}

          {/* Chọn Sản Phẩm */}
          <div className="form-group">
            <label style={{ fontWeight: 600 }}>Sản Phẩm Cần Tạo Biến Thể *</label>
            <select
              className="select-control"
              value={matrixProductId}
              onChange={e => setMatrixProductId(e.target.value)}
              required
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map(p => (
                <option key={p.productId} value={p.productId}>
                  #{p.productId} - {p.name} {(!p.variantCount || p.variantCount === 0) ? '⚠️ [Chưa có biến thể]' : `(${p.variantCount} biến thể hiện có)`}
                </option>
              ))}
            </select>
          </div>

          {/* Chọn / Nhập Màu Sắc */}
          <div className="form-group" style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontWeight: 600, color: '#1e293b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>🎨 Danh Sách Màu Sắc ({matrixColors.length} màu đã chọn)</span>
              <small style={{ color: '#64748b' }}>Nhấp để thêm nhanh hoặc tự gõ</small>
            </label>
            
            {/* Quick Preset Colors */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {['Đen', 'Trắng', 'Xám', 'Xanh Navy', 'Be', 'Nâu', 'Xanh Rêu', 'Đỏ', 'Hồng', 'Vàng'].map(color => {
                const isSelected = matrixColors.some(c => c.toLowerCase() === color.toLowerCase());
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => isSelected ? handleRemoveColor(color) : handleAddColor(color)}
                    style={{
                      border: isSelected ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                      color: isSelected ? '#4338ca' : '#475569',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 700 : 500,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}{color}
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Nhập màu khác (ví dụ: Tím Than, Cam Pastel...)"
                value={newColorInput}
                onChange={e => setNewColorInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddColor();
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleAddColor()}
                style={{ padding: '0 16px', whiteSpace: 'nowrap' }}
              >
                + Thêm Màu
              </button>
            </div>

            {/* Selected Color Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {matrixColors.map(c => (
                <span
                  key={c}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backgroundColor: '#e0e7ff',
                    color: '#3730a3',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(c)}
                    style={{ border: 'none', background: 'none', color: '#4338ca', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Chọn / Nhập Kích Thước */}
          <div className="form-group" style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontWeight: 600, color: '#1e293b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>📏 Danh Sách Kích Thước ({matrixSizes.length} size đã chọn)</span>
              <small style={{ color: '#64748b' }}>Chọn gói size gợi ý hoặc tự gõ</small>
            </label>

            {/* Quick Size Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                onClick={() => setMatrixSizes(['S', 'M', 'L', 'XL', '2XL', '3XL'])}
              >
                👕 Áo/Quần (S - 3XL)
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                onClick={() => setMatrixSizes(['28', '29', '30', '31', '32', '33', '34'])}
              >
                👖 Quần Jean số (28 - 34)
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                onClick={() => setMatrixSizes(['Freesize'])}
              >
                ✨ Freesize
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                onClick={() => setMatrixSizes(['110', '120', '130', '140', '150'])}
              >
                👶 Trẻ Em (110 - 150)
              </button>
            </div>

            {/* Custom Size Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Nhập kích cỡ khác (ví dụ: 35, 4XL, XS...)"
                value={newSizeInput}
                onChange={e => setNewSizeInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSize();
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleAddSize()}
                style={{ padding: '0 16px', whiteSpace: 'nowrap' }}
              >
                + Thêm Size
              </button>
            </div>

            {/* Selected Size Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {matrixSizes.map(s => (
                <span
                  key={s}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  Size: {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(s)}
                    style={{ border: 'none', background: 'none', color: '#b45309', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Khung Xem Trước Ma Trận (Live Preview) */}
          <div style={{
            backgroundColor: '#f1f5f9',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ color: '#1e293b', fontSize: '0.92rem' }}>
                📋 Xem trước ma trận ({combinations.length} tổ hợp)
              </strong>
              <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                ✨ Sẽ tạo mới: {newCombinationsCount} | ⏭️ Bỏ qua đã có: {combinations.length - newCombinationsCount}
              </span>
            </div>

            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
              <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Màu Sắc</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Kích Thước</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>SKU Dự Kiến</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {combinations.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                        Vui lòng chọn ít nhất 1 màu và 1 size để xem bảng ma trận.
                      </td>
                    </tr>
                  ) : (
                    combinations.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{item.color}</td>
                        <td style={{ padding: '6px 10px' }}>{item.size}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#475569' }}>{item.sku}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                          {item.exists ? (
                            <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 600 }}>⏭️ Đã có (bỏ qua)</span>
                          ) : (
                            <span style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 700 }}>✨ Sẽ tạo mới</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <small style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '6px', display: 'block' }}>
              💡 Hệ thống tự động kiểm tra: Nếu biến thể đã tồn tại từ trước sẽ được giữ nguyên, không gây trùng lặp hay lỗi hệ thống.
            </small>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setIsMatrixModalOpen(false)} disabled={isGeneratingMatrix}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isGeneratingMatrix || newCombinationsCount === 0 || !matrixProductId}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                borderColor: '#4338ca',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isGeneratingMatrix ? '⏳ Đang sinh biến thể...' : `⚡ Xác Nhận Tạo ${newCombinationsCount} Biến Thể`}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
