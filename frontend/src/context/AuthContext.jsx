import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

const getUserFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
            if (decoded.userId != null) {
                localStorage.setItem('userId', String(decoded.userId));
            }
            // Restore fullName from localStorage if available (set during login)
            const savedFullName = localStorage.getItem('fullName');
            const validFullName = (savedFullName && !savedFullName.includes('@'))
                ? savedFullName
                : (decoded.fullName && !decoded.fullName.includes('@') ? decoded.fullName : undefined);

            return {
                id: decoded.userId,
                email: decoded.sub,
                role: decoded.role ? decoded.role.replace('ROLE_', '').toLowerCase() : '',
                fullName: validFullName
            };
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('fullName');
            return null;
        }
    } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('fullName');
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    // Khởi tạo state user đồng bộ từ token trong localStorage để không bị null khi F5
    const [user, setUser] = useState(getUserFromToken);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const currentUser = getUserFromToken();
        setUser(currentUser);
        setLoading(false);

        // Tự động đồng bộ thông tin tài khoản (đặc biệt fullName) từ backend
        const token = localStorage.getItem('token');
        if (token && currentUser) {
            api.get('/profile')
                .then((res) => {
                    const profileFullName = res.data?.fullName;
                    if (profileFullName && !profileFullName.includes('@')) {
                        localStorage.setItem('fullName', profileFullName);
                        setUser((prev) => (prev ? { ...prev, fullName: profileFullName } : prev));
                    }
                })
                .catch(() => {
                    // Bỏ qua lỗi ngầm nếu token hết hạn hoặc chưa sẵn sàng
                });
        }
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        if (userData?.id != null) {
            localStorage.setItem('userId', String(userData.id));
        } else {
            localStorage.removeItem('userId');
        }

        // Lấy tên người dùng hợp lệ (tránh chuỗi email)
        const cleanFullName = (userData?.fullName && !userData.fullName.includes('@'))
            ? userData.fullName
            : null;

        if (cleanFullName) {
            localStorage.setItem('fullName', cleanFullName);
        } else {
            localStorage.removeItem('fullName');
        }

        setUser({ ...userData, fullName: cleanFullName || undefined });

        // Nếu chưa có tên hợp lệ, gọi /profile ngay để cập nhật tên đầy đủ
        if (!cleanFullName) {
            api.get('/profile')
                .then((res) => {
                    if (res.data?.fullName) {
                        localStorage.setItem('fullName', res.data.fullName);
                        setUser((prev) => (prev ? { ...prev, fullName: res.data.fullName } : prev));
                    }
                })
                .catch(() => {});
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('fullName');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
