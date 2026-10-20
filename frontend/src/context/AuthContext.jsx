import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

const getUserFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
            return {
                id: decoded.userId,
                email: decoded.sub,
                role: decoded.role ? decoded.role.replace('ROLE_', '').toLowerCase() : ''
            };
        } else {
            localStorage.removeItem('token');
            return null;
        }
    } catch (err) {
        localStorage.removeItem('token');
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
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
