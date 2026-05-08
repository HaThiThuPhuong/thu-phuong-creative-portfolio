import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Loader2 } from 'lucide-react';
import { login as apiLogin } from '../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError('');

    try {
      const res = await apiLogin(password);
      if (res.user) {
        onSuccess(res.user);
        onClose();
        setPassword('');
      } else {
        setError('Thông tin đăng nhập không hợp lệ');
      }
    } catch (err: any) {
      setError(err.message || 'Sai mật khẩu hoặc lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                <Lock size={24} />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-1">Admin Access</h2>
                <p className="text-white/40 text-sm italic font-mono">Quản trị viên Thu Phương</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2 ml-1">
                  Mật khẩu hệ thống
                </label>
                <input
                  autoFocus
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all placeholder:text-white/10"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs text-center font-medium"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-white text-black font-bold h-14 rounded-2xl flex items-center justify-center gap-2 hover:bg-[var(--accent)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <Lock size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
            
            <p className="text-[9px] text-white/20 text-center uppercase tracking-tighter mt-8">
              Powered by SQLite Engine • No Cloud Quotas
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
