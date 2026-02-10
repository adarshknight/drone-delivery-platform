// Login Page

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Lock, User } from 'lucide-react';
import { useAuthStore } from '../stores/auth-store';
import { socketService } from '../services/socket';
import { UserRole } from '../types';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Mock authentication - in real app would use socket
        const mockUsers = [
            { id: 'user-1', username: 'admin', password: 'admin', role: UserRole.ADMIN },
            { id: 'user-2', username: 'restaurant1', password: 'rest123', role: UserRole.RESTAURANT_OPERATOR },
            { id: 'user-3', username: 'kiosk1', password: 'kiosk123', role: UserRole.KIOSK_OPERATOR },
        ];

        const user = mockUsers.find(u => u.username === username && u.password === password);

        if (user) {
            login({ id: user.id, username: user.username, role: user.role });
            socketService.connect();
            navigate('/dashboard');
        } else {
            setError('Invalid credentials. Try: admin/admin, restaurant1/rest123, or kiosk1/kiosk123');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
                        <Plane className="w-8 h-8 text-primary-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Drone Delivery</h1>
                    <p className="text-primary-100">Management & Simulation Platform</p>
                </div>

                <div className="bg-white rounded-lg shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        >
                            Sign In
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 font-medium mb-2">Demo Credentials:</p>
                        <div className="space-y-1 text-xs text-gray-500">
                            <p>• Admin: admin / admin</p>
                            <p>• Restaurant: restaurant1 / rest123</p>
                            <p>• Kiosk: kiosk1 / kiosk123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
