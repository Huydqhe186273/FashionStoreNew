import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { getProductImages, uploadProductImage, addProductImageUrl, setPrimaryImage, deleteProductImage } from '../services/productImageService';
import { useToast } from '../context/ToastContext';

export default function ProductImageModal({ isOpen, onClose, product, onImagesUpdated }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [makePrimary, setMakePrimary] = useState(false);
  
  // URL upload state
  const [inputUrl, setInputUrl] = useState('');
  
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const loadImages = async () => {
    if (!product?.productId) return;
    setLoading(true);
    try {
      const data = await getProductImages(product.productId);
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Lỗi tải danh sách ảnh:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product?.productId) {
      loadImages();
      setSelectedFile(null);
      setFilePreview(null);
      setInputUrl('');
      setMakePrimary(false);
    }
  }, [isOpen, product?.productId]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP, GIF)!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng file vượt quá giới hạn 10MB!');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.warning('Vui lòng chọn một file ảnh trước khi tải lên!');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadProductImage(
        product.productId,
        selectedFile,
        images.length === 0 || makePrimary
      );
      toast.success('Đã tải ảnh lên Cloudinary và lưu link thành công!');
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadImages();
      if (onImagesUpdated) onImagesUpdated();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể tải ảnh lên Cloudinary!';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = async (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      toast.warning('Vui lòng nhập đường dẫn URL ảnh!');
      return;
    }

    setUploading(true);
    try {
      await addProductImageUrl(
        product.productId,
        inputUrl.trim(),
        images.length === 0 || makePrimary
      );
      toast.success('Đã lưu link ảnh vào sản phẩm thành công!');
      setInputUrl('');
      await loadImages();
      if (onImagesUpdated) onImagesUpdated();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể lưu đường dẫn ảnh!';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await setPrimaryImage(product.productId, imageId);
      toast.success('Đã đặt làm ảnh chính!');
      await loadImages();
      if (onImagesUpdated) onImagesUpdated();
    } catch (err) {
      toast.error('Không thể đặt ảnh chính: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi sản phẩm và Cloudinary?')) {
      return;
    }
    try {
      await deleteProductImage(product.productId, imageId);
      toast.success('Đã xóa ảnh thành công!');
      await loadImages();
      if (onImagesUpdated) onImagesUpdated();
    } catch (err) {
      toast.error('Lỗi khi xóa ảnh: ' + (err.response?.data?.message || err.message));
    }
  };

  if (!isOpen || !product) return null;

  return (
    <Modal
      isOpen={isOpen}
      title={`🖼️ Quản Lý Hình Ảnh - #${product.productId} ${product.name}`}
      onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Hộp chuyển chế độ tải ảnh */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: uploadMode === 'file' ? '#4f46e5' : '#e2e8f0',
                color: uploadMode === 'file' ? '#ffffff' : '#475569',
              }}
            >
              ☁️ Tải File Lên Cloudinary
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('url')}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: uploadMode === 'url' ? '#4f46e5' : '#e2e8f0',
                color: uploadMode === 'url' ? '#ffffff' : '#475569',
              }}
            >
              🔗 Thêm Link Ảnh Trực Tiếp
            </button>
          </div>

          {uploadMode === 'file' ? (
            <form onSubmit={handleUploadFile}>
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'border-color 0.2s'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                {filePreview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={filePreview}
                      alt="Xem trước ảnh tải lên"
                      style={{
                        maxHeight: '140px',
                        maxWidth: '100%',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                      ✓ Đã chọn: {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      (Nhấn để chọn file khác)
                    </span>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '6px' }}>📤</div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>
                      Nhấp để chọn ảnh hoặc kéo thả vào đây
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                      Chấp nhận JPG, PNG, WEBP, GIF (Dung lượng tối đa 10MB)
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={makePrimary}
                    onChange={(e) => setMakePrimary(e.target.checked)}
                  />
                  <span>Đặt làm ảnh đại diện chính của sản phẩm</span>
                </label>

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  style={{
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: uploading || !selectedFile ? 'not-allowed' : 'pointer',
                    opacity: uploading || !selectedFile ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {uploading ? '⏳ Đang tải lên...' : '🚀 Tải lên Cloudinary'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddUrl}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="url"
                  className="input-control"
                  placeholder="https://res.cloudinary.com/... hoặc link ảnh bất kỳ"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {uploading ? '⏳ Đang lưu...' : '➕ Thêm Link'}
                </button>
              </div>
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={makePrimary}
                    onChange={(e) => setMakePrimary(e.target.checked)}
                  />
                  <span>Đặt làm ảnh đại diện chính</span>
                </label>
              </div>
            </form>
          )}
        </div>

        {/* Danh sách hình ảnh đã có */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Danh sách ảnh ({images.length})
            </h4>
            {loading && <span style={{ fontSize: '0.85rem', color: '#6366f1' }}>Đang tải...</span>}
          </div>

          {images.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '36px 20px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #f1f5f9',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🖼️</div>
              <div style={{ fontWeight: 600, color: '#334155' }}>Sản phẩm này chưa có hình ảnh nào</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                Hãy tải ảnh lên Cloudinary để hiển thị trên website bán hàng
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: '14px'
            }}>
              {images.map((img) => (
                <div
                  key={img.imageId}
                  style={{
                    border: img.isPrimary ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: img.isPrimary ? '0 4px 12px rgba(79, 70, 229, 0.15)' : 'none',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  {/* Badge ảnh chính */}
                  {img.isPrimary && (
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      zIndex: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      ⭐ Ảnh Chính
                    </span>
                  )}

                  {/* Ảnh thu nhỏ */}
                  <div style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: '#f1f5f9'
                  }}>
                    <img
                      src={img.imageUrl}
                      alt={`Ảnh sản phẩm #${img.imageId}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="140"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="50%" fill="%2364748b" font-family="sans-serif" font-size="14" text-anchor="middle" dominant-baseline="middle">Lỗi tải ảnh</text></svg>';
                      }}
                    />
                  </div>

                  {/* Nút hành động */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                    {!img.isPrimary ? (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img.imageId)}
                        title="Đặt làm ảnh chính"
                        style={{
                          flex: 1,
                          fontSize: '0.75rem',
                          padding: '6px 4px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          color: '#334155',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        ⭐ Đặt làm chính
                      </button>
                    ) : (
                      <span style={{
                        flex: 1,
                        fontSize: '0.75rem',
                        padding: '6px 4px',
                        textAlign: 'center',
                        color: '#4f46e5',
                        fontWeight: 700
                      }}>
                        Đang làm ảnh chính
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(img.imageId)}
                      title="Xóa ảnh này"
                      style={{
                        fontSize: '0.75rem',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        backgroundColor: '#fef2f2',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chân modal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: '8px' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
