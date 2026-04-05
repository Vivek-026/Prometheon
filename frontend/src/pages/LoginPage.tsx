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

        // Mock login check for demonstration
        if (email === "a@gmail.com" && password === "123456789") {
            setTimeout(() => {
                const mockUser = {
                    id: "u-mock-001",
                    name: "Alpha User",
                    email: "a@gmail.com",
                    role: "admin" as const,
                    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha"
                };
                setAuth(mockUser, "mock-jwt-token-alpha");
                const from = (location.state as any)?.from?.pathname || "/dashboard";
                navigate(from, { replace: true });
                setLoading(false);
            }, 800);
            return;
        }

        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token, user } = response.data;
            
            setAuth(user, access_token);
            
            // Redirect to original page or dashboard
            const from = (location.state as any)?.from?.pathname || "/dashboard";
            navigate(from, { replace: true });
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError("Invalid credentials");
            } else {
                setError("Authentication failed. Internal system error.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#111111] font-mono p-4">
            <div className="w-full max-w-md">
                {/* Brand / Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="flex items-center gap-3 text-[#F97316] mb-2 scale-110">
                        <Terminal size={32} strokeWidth={2.5} />
                        <h1 className="text-3xl font-extrabold tracking-tighter uppercase leading-none">
                            Prometheon
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">
                        [INTERNAL PROJECT MANAGEMENT]
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-[#1a1a1a] border border-[#2e2e2e] shadow-2xl relative overflow-hidden group">
                    {/* Industrial Accent Bar */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#F97316] to-transparent opacity-50" />
                    
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1 tracking-widest flex items-center gap-1.5">
                                    <Mail size={10} /> ACCESS IDENTIFIER / EMAIL
                                </label>
                                <Input 
                                    type="email" 
                                    placeholder="USER@PROMETHEON.NET"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-[#111] border-[#2e2e2e] focus:border-[#F97316] h-12"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1 tracking-widest flex items-center gap-1.5">
                                    <Lock size={10} /> ENCRYPTION KEY / PASSWORD
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
                            <div className="flex items-center gap-2 p-3 text-[11px] bg-red-950/20 border border-red-900/50 text-red-500 uppercase font-bold animate-pulse">
                                <AlertTriangle size={14} /> {error}
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            className="w-full h-12 text-sm bg-[#F97316] hover:bg-[#F97316]/90 text-black border-none"
                            loading={loading}
                        >
                            Establish Connection
                        </Button>

                        <div className="pt-4 border-t border-[#2e2e2e]/50 flex justify-between items-center text-[9px] text-muted-foreground uppercase tracking-widest group-hover:text-muted/60 transition-colors">
                            <span>REVISION: V0.8.2-BETA</span>
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                                SYSTEM OPTIMAL
                            </span>
                        </div>
                    </form>
                </div>

                {/* Footer decorations */}
                <div className="mt-8 grid grid-cols-3 gap-2 opacity-20 group">
                    <div className="h-[1px] bg-white transform -skew-x-12" />
                    <div className="h-[1px] bg-white transform -skew-x-12" />
                    <div className="h-[1px] bg-white transform -skew-x-12" />
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
