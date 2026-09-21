import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // check expiration
                if (decoded.exp * 1000 < Date.now()) {
                    localStorage.removeItem('token');
                } else {
                    setUser({
                        id: decoded.userId,
                        email: decoded.sub,
                        role: decoded.role ? decoded.role.replace('ROLE_', '').toLowerCase() : ''
                    });
                }
            } catch (err) {
                localStorage.removeItem('token');
            }
        }
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
