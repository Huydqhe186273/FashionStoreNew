import React from 'react';
import CustomerNavbar from './CustomerNavbar';

export default function CustomerLayout({ children }) {
  return (
    <div className="customer-layout">
      <CustomerNavbar />
      <main className="customer-main">{children}</main>
      <footer className="customer-footer">
        <div className="customer-footer-inner">
          <div className="customer-footer-col">
            <h4>FashionStore</h4>
            <p>Thời trang hiện đại – Phong cách cá tính – Giá tốt mỗi ngày.</p>
          </div>
          <div className="customer-footer-col">
            <h4>Hỗ trợ</h4>
            <ul>
              <li>Liên hệ</li>
              <li>Hướng dẫn mua hàng</li>
              <li>Chính sách đổi trả</li>
            </ul>
          </div>
          <div className="customer-footer-col">
            <h4>Liên hệ</h4>
            <ul>
              <li>📧 support@fashionstore.vn</li>
              <li>📞 1900 6868</li>
              <li>📍 TP. Hồ Chí Minh</li>
            </ul>
          </div>
        </div>
        <div className="customer-footer-bottom">© 2026 FashionStore. All rights reserved.</div>
      </footer>
    </div>
  );
}
