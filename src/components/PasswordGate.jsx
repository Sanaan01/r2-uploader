import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

// Simple password hash (not cryptographically secure, but fine for basic protection)
const hashPassword = (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
};

// Expected hash - set this to your password's hash
// Default password: "gallery2026" -> hash: "-1a2b3c4d" (example)
const EXPECTED_HASH = import.meta.env.VITE_PASSWORD_HASH || '-1kvjm4h';

function PasswordGate({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Check for saved authentication on mount
    useEffect(() => {
        const savedHash = localStorage.getItem('r2-uploader-auth');
        if (savedHash === EXPECTED_HASH) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const passwordHash = hashPassword(password);

        if (passwordHash === EXPECTED_HASH) {
            setIsAuthenticated(true);
            if (rememberMe) {
                localStorage.setItem('r2-uploader-auth', passwordHash);
            }
        } else {
            setError('Incorrect password');
            setPassword('');
        }
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
        );
    }

    // If authenticated, show the app
    if (isAuthenticated) {
        return children;
    }

    // Show password gate
    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* macOS-style window */}
                <div className="bg-[#2a2a2a] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                    {/* Title bar */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-[#323232] border-b border-white/10">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                            <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
                        </div>
                        <span className="flex-1 text-center text-sm text-gray-400 font-medium">
                            Authentication Required
                        </span>
                        <div className="w-12" /> {/* Spacer for centering */}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Gallery Uploader</h2>
                            <p className="text-sm text-gray-400 mt-1">Enter password to continue</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Password Input */}
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-12"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            {/* Remember Me Checkbox */}
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                                        ${rememberMe
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-gray-500 group-hover:border-gray-400'}`}
                                    >
                                        {rememberMe && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                                                <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                                    Remember me
                                </span>
                            </label>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!password}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                            >
                                Unlock
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-4">
                    Protected content • Contact admin for access
                </p>
            </div>
        </div>
    );
}

export default PasswordGate;
