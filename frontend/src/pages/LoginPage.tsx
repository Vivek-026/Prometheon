import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, Mail, Terminal, AlertTriangle } from 'lucide-react';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setAuth, token } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if already logged in
    useEffect(() => {
        if (token) {
            navigate('/dashboard', { replace: true });
        }
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token, user } = response.data;

            setAuth(user, access_token);

            const from = (location.state as any)?.from?.pathname || "/dashboard";
            navigate(from, { replace: true });
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError("Invalid email or password.");
            } else if (err.response?.status === 403) {
                setError("Account is deactivated.");
            } else if (err.code === 'ERR_NETWORK') {
                setError("Cannot reach the server. Is the backend running?");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#111111] p-4">
            <div className="w-full max-w-md">
                {/* Brand / Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="flex items-center gap-3 text-[#F97316] mb-2 scale-110">
                        <Terminal size={32} strokeWidth={2.5} />
                        <h1 className="text-3xl font-extrabold tracking-tighter uppercase leading-none font-mono">
                            Prometheon
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        Internal Project Management
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-[#1a1a1a] border border-[#2e2e2e] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#F97316] to-transparent opacity-50" />

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground ml-1 flex items-center gap-1.5">
                                    <Mail size={10} /> Email
                                </label>
                                <Input
                                    type="email"
                                    placeholder="you@prometheon.in"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-[#111] border-[#2e2e2e] focus:border-[#F97316] h-12"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground ml-1 flex items-center gap-1.5">
                                    <Lock size={10} /> Password
                                </label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-[#111] border-[#2e2e2e] focus:border-[#F97316] h-12"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 text-xs bg-red-950/20 border border-red-900/50 text-red-500 font-medium">
                                <AlertTriangle size={14} /> {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-sm bg-[#F97316] hover:bg-[#F97316]/90 text-black border-none font-semibold"
                            loading={loading}
                        >
                            Sign In
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
