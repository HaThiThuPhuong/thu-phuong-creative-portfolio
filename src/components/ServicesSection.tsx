import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Sparkles, Video, 
  Search, Layout, ClipboardList,
  ArrowRight, MessageCircle, Heart, Zap,
  Instagram, Facebook, Edit2, Trash2, Plus, Loader2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { compressImage } from '../lib/imageUtils';
import { fetchServices, fetchAssets, saveService, deleteService, saveAsset, deleteAsset } from '../services/api';

const ICON_MAP: Record<string, any> = {
  Camera, Sparkles, Video, Search, Layout, ClipboardList
};

interface Service {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  stat_label: string;
  stat_value: string;
  benefits: string[];
  image_url?: string;
  mode: string;
}

const ServiceForm = ({ isOpen, onClose, onSave, editingItem = null, mode }: any) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    icon_name: 'Sparkles',
    stat_label: 'Status',
    stat_value: 'Available',
    image_url: '',
    mode: mode,
    benefits: []
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        mode: mode // Ensure mode matches
      });
    } else {
      setFormData({
        title: '',
        description: '',
        icon_name: 'Sparkles',
        stat_label: 'Status',
        stat_value: 'Available',
        image_url: '',
        mode: mode,
        benefits: []
      });
    }
  }, [editingItem, mode, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 800, 0.4);
        setFormData((prev: any) => ({
          ...prev,
          image_url: compressed
        }));
      } catch (err) {
        console.error('Compression failed:', err);
        alert('Không thể nén ảnh.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[40px] w-full max-w-2xl p-8 shadow-2xl relative my-8"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-display text-[var(--accent)]">{editingItem?.id ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</h2>
            <p className="text-[10px] uppercase tracking-widest opacity-40">Cập nhật thông tin chuyên môn</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold opacity-40">Ảnh đại diện</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent)] group overflow-hidden relative"
              >
                {formData.image_url ? (
                  <img src={formData.image_url} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="text-gray-300 group-hover:text-[var(--accent)] mb-2" size={32} />
                    <span className="text-[10px] uppercase font-bold text-gray-300 group-hover:text-[var(--accent)]">Tải ảnh lên</span>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold opacity-40">Nhãn trạng thái</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm"
                  value={formData.stat_label || ''}
                  onChange={e => setFormData({ ...formData, stat_label: e.target.value })}
                  placeholder="VD: Status"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold opacity-40">Giá trị trạng thái</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold text-[var(--accent)]"
                  value={formData.stat_value || ''}
                  onChange={e => setFormData({ ...formData, stat_value: e.target.value })}
                  placeholder="VD: Available"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold opacity-40">Tiêu đề dịch vụ</label>
              <input 
                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold"
                value={formData.title || ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Tên dịch vụ..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold opacity-40">Mô tả chi tiết</label>
              <textarea 
                rows={4}
                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm resize-none"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về dịch vụ và kinh nghiệm..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold opacity-40">Lợi ích / Kỹ năng (JSON array)</label>
              <input 
                className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-mono"
                value={Array.isArray(formData.benefits) ? JSON.stringify(formData.benefits) : formData.benefits || '[]'}
                onChange={e => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData({ ...formData, benefits: parsed });
                  } catch {
                    setFormData({ ...formData, benefits: e.target.value });
                  }
                }}
                placeholder='["Kỹ năng 1", "Kỹ năng 2"]'
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold opacity-40">Icon</label>
              <select 
                className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm"
                value={formData.icon_name}
                onChange={e => setFormData({ ...formData, icon_name: e.target.value })}
              >
                {Object.keys(ICON_MAP).map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button onClick={onClose} className="flex-1 py-4 text-xs font-bold uppercase text-gray-400">Hủy</button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex-[2] bg-[var(--accent)] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (editingItem?.id ? 'Cập nhật' : 'Thêm mới')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ServiceCard = ({ service, isCenter, isAdmin, onEdit, onDelete }: { service: Service; isCenter: boolean; isAdmin?: boolean; onEdit?: (s: Service) => void; onDelete?: (id: string) => void }) => {
  const { isModelMode } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const Icon = ICON_MAP[service.icon_name] || Sparkles;

  const SOCIAL_CONTACTS = [
    { icon: Instagram, href: 'https://www.instagram.com/thuphuong_yams?', color: '#E4405F' },
    { icon: Facebook, href: 'https://www.facebook.com/share/17zvLV3sdQ/', color: '#1877F2' },
    { icon: MessageCircle, href: 'https://zalo.me/0325706636', color: '#0068FF' }
  ];

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ 
        scale: isCenter ? 1.05 : 0.95,
        opacity: isCenter ? 1 : 0.6
      }}
      className={`relative aspect-[3/4] rounded-[40px] flex flex-col overflow-hidden cursor-pointer transition-all duration-500
        ${isModelMode 
          ? 'bg-[#FFF0F5] text-[var(--accent)] border-2 border-dashed border-pink-200 shadow-xl' 
          : 'glass border border-white/20'
        }`}
    >
      {/* Background Image / Icon */}
      {service.image_url ? (
        <img 
          src={service.image_url} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
          referrerPolicy="no-referrer"
          alt={service.title}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Icon size={120} />
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-30 flex gap-2" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => onEdit?.(service)}
            className="p-2 bg-white/90 rounded-full text-blue-600 shadow-lg hover:scale-110 transition-transform"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => onDelete?.(service.id)}
            className="p-2 bg-white/90 rounded-full text-red-500 shadow-lg hover:scale-110 transition-transform"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Content Overlay */}
      <div className={`relative z-10 p-8 h-full flex flex-col justify-between ${service.image_url ? 'bg-gradient-to-t from-black/80 via-black/20 to-transparent text-white' : ''}`}>
        <div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg
            ${isModelMode ? 'bg-[var(--accent)] text-white' : 'bg-[var(--secondary)] text-[var(--accent)]'}`}
          >
            <Icon size={24} />
          </div>
          
          <h3 className={`text-xl md:text-2xl mb-4 leading-tight ${isModelMode ? 'font-display italic' : 'font-sans font-bold'}`}>
            {service.title || 'Service Title'}
          </h3>
          <p className={`text-xs md:text-sm leading-relaxed line-clamp-3 ${service.image_url ? 'text-white/80' : 'opacity-60'}`}>
            {service.description || 'Description coming soon...'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {isModelMode ? <Heart size={14} className={service.image_url ? "text-pink-300" : ""} /> : <Zap size={14} className="text-[var(--accent)]" />}
            <span className={`text-[9px] uppercase font-bold tracking-widest ${service.image_url ? 'text-white/70' : 'opacity-40'}`}>
              {service.stat_label || 'Status'}: {service.stat_value || 'Available'}
            </span>
          </div>
        </div>
      </div>

      {/* Booking Overlay - Slide In */}
      <AnimatePresence>
        {isHovered && isModelMode && !isAdmin && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-20 bg-[var(--accent)]/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-white space-y-6"
          >
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold tracking-[0.3em] mb-2 opacity-80">Ready to work?</p>
              <h4 className="text-2xl font-display italic">Booking Now</h4>
            </div>
            
            <div className="flex gap-4">
              {SOCIAL_CONTACTS.map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
                >
                  <social.icon size={20} />
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styled strawberry overlay for model mode */}
      {isModelMode && !service.image_url && (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent pointer-events-none" />
      )}
    </motion.div>
  );
};

export const ServicesSection = ({ isAdmin, mode: passedMode }: { isAdmin?: boolean; mode?: 'model' | 'ba' }) => {
  const { isModelMode } = useTheme();
  const [mode, setMode] = useState<'model' | 'ba'>(passedMode || (isModelMode ? 'model' : 'ba'));
  const [services, setServices] = useState<Service[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    if (passedMode) setMode(passedMode);
    else setMode(isModelMode ? 'model' : 'ba');
  }, [passedMode, isModelMode]);

  const loadServices = () => {
    fetchServices(mode).then(setServices).catch(console.error);
    fetchAssets(mode === 'model' ? 'model_expertise_bg' : 'ba_expertise_bg').then((data: any) => {
      if (data && data.length > 0) {
        // Use the most recent one
        setSectionBg(data[data.length - 1].url);
      } else {
        setSectionBg(null);
      }
    }).catch(console.error);
  };

  const [sectionBg, setSectionBg] = useState<string | null>(null);
  const [upBgLoading, setUpBgLoading] = useState(false);
  const sectionBgInputRef = useRef<HTMLInputElement>(null);

  const handleSectionBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUpBgLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 1000, 0.4);
        await saveAsset({
          type: mode === 'model' ? 'model_expertise_bg' : 'ba_expertise_bg',
          url: compressed,
          title: 'Expertise BG'
        });
        loadServices();
      } catch (err) { 
        console.error(err); 
        alert('Lỗi khi nén hoặc upload background.');
      } finally {
        setUpBgLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadServices();
  }, [mode]);

  const handleSaveService = async (data: any) => {
    try {
      await saveService(data);
      loadServices();
      setIsFormOpen(false);
      setEditingService(null);
    } catch (err) {
      console.error(err);
      alert('Không thể lưu dịch vụ.');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Xóa dịch vụ này?')) return;
    try {
      await deleteService(id);
      loadServices();
    } catch (err) {
      console.error(err);
      alert('Xóa thất bại.');
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % services.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + services.length) % services.length);
  };

  const getVisibleIndices = () => {
    if (services.length === 0) return [];
    if (services.length === 1) return [0];
    if (services.length === 2) return [0, 1];
    
    return [
      (currentIndex - 1 + services.length) % services.length,
      currentIndex,
      (currentIndex + 1) % services.length
    ];
  };

  const visibleIndices = getVisibleIndices();

  return (
    <section 
      id={isModelMode ? "model-services" : "ba-services"} 
      className="py-32 px-6 overflow-hidden relative bg-white/5 border-t border-[var(--accent)]/5"
    >
      {/* Background Section Image */}
      {sectionBg && (
        <div className="absolute inset-0 z-0">
          <img src={sectionBg} className="w-full h-full object-cover opacity-10 blur-[2px]" alt="Section BG" />
          <div className="absolute inset-0 bg-white/60" />
        </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-end justify-between mb-20 px-4 md:px-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <h2 className={`text-4xl md:text-5xl ${isModelMode ? 'font-display text-[var(--accent)]' : 'font-sans font-bold text-[var(--accent)]'}`}>
              Services & Expertise
            </h2>
            <div className={`h-[1px] bg-[var(--accent)] opacity-20 mt-4 transition-all duration-500 ${isModelMode ? 'w-48' : 'w-24'}`} />
          </motion.div>
          
          <div className="flex gap-4">
            {isAdmin && (
              <>
                {sectionBg && (
                  <button 
                    onClick={async () => {
                      if (!confirm('Xóa ảnh nền này?')) return;
                      const assets = await fetchAssets(isModelMode ? 'model_expertise_bg' : 'ba_expertise_bg');
                      if (assets.length > 0) {
                        const last = assets[assets.length - 1];
                        await deleteAsset(last.id);
                        loadServices();
                      }
                    }}
                    className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    title="Xóa nền"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button 
                  onClick={() => sectionBgInputRef.current?.click()}
                  disabled={upBgLoading}
                  className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                  title="Thay ảnh nền vùng"
                >
                  {upBgLoading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                </button>
                <input type="file" ref={sectionBgInputRef} className="hidden" accept="image/*" onChange={handleSectionBgUpload} />
                <button 
                  onClick={() => { setEditingService(null); setIsFormOpen(true); }}
                  className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  title="Thêm dịch vụ"
                >
                  <Plus size={24} />
                </button>
              </>
            )}
            {services.length > 3 && (
              <>
                <button 
                  onClick={handlePrev}
                  className="w-12 h-12 rounded-full border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all"
                >
                  <ArrowRight size={20} className="rotate-180" />
                </button>
                <button 
                  onClick={handleNext}
                  className="w-12 h-12 rounded-full border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all"
                >
                  <ArrowRight size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="relative overflow-visible px-4 md:px-12">
          <div className={`grid gap-8 items-center ${
            services.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 
            services.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' : 
            'grid-cols-1 md:grid-cols-3'
          }`}>
            {visibleIndices.map((i, idx) => (
              <motion.div
                key={`${services[i].id}-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                <ServiceCard 
                  service={services[i]} 
                  isCenter={services.length > 2 ? idx === 1 : true}
                  isAdmin={isAdmin}
                  onEdit={(s) => { setEditingService(s); setIsFormOpen(true); }}
                  onDelete={handleDeleteService}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <p className="mt-16 text-[10px] uppercase font-bold tracking-[0.6em] opacity-20 text-center">
          {isModelMode ? 'Swipe or tap arrows to explore' : 'Consulting & Strategy Services'}
        </p>
      </div>

      <ServiceForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveService}
        editingItem={editingService}
        mode={mode}
      />
    </section>
  );
};
