import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { 
  Ruler, Scissors, Shirt, Instagram, Camera, Calendar, 
  Sparkles, Facebook, MessageCircle, ArrowRight, Heart, 
  MapPin, Plus, Edit2, Trash2, ExternalLink, Loader2 
} from 'lucide-react';
import { HeroBanner } from './HeroBanner';
import { ServicesSection } from './ServicesSection';
import { ImageWrapper } from './ImageWrapper';
import { Modal } from './Modal';
import { GoogleMap } from './GoogleMap';
import { compressImage } from '../lib/imageUtils';
import { fetchProfile, fetchAssets, fetchCalendar, saveAsset, deleteAsset, saveCalendar, saveProfile } from '../services/api';

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/share/17zvLV3sdQ/',
  instagram: 'https://www.instagram.com/thuphuong_yams?igsh=a3d2Y3Vvb25vbWNh',
  zalo: 'https://zalo.me/0325706636'
};

const CreditInputGroup = ({ role, label, credits, addCredit, updateCredits, removeCredit, neededCount, onNeededCountChange }: any) => (
  <div className="space-y-2 border-b border-gray-100 pb-4 mb-4">
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">{label}</label>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-gray-400">Số lượng cần:</span>
          <input 
            type="number" 
            min="0"
            className="w-12 bg-gray-50 border-none rounded p-1 text-[10px] font-bold text-[var(--accent)]"
            value={neededCount || 0}
            onChange={e => onNeededCountChange(role, parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
      <button onClick={() => addCredit(role)} className="p-1 hover:bg-[var(--accent)]/10 rounded-full text-[var(--accent)]">
        <Plus size={14} />
      </button>
    </div>
    {credits[role].map((c: any, i: number) => (
      <div key={`${role}-${i}`} className="flex gap-2 items-center">
        <input 
          placeholder="Tên"
          className="w-1/3 bg-gray-50 border-none rounded-lg p-2 text-xs"
          value={c.name || ''}
          onChange={e => updateCredits(role, i, 'name', e.target.value)}
        />
        <input 
          placeholder="Link Facebook / Profile"
          className="flex-1 bg-gray-50 border-none rounded-lg p-2 text-xs"
          value={c.link || ''}
          onChange={e => updateCredits(role, i, 'link', e.target.value)}
        />
        <button onClick={() => removeCredit(role, i)} className="text-gray-300 hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    ))}
  </div>
);

const DiaryEntryForm = ({ isOpen, onClose, onSave, editingItem = null }: any) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    url: '',
    date: '',
    location: '',
    facebook_post_url: '',
    type: 'model_diary',
    grid_class: 'col-span-1 row-span-1',
    metadata: {
      credits: {
        model: [{ name: 'Phương Thu', link: 'https://www.facebook.com/share/17zvLV3sdQ/' }],
        photo: [],
        makeup: []
      },
      needed_counts: {
        model: 1,
        photo: 1,
        makeup: 1
      }
    }
  });

  useEffect(() => {
    if (editingItem) {
      const parsedMetadata = typeof editingItem.metadata === 'string' ? JSON.parse(editingItem.metadata) : editingItem.metadata;
      const parsedUrls = typeof editingItem.urls === 'string' ? JSON.parse(editingItem.urls) : (editingItem.urls || []);
      setFormData({
        ...editingItem,
        urls: parsedUrls,
        metadata: {
          credits: {
            model: parsedMetadata?.credits?.model || [],
            photo: parsedMetadata?.credits?.photo || [],
            makeup: parsedMetadata?.credits?.makeup || []
          },
          needed_counts: parsedMetadata?.needed_counts || { model: 1, photo: 1, makeup: 1 },
          location: parsedMetadata?.location || { name: editingItem.location, lat: 21.0285, lng: 105.8542 },
          date: parsedMetadata?.date || editingItem.date
        }
      });
    } else {
      setFormData({
        title: '',
        description: '',
        url: '',
        urls: [],
        date: new Date().toLocaleDateString('vi-VN'),
        location: '',
        facebook_post_url: '',
        type: editingItem?.type || 'model_diary',
        grid_class: 'col-span-1 row-span-1',
        metadata: {
          credits: {
            model: [{ name: 'Phương Thu', link: 'https://www.facebook.com/share/17zvLV3sdQ/' }],
            photo: [],
            makeup: []
          },
          needed_counts: {
            model: 1,
            photo: 1,
            makeup: 1
          }
        }
      });
    }
  }, [editingItem, isOpen]);

  const handleExtract = async () => {
    if (!formData.facebook_post_url) return;
    setLoading(true);
    try {
      const res = await fetch('/api/assets/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.facebook_post_url })
      });
      const data = await res.json();
      if (data.urls && data.urls.length > 0) {
        setFormData((prev: any) => ({
          ...prev,
          url: data.imageUrl || data.urls[0],
          urls: data.urls,
          title: prev.title || data.title || ''
        }));
      } else if (data.imageUrl) {
        setFormData((prev: any) => ({
          ...prev,
          url: data.imageUrl,
          urls: [data.imageUrl],
          title: prev.title || data.title || ''
        }));
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Extraction failed', error);
      alert('Không thể lấy ảnh tự động. Vui lòng kiểm tra lại link Facebook/Instagram.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    const promises = files.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const compressed = await compressImage(reader.result as string, 900, 0.5);
            resolve(compressed);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file as Blob);
      });
    });

    Promise.all(promises).then(results => {
      setFormData((prev: any) => ({
        ...prev,
        url: results[0],
        urls: [...(prev.urls || []), ...results]
      }));
      setLoading(false);
    }).catch(err => {
      console.error('Compression failed:', err);
      setLoading(false);
      alert('Không thể nén một số ảnh. Vui lòng thử lại.');
    });
  };

  const removeImage = (index: number) => {
    const newUrls = (formData.urls || []).filter((_: any, i: number) => i !== index);
    setFormData({
      ...formData,
      urls: newUrls,
      url: newUrls[0] || ''
    });
  };

  const updateCredits = (role: string, index: number, field: string, value: string) => {
    const newCredits = [...formData.metadata.credits[role]];
    newCredits[index] = { ...newCredits[index], [field]: value };
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        credits: { ...formData.metadata.credits, [role]: newCredits }
      }
    });
  };

  const addCredit = (role: string) => {
    const newCredits = [...formData.metadata.credits[role], { name: '', link: '' }];
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        credits: { ...formData.metadata.credits, [role]: newCredits }
      }
    });
  };

  const removeCredit = (role: string, index: number) => {
    const newCredits = formData.metadata.credits[role].filter((_: any, i: number) => i !== index);
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        credits: { ...formData.metadata.credits, [role]: newCredits }
      }
    });
  };

  const updateNeededCount = (role: string, count: number) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        needed_counts: { ...formData.metadata.needed_counts, [role]: count }
      }
    });
  };

  const handleSave = () => {
    onSave({
      ...formData,
      // Sync simple fields with metadata for backward compatibility/quick access
      location: formData.metadata.location?.name || formData.location,
      date: formData.metadata.date || formData.date,
      metadata: JSON.stringify(formData.metadata)
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[40px] w-full max-w-3xl my-8 relative overflow-hidden shadow-2xl"
      >
        <div className="bg-[var(--primary)] p-8 flex justify-between items-center border-b border-[var(--accent)]/10">
          <div>
            <h2 className="text-2xl font-display text-[var(--accent)]">{editingItem ? 'Chỉnh sửa Portfolio' : 'Thêm bộ ảnh mới'}</h2>
            <p className="text-[10px] uppercase tracking-widest opacity-40">Quản lý nội dung AI Studio</p>
          </div>
          <button onClick={onClose} className="text-[var(--accent)] opacity-40 hover:opacity-100 transition-opacity">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Left Column: Visual & Metadata */}
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="bg-[var(--secondary)]/30 p-6 rounded-3xl space-y-4">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-[var(--accent)]">Nguồn dữ liệu</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 bg-white border border-[var(--accent)]/10 rounded-xl p-3 text-sm"
                    placeholder="Dán link Facebook/Instagram..."
                    value={formData.facebook_post_url || ''}
                    onChange={e => setFormData({ ...formData, facebook_post_url: e.target.value })}
                  />
                  <button 
                    onClick={handleExtract}
                    disabled={loading}
                    className="bg-[var(--accent)] text-white rounded-xl px-6 py-2 text-xs font-bold shadow-lg shadow-[var(--accent)]/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : 'Tự lấy'}
                  </button>
                </div>

                <div className="flex items-center gap-4 py-1">
                  <div className="h-[1px] flex-1 bg-gray-100"></div>
                  <span className="text-[9px] uppercase font-bold opacity-30">Hoặc</span>
                  <div className="h-[1px] flex-1 bg-gray-100"></div>
                </div>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                >
                  <Camera size={16} /> Tải nhiều ảnh trực tiếp
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  multiple
                  onChange={handleFileUpload} 
                />
                
                {formData.urls && formData.urls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {formData.urls.map((img: string, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 group">
                        <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!formData.urls && formData.url && (
                   <div className="aspect-square rounded-2xl overflow-hidden border border-[var(--accent)]/10 mt-4">
                    <img src={formData.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-bold tracking-widest opacity-40">Thông tin cơ bản</label>
                <input 
                  placeholder="Tên Concept / Bộ ảnh"
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm"
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
                <textarea 
                  placeholder="Mô tả bộ ảnh / Concept vibe..."
                  className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm min-h-[80px]"
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    placeholder="Ngày (VD: 15/07/2025)"
                    className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs"
                    value={formData.date || ''}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                  <input 
                    placeholder="Địa điểm"
                    className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs"
                    value={formData.location || ''}
                    onChange={e => setFormData({ 
                      ...formData, 
                      location: e.target.value,
                      metadata: {
                        ...formData.metadata,
                        location: { ...formData.metadata.location, name: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest opacity-40 mb-2">Kích thước hiển thị</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '1x1', val: 'col-span-1 row-span-1' },
                    { label: '2x1', val: 'col-span-2 row-span-1' },
                    { label: '1x2', val: 'col-span-1 row-span-2' },
                    { label: '2x2', val: 'col-span-2 row-span-2' }
                  ].map(size => (
                    <button
                      key={size.val}
                      onClick={() => setFormData({ ...formData, grid_class: size.val })}
                      className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${formData.grid_class === size.val ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-gray-50 border-transparent text-gray-400'}`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Credits */}
          <div className="space-y-2">
            <h3 className="text-sm font-display text-[var(--accent)] mb-4">Thành phần tham gia</h3>
            <CreditInputGroup 
              role="model" 
              label="Người mẫu (Models)" 
              credits={formData.metadata.credits}
              neededCount={formData.metadata.needed_counts?.model}
              onNeededCountChange={updateNeededCount}
              addCredit={addCredit}
              updateCredits={updateCredits}
              removeCredit={removeCredit}
            />
            <CreditInputGroup 
              role="photo" 
              label="Nhiếp ảnh (Photographers)" 
              credits={formData.metadata.credits}
              neededCount={formData.metadata.needed_counts?.photo}
              onNeededCountChange={updateNeededCount}
              addCredit={addCredit}
              updateCredits={updateCredits}
              removeCredit={removeCredit}
            />
            <CreditInputGroup 
              role="makeup" 
              label="Trang điểm (Makeup Artists)" 
              credits={formData.metadata.credits}
              neededCount={formData.metadata.needed_counts?.makeup}
              onNeededCountChange={updateNeededCount}
              addCredit={addCredit}
              updateCredits={updateCredits}
              removeCredit={removeCredit}
            />
          </div>
        </div>

        <div className="p-8 bg-gray-50 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSave}
            className="flex-[2] bg-[var(--accent)] text-white rounded-2xl py-4 font-display text-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] hover:-translate-y-1 active:scale-95"
          >
            {editingItem ? 'Cập nhật bộ ảnh' : 'Lưu vào Portfolio'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const CalendarForm = ({ isOpen, onClose, onSave, existingSlots }: any) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessions, setSessions] = useState({ morning: false, afternoon: false, evening: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const slot = existingSlots.find((s: any) => s.date_str === selectedDate);
    if (slot) {
      setSessions({
        morning: slot.status.includes('Sáng'),
        afternoon: slot.status.includes('Chiều'),
        evening: slot.status.includes('Tối')
      });
    } else {
      setSessions({ morning: false, afternoon: false, evening: false });
    }
  }, [selectedDate, existingSlots]);

  const handleDelete = async () => {
    const slot = existingSlots.find((s: any) => s.date_str === selectedDate);
    if (!slot) return;
    if (!confirm('Xóa lịch ngày này?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/${slot.id}`, { method: 'DELETE' });
      if (res.ok) {
        onSave({}); // Just to trigger loadData in parent
        onClose();
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSave = async () => {
    const statusParts = [];
    if (sessions.morning) statusParts.push('Sáng');
    if (sessions.afternoon) statusParts.push('Chiều');
    if (sessions.evening) statusParts.push('Tối');

    const status = statusParts.length > 0 ? statusParts.join(' & ') + ': Trống' : 'Bận';
    
    setLoading(true);
    await onSave({ date_str: selectedDate, status });
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  const slotExists = existingSlots.some((s: any) => s.date_str === selectedDate);

  // Get current time constraint
  const now = new Date();
  const minDate = now.toISOString().split('T')[0];
  const currentTimeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl space-y-8"
      >
        <div>
          <h3 className="text-2xl font-display text-[var(--accent)]">Cập nhật lịch rảnh</h3>
          <p className="text-[10px] uppercase tracking-widest opacity-40">Hôm nay: {minDate} | Hiện tại: {currentTimeStr}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-40">Chọn ngày</label>
            <input 
              type="date" 
              min={minDate}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm font-bold text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10"
            />
            <p className="text-[10px] text-gray-400 italic">Lịch bắt đầu từ {currentTimeStr} ngày {minDate}</p>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold opacity-40">Buổi rảnh trong ngày</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'morning', label: 'Sáng', icon: '🌅' },
                { id: 'afternoon', label: 'Chiều', icon: '☀️' },
                { id: 'evening', label: 'Tối', icon: '🌙' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSessions(prev => ({ ...prev, [s.id]: !prev[s.id as keyof typeof prev] }))}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${sessions[s.id as keyof typeof sessions] ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)] shadow-lg' : 'border-gray-100 text-gray-300'}`}
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-[10px] font-bold uppercase">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          {slotExists ? (
            <button 
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 py-4 text-xs font-bold uppercase text-red-400 hover:text-red-500 transition-colors"
            >
              Xóa lịch
            </button>
          ) : (
            <button onClick={onClose} className="flex-1 py-4 text-xs font-bold uppercase text-gray-400">Đóng</button>
          )}
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex-[2] bg-[var(--accent)] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Cập nhật'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, unit = '' }: any) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    const duration = 2000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div 
      whileInView={{ y: [20, 0], opacity: [0, 1] }}
      className="glass p-6 rounded-3xl flex flex-col items-center justify-center space-y-2 border border-white/20"
    >
      <div className="w-10 h-10 rounded-full bg-[var(--secondary)] flex items-center justify-center text-[var(--accent)] mb-2">
        <Icon size={20} />
      </div>
      <div className="text-4xl font-display font-bold text-[var(--accent)]">
        {count}{unit}
      </div>
      <div className="text-sm opacity-60 uppercase tracking-widest">{label}</div>
    </motion.div>
  );
};

const LookbookItem = ({ item }: any) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showSocial, setShowSocial] = useState(false);

  return (
    <div 
      className="min-w-[70vw] md:min-w-[320px] lg:min-w-[380px] snap-center aspect-[3/4.5] rounded-[32px] overflow-hidden flex-shrink-0 relative group shadow-xl"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => {
        setShowOverlay(false);
        setShowSocial(false);
      }}
    >
      <motion.img 
        src={item.src} 
        alt={item.concept} 
        animate={{ scale: showOverlay ? 1.05 : 1, filter: showOverlay ? 'blur(4px) brightness(0.6)' : 'none' }}
        className="w-full h-full object-cover transition-transform duration-700" 
        referrerPolicy="no-referrer"
      />

      <AnimatePresence>
        {showOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col justify-end p-8 text-white"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-black/40 backdrop-blur-md rounded-[32px] p-6 border border-white/10 space-y-6"
            >
              {/* Header */}
              <div>
                <h3 className="text-2xl font-display text-[var(--accent)]">{item.concept}</h3>
                <div className="flex gap-4 text-xs opacity-60 mt-1">
                  <span>Photo: {item.credits.photo}</span>
                  <span>MUA: {item.credits.makeup}</span>
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  <Calendar size={14} /> 
                  Availability
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.availableSlots.map((slot: string) => (
                    <motion.button
                      key={slot}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowSocial(true)}
                      className="px-4 py-1.5 rounded-full bg-[#A2D2FF]/20 text-[#A2D2FF] text-[10px] font-bold border border-[#A2D2FF]/30 flex items-center gap-2"
                    >
                      {slot} <span className="w-1.5 h-1.5 rounded-full bg-[#A2D2FF] animate-pulse" /> Available
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Future Concepts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  <Sparkles size={14} /> 
                  Future Concepts
                </div>
                <div className="space-y-2">
                  {item.plannedConcepts.map((concept: any) => (
                    <div key={concept.name} className="flex items-center justify-between group/concept">
                      <div>
                        <div className="text-sm font-medium">{concept.name}</div>
                        <div className="text-[10px] opacity-40">{concept.vibe}</div>
                      </div>
                      <ArrowRight size={14} className="opacity-0 group-hover/concept:opacity-100 transition-opacity text-[var(--accent)]" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Modal */}
      <AnimatePresence>
        {showSocial && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/60 backdrop-blur-lg"
          >
            <div className="text-center space-y-6">
              <h4 className="font-display text-xl">Let's collaborate</h4>
              <div className="flex justify-center gap-6">
                {[
                  { icon: Facebook, color: '#1877F2', delay: 0.1, href: SOCIAL_LINKS.facebook },
                  { icon: Instagram, color: '#E4405F', delay: 0.2, href: SOCIAL_LINKS.instagram },
                  { icon: MessageCircle, color: '#0068FF', delay: 0.3, href: SOCIAL_LINKS.zalo }
                ].map((social, i) => (
                  <motion.a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ y: 0 }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: social.delay }}
                    whileHover={{ scale: 1.2 }}
                    className="w-14 h-14 rounded-full flex items-center justify-center border border-white/20"
                    style={{ backgroundColor: social.color + '20' }}
                  >
                    <social.icon style={{ color: social.color }} />
                  </motion.a>
                ))}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowSocial(false); }}
                className="text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ImageSlider = ({ images, interval = 3000 }: { images: string[], interval?: number }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images, interval]);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white w-4' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const GalleryItem = ({ item, index, isAdmin, onEdit, onDelete }: any) => {
  const [isActive, setIsActive] = useState(false);
  const images = item.urls ? (typeof item.urls === 'string' ? JSON.parse(item.urls) : item.urls) : [item.src || item.url];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => setIsActive(!isActive)}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      className="relative group overflow-hidden rounded-[40px] cursor-pointer aspect-square"
    >
      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-[40] flex gap-2" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => onEdit?.(item)}
            className="p-2 bg-white/90 rounded-full text-blue-600 shadow-lg hover:scale-110 transition-transform"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => onDelete?.(item.id)}
            className="p-2 bg-white/90 rounded-full text-red-500 shadow-lg hover:scale-110 transition-transform"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Slider / Image */}
      <motion.div
        animate={{
          filter: isActive ? 'blur(4px) brightness(0.7)' : 'blur(0px) brightness(1)',
        }}
        transition={{ duration: 0.5 }}
        className="w-full h-full"
      >
        <ImageSlider images={images} />
      </motion.div>

      {/* Glassmorphism Overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-full bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl text-center"
            >
              <h3 className="text-[var(--accent)] font-display text-xl mb-1">{item.title}</h3>
              <p className="text-xs uppercase tracking-widest opacity-60 mb-4">{item.date}</p>
              
              <div className="space-y-1 text-sm border-t border-[var(--accent)]/10 pt-4">
                <div className="flex justify-between items-center px-2">
                  <span className="opacity-40 text-[10px] uppercase font-bold">Photo</span>
                  <span className="font-medium text-[var(--accent)]">{item.photographer || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="opacity-40 text-[10px] uppercase font-bold">Location</span>
                  <span className="font-medium text-[var(--accent)]">{item.location || 'N/A'}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const KineticItem = ({ children, index, scrollYProgress, xOffset = '10%' }: any) => {
  const speed = 0.1 + (index % 3) * 0.1;
  const y = useTransform(scrollYProgress, [0, 1], [0, -200 * speed * 10]);
  const initialRotate = (index % 2 === 0 ? 5 : -5) * (1 + (index % 3) * 0.5);
  
  return (
    <motion.div
      style={{ y, left: xOffset }}
      className="relative mb-32 z-10 pointer-events-auto w-fit"
    >
      <motion.div
        initial={{ rotate: initialRotate }}
        whileHover={{ rotate: 0, scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

const SectionCurve = ({ children, title, subtitle, id }: any) => {
  const containerRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  return (
    <section id={id} ref={containerRef} className="relative min-h-[140vh] py-32 overflow-hidden bg-white/5 border-t border-[var(--accent)]/5">
      {/* Background Frame Layer (Visual Frame) */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-10 pointer-events-none">
        <div className="absolute inset-0 border-l-[40px] border-t-[40px] border-[var(--accent)] rounded-tl-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-30 mb-20">
        <motion.div
          whileInView={{ x: [-20, 0], opacity: [0, 1] }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl font-display mb-4 text-[var(--accent)] drop-shadow-sm">{title}</h2>
          <div className="flex items-center gap-4">
            <p className="text-[10px] uppercase tracking-[0.6em] font-bold text-[var(--accent)] opacity-40">{subtitle}</p>
            <div className="h-[1px] w-24 bg-[var(--accent)] opacity-20"></div>
          </div>
        </motion.div>
      </div>

      {/* S-Curve Background Line (Dashed) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 1200" preserveAspectRatio="none">
        <motion.path
          d="M 25 0 Q 75 300 25 600 Q 75 900 25 1200"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="0.5"
          strokeDasharray="8,12"
          animate={{ strokeDashoffset: [0, -200] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </svg>

      {/* Scoped Blossoms - Only within this section */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: (20 + Math.random() * 60) + "%", 
              y: "-10%",
              rotate: 0,
              opacity: 0
            }}
            animate={{ 
              y: "110%",
              rotate: 360,
              opacity: [0, 0.4, 0.4, 0]
            }}
            transition={{ 
              duration: 10 + Math.random() * 10, 
              repeat: Infinity, 
              ease: "linear", 
              delay: i * 1.5 
            }}
            className="absolute text-2xl filter blur-[1px]"
          >
            🌸
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
        {React.Children.map(children, (child, i) => (
          <KineticItem 
            index={i} 
            scrollYProgress={scrollYProgress} 
            xOffset={i % 2 === 0 ? '-15%' : '20%'}
          >
            {child}
          </KineticItem>
        ))}
      </div>
    </section>
  );
};

const SocialPopup = ({ onClose }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl rounded-[inherit] p-6 text-center"
  >
    <h4 className="text-[var(--accent)] font-display text-lg mb-4">Contact Me</h4>
    <div className="flex gap-4 mb-6">
      {[
        { Icon: Facebook, href: SOCIAL_LINKS.facebook },
        { Icon: Instagram, href: SOCIAL_LINKS.instagram },
        { Icon: MessageCircle, href: SOCIAL_LINKS.zalo }
      ].map((item, i) => (
        <motion.a
          key={i}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
          className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-lg"
        >
          <item.Icon size={18} />
        </motion.a>
      ))}
    </div>
    <button onClick={onClose} className="text-[10px] uppercase font-bold opacity-40 hover:opacity-100">Close</button>
  </motion.div>
);

const CreditOverlay = ({ item, isVisible }: any) => {
  const metadata = React.useMemo(() => {
    if (!item || !item.metadata) return {};
    if (typeof item.metadata === 'object') return item.metadata;
    try {
      return JSON.parse(item.metadata);
    } catch (e) {
      console.error("Failed to parse metadata", e);
      return {};
    }
  }, [item?.metadata]);
  
  const CreditLink = ({ label, roleData, fallbackName }: any) => {
    // Handle both single objects and arrays of credit objects
    const dataArray = Array.isArray(roleData) ? roleData : (roleData ? [roleData] : []);
    
    // If no complex metadata, try parsing fallback string for multiple names
    const displayFallback = fallbackName || 'N/A';
    
    if (dataArray.length === 0 && displayFallback !== 'N/A') {
      const names = displayFallback.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (names.length === 0) return (
        <div className="flex justify-between items-center opacity-80">
          <span className="font-bold uppercase text-[8px] md:text-[10px]">{label}</span>
          <span className="text-[var(--accent)] font-medium">N/A</span>
        </div>
      );

      return (
        <div className="flex justify-between items-start opacity-80 gap-4">
          <span className="font-bold uppercase text-[8px] md:text-[10px] pt-1">{label}</span>
          <div className="flex flex-wrap justify-end gap-x-2 gap-y-0.5 text-right max-w-[70%]">
            {names.map((n: string, i: number) => (
               <React.Fragment key={i}>
                <span className="text-[var(--accent)] font-medium truncate max-w-[100px]">{n}</span>
                {i < names.length - 1 && <span className="opacity-20">&</span>}
               </React.Fragment>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-between items-start opacity-80 gap-4">
        <span className="font-bold uppercase text-[8px] md:text-[10px] pt-1">{label}</span>
        <div className="flex flex-wrap justify-end gap-x-2 gap-y-0.5 text-right max-w-[70%]">
          {dataArray.length > 0 ? dataArray.map((data: any, i: number) => {
            const name = data.name || 'N/A';
            const link = data.link;
            return (
              <React.Fragment key={i}>
                {link ? (
                  <a 
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[var(--accent)] hover:opacity-70 transition-colors flex items-center gap-1 group/link"
                  >
                    <span className="underline font-medium truncate max-w-[100px]">{name}</span>
                    <ExternalLink size={8} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <span className="text-[var(--accent)] font-medium truncate max-w-[100px]">{name}</span>
                )}
                {i < dataArray.length - 1 && <span className="opacity-20">&</span>}
              </React.Fragment>
            );
          }) : <span className="text-[var(--accent)] font-medium">N/A</span>}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isVisible && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-20 flex items-center justify-center p-2 md:p-4 bg-black/10 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full h-full bg-white/20 backdrop-blur-xl rounded-[24px] p-4 md:p-6 border border-white/30 shadow-2xl flex flex-col justify-center"
          >
            <h3 className="font-display text-lg md:text-2xl text-[var(--accent)] mb-1 leading-tight text-center">{item.title || item.concept || 'Portfolio Item'}</h3>
            <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2 md:mb-4 text-center">{metadata?.date || item.date || "Spring 2025"}</p>
            
            <div className="space-y-1.5 md:space-y-3 text-[10px] md:text-[12px] border-t border-[var(--accent)]/10 pt-3 md:pt-4">
              <CreditLink label="Model" roleData={metadata?.credits?.model || metadata?.model} fallbackName={item.model_name} />
              <CreditLink label="Photo" roleData={metadata?.credits?.photo || metadata?.photo} fallbackName={item.photographer} />
              <CreditLink label="Makeup" roleData={metadata?.credits?.makeup || metadata?.makeup} fallbackName={item.makeup} />
              <div className="flex justify-between items-center opacity-80">
                <span className="font-bold uppercase text-[8px] md:text-[10px]">Location</span>
                <span className="text-[var(--accent)] font-medium text-right max-w-[70%]">{metadata?.location?.name || item.location || 'N/A'}</span>
              </div>
              {item.facebook_post_url && (
                <div className="pt-2">
                  <a 
                    href={item.facebook_post_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-white py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:brightness-110 transition-all"
                  >
                    <Facebook size={12} /> View on Facebook
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ImageWithCredit = ({ item, className = "", onClick, isWave = false, onEdit, onDelete, isAdmin }: any) => {
  const [isActive, setIsActive] = useState(false);
  const images = item?.urls ? (typeof item.urls === 'string' ? JSON.parse(item.urls) : item.urls) : (item?.url || item?.src ? [item.url || item.src] : []);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onClick={onClick || (() => setIsActive(!isActive))}
      className={`relative group cursor-pointer overflow-hidden ${isWave ? 'organic-wave-mirror' : ''} ${className}`}
    >
      {isAdmin && (
        <div className="absolute top-4 left-4 z-30 flex gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(item)} className="p-2 bg-white/90 rounded-full text-blue-600 shadow-lg hover:scale-110 transition-transform">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-2 bg-white/90 rounded-full text-red-500 shadow-lg hover:scale-110 transition-transform">
            <Trash2 size={14} />
          </button>
        </div>
      )}
      {images.length > 0 ? (
        <div className={`w-full h-full transition-all duration-700 ${isActive ? 'blur(4px) brightness(0.9)' : 'blur(0px) brightness(1)'}`}>
          <ImageSlider images={images} />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-2 opacity-40">
           <Camera size={32} className="text-[var(--accent)]" />
           <span className="text-[8px] uppercase font-bold tracking-widest text-[var(--accent)]">Coming Soon</span>
        </div>
      )}
      <CreditOverlay item={item} isVisible={isActive} />
    </motion.div>
  );
};

const ParabolicRibbonSection = ({ items, onSelect, isAdmin, onEdit, onDelete }: any) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const dashOffset = useTransform(scrollYProgress, [0, 1], [1000, 0]);

  // Use precisely 3 items or placeholders
  const lookbookItems = [...items, {}, {}, {}].slice(0, 3);

  return (
    <section ref={containerRef} className="relative min-h-[150vh] py-32 overflow-hidden bg-white/5 border-t border-[var(--accent)]/5">
       <div className="max-w-7xl mx-auto px-6 relative z-30 mb-20">
        <motion.div
          whileInView={{ x: [-20, 0], opacity: [0, 1] }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl font-display mb-4 text-[var(--accent)] drop-shadow-sm">Lookbook Collection</h2>
          <div className="flex items-center gap-4">
            <p className="text-[10px] uppercase tracking-[0.6em] font-bold text-[var(--accent)] opacity-40">The Parabolic Ribbon</p>
            <div className="h-[1px] w-24 bg-[var(--accent)] opacity-20"></div>
          </div>
        </motion.div>
      </div>

      <div className="relative h-[1200px] max-w-4xl mx-auto">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 1200" preserveAspectRatio="none">
          {/* Parabolic Ribbon Line */}
          <motion.path
            d="M 50 150 Q 350 375 200 600 Q 50 825 350 1050"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            className="parabolic-path"
            style={{ pathLength, strokeDashoffset: dashOffset }}
          />
        </svg>

        {/* Anchor Points */}
        <div className="absolute inset-0 pointer-events-none">
          {lookbookItems.map((item, i) => {
            const positions = [
              { top: '150px', left: '50px', transform: 'translate(-50%, -50%)' },  // Vertex P1
              { top: '600px', left: '200px', transform: 'translate(-50%, -50%)' }, // Intersection
              { top: '1050px', left: '350px', transform: 'translate(-50%, -50%)' }  // Vertex P2
            ];
            const pos = positions[i];

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                style={{ 
                   position: 'absolute', 
                   top: pos.top, 
                   left: pos.left, 
                   transform: pos.transform 
                }}
                className="pointer-events-auto"
              >
                <ImageWithCredit
                  item={item}
                  isWave={true}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  className="w-48 h-64 md:w-64 md:h-80 shadow-2xl animate-float"
                  onClick={item.url ? () => onSelect(item) : undefined}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const OrigamiCard = ({ concept, index, isAdmin, onEdit, onDelete }: any) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const metadata = React.useMemo(() => {
    if (typeof concept.metadata === 'string') return JSON.parse(concept.metadata);
    return concept.metadata || {};
  }, [concept.metadata]);

  const credits = metadata.credits || {};
  const neededCounts = metadata.needed_counts || { model: 1, photo: 1, makeup: 1 };

  const handleCollaborationClick = (e: React.MouseEvent, key: string, isReady: boolean) => {
    e.stopPropagation();
    if (!isReady) {
      window.open(SOCIAL_LINKS.zalo, '_blank');
    }
  };

  return (
    <div 
      className="relative w-full aspect-[3/4] cursor-pointer"
      style={{ perspective: '1200px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side */}
        <div 
          className="absolute inset-0 bg-white shadow-xl rounded-3xl overflow-hidden border border-white/50"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {isAdmin && (
            <div className="absolute top-4 left-4 z-30 flex gap-2" onClick={e => e.stopPropagation()}>
              <button onClick={() => onEdit(concept)} className="p-2 bg-white/90 rounded-full text-blue-600 shadow-lg hover:scale-110 transition-transform">
                <Edit2 size={14} />
              </button>
              <button onClick={() => onDelete(concept.id)} className="p-2 bg-white/90 rounded-full text-red-500 shadow-lg hover:scale-110 transition-transform">
                <Trash2 size={14} />
              </button>
            </div>
          )}
          <div className="w-full h-full">
            <ImageSlider images={concept.urls ? (typeof concept.urls === 'string' ? JSON.parse(concept.urls) : concept.urls) : [concept.url || concept.img]} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
            <h4 className="font-display text-2xl">{concept.title || concept.name}</h4>
            <p className="font-handwriting text-[#FFB6C1]">{concept.concept_vibe || concept.vibe}</p>
            
            <div className="mt-4 flex flex-col gap-1 opacity-80">
              {concept.date && (
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
                  <Calendar size={12} className="text-[#FFB6C1]" />
                  {concept.date}
                </div>
              )}
              {concept.location && (
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
                  <MapPin size={12} className="text-[#FFB6C1]" />
                  {concept.location}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back Side (Checklist & Collaboration) */}
        <div 
          className="absolute inset-0 bg-[rgba(255,240,245,0.95)] backdrop-blur-2xl shadow-xl rounded-3xl border border-[var(--accent)]/20 p-8 flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div>
            <h4 className="font-display text-xl text-[var(--accent)] mb-6 border-b border-[var(--accent)]/10 pb-3">Collaboration Hub</h4>
            <div className="space-y-4">
              {[
                { label: 'Models', key: 'model' },
                { label: 'Photographers', key: 'photo' },
                { label: 'Makeup Artists', key: 'makeup' }
              ].map((item) => {
                const filledCount = (credits[item.key] || []).filter((c: any) => c.name).length;
                const totalNeeded = neededCounts[item.key] || 0;
                const isReady = totalNeeded > 0 ? filledCount >= totalNeeded : filledCount > 0;
                const missingCount = Math.max(0, totalNeeded - filledCount);

                return (
                  <div 
                    key={item.key} 
                    className="flex flex-col gap-1 cursor-pointer group/item"
                    onClick={(e) => handleCollaborationClick(e, item.key, isReady)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className={`text-[10px] uppercase font-bold tracking-widest ${isReady ? 'text-[var(--accent)] font-black' : 'opacity-40'}`}>
                          {item.label}
                        </span>
                        {filledCount > 0 && (
                          <div className="flex gap-1 flex-wrap mt-0.5">
                            {(credits[item.key] || []).filter((c: any) => c.name).map((c: any, ci: number) => (
                              <span key={ci} className="text-[8px] bg-[var(--accent)]/5 text-[var(--accent)] px-1 rounded">
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <motion.span 
                        animate={!isReady ? { color: ['#FF4D6D', '#D1D5DB', '#FF4D6D'], opacity: [1, 0.4, 1] } : {}}
                        transition={!isReady ? { repeat: Infinity, duration: 2 } : {}}
                        className={`text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${isReady ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-red-50 text-white shadow-sm'}`}
                      >
                        {isReady ? '🌸 Ready' : (totalNeeded > filledCount ? `Thiếu ${missingCount} vị trí` : 'Cần tìm')}
                      </motion.span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/50 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest opacity-40">
                <MapPin size={10} /> {concept.location || 'Chưa xác định'}
              </div>
              <div className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest opacity-40">
                <Calendar size={10} /> {concept.date || 'Sắp tới'}
              </div>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); window.open(SOCIAL_LINKS.zalo, '_blank'); }}
              className="w-full py-4 bg-[var(--accent)] text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-2xl shadow-lg hover:shadow-[var(--accent)]/40 hover:-translate-y-1 transition-all active:scale-95"
            >
              Đăng ký tham gia ngay
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const OrbitingPetal = ({ slot, index, onContact, showContact }: any) => {
  const radius = 180 + (index % 3) * 60;
  const initialAngle = (index * (360 / 5)) * (Math.PI / 180);
  const [angle, setAngle] = useState(initialAngle);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setAngle(prev => prev + 0.005);
    }, 16);
    return () => clearInterval(interval);
  }, [isHovered]);

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return (
    <motion.div
      animate={{ x, y }}
      className={`absolute w-32 h-32 md:w-40 md:h-40 z-10`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{ 
          scale: isHovered ? 1.4 : 1,
          rotate: isHovered ? 0 : angle * (180 / Math.PI)
        }}
        className="w-full h-full glass rounded-[40%_60%_70%_30%_/_40%_50%_60%_50%] border border-white/40 shadow-xl flex flex-col items-center justify-center p-4 cursor-pointer relative overflow-hidden"
        onClick={() => onContact(`cal-${index}`)}
      >
        <span className="text-2xl mb-1">{index % 2 === 0 ? '🍓' : '🌸'}</span>
        <span className="font-display text-xl text-[var(--accent)]">{slot.date}</span>
        <span className="text-[8px] uppercase tracking-widest opacity-40">Available</span>

        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-2 text-center"
            >
              <p className="text-[9px] font-bold mb-2 text-gray-500">{slot.status}</p>
              <span className="text-[8px] uppercase font-bold text-[var(--accent)] border-b border-[var(--accent)]/30">Liên hệ ngay</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {showContact === `cal-${index}` && <SocialPopup onClose={() => onContact(null)} />}
    </motion.div>
  );
};


const AssetDetailView = ({ selectedAsset }: { selectedAsset: any }) => {
  const metadata = useMemo(() => {
    try {
      return typeof selectedAsset.metadata === 'string' ? JSON.parse(selectedAsset.metadata) : (selectedAsset.metadata || {});
    } catch {
      return {};
    }
  }, [selectedAsset.metadata]);

  const images = useMemo(() => {
    try {
      const dbUrls = selectedAsset.urls ? (typeof selectedAsset.urls === 'string' ? JSON.parse(selectedAsset.urls) : selectedAsset.urls) : [];
      const primaryUrl = selectedAsset.url || selectedAsset.src || selectedAsset.img;
      
      if (dbUrls.length > 0) return dbUrls;
      return primaryUrl ? [primaryUrl] : [];
    } catch {
      const primaryUrl = selectedAsset.url || selectedAsset.src || selectedAsset.img;
      return primaryUrl ? [primaryUrl] : [];
    }
  }, [selectedAsset.urls, selectedAsset.url, selectedAsset.src, selectedAsset.img]);

  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0 && !selectedAsset.title) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-[40px] p-2 overflow-hidden">
      <div className="space-y-6">
         {/* Main Large Image */}
         <div className="rounded-[30px] overflow-hidden shadow-lg border border-gray-100 aspect-square relative group bg-gray-50 flex items-center justify-center">
           <AnimatePresence mode="wait">
             {images.length > 0 ? (
               <motion.img
                 key={activeIndex}
                 src={images[activeIndex]}
                 initial={{ opacity: 0, scale: 1.05 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 transition={{ duration: 0.4, ease: "easeOut" }}
                 className="w-full h-full object-cover"
                 referrerPolicy="no-referrer"
               />
             ) : (
                <div className="flex flex-col items-center opacity-20">
                  <Camera size={64} />
                  <span className="text-[10px] uppercase font-bold tracking-widest mt-4">No Image Available</span>
                </div>
             )}
           </AnimatePresence>
         </div>

         {/* Thumbnails */}
         {images.length > 1 && (
           <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x scroll-smooth">
              {images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all snap-start ${activeIndex === i ? 'border-[var(--accent)] scale-95 shadow-inner' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}
                >
                  <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {activeIndex === i && (
                    <div className="absolute inset-0 bg-[var(--accent)]/10" />
                  )}
                </button>
              ))}
           </div>
         )}
      </div>

      <div className="flex flex-col gap-8 h-full pr-2">
         <div className="glass p-10 rounded-[50px] border border-white/50 shadow-xl space-y-8 h-fit">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40">Concept Showcase</span>
              </div>
              <h4 className="text-4xl font-display text-[var(--accent)] mb-3 leading-tight">{selectedAsset.title || selectedAsset.concept || selectedAsset.name || "Album Detail"}</h4>
              <div className="flex gap-4 text-xs font-bold uppercase tracking-widest opacity-40 mb-6">
                <span className="flex items-center gap-1"><Calendar size={12} /> {selectedAsset.date || "Spring 2025"}</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {selectedAsset.location || "Hà Nội"}</span>
              </div>
              <p className="text-sm leading-relaxed opacity-60 font-sans italic">
                {selectedAsset.description || selectedAsset.concept_vibe || selectedAsset.vibe || "Bộ sưu tập mang đậm tinh thần tự do, kết hợp giữa yếu tố cổ điển và thẩm mỹ hiện đại."}
              </p>
            </div>
            
            <div className="space-y-4 pt-6 border-t border-[var(--accent)]/10">
              <h5 className="text-[10px] uppercase font-bold tracking-[0.4em] text-[var(--accent)] opacity-40">Collaborators & Credits</h5>
              <div className="grid grid-cols-1 gap-4">
                 {[
                   { label: 'Model', data: metadata?.credits?.model || (selectedAsset.model_name ? [{ name: selectedAsset.model_name }] : []) },
                   { label: 'Photo', data: metadata?.credits?.photo || (selectedAsset.photographer ? [{ name: selectedAsset.photographer }] : []) },
                   { label: 'Makeup', data: metadata?.credits?.makeup || (selectedAsset.makeup ? [{ name: selectedAsset.makeup }] : []) }
                 ].map((role, ri) => (
                   role.data && role.data.length > 0 && role.data.some((d: any) => d.name) && (
                     <div key={ri} className="flex justify-between items-start border-b border-gray-50 pb-2 last:border-0">
                       <span className="text-[10px] font-bold uppercase opacity-30 pt-1">{role.label}</span>
                       <div className="flex flex-wrap justify-end gap-x-2 text-right max-w-[70%]">
                         {role.data.map((m: any, i: number) => (
                           m.name && (
                             <React.Fragment key={i}>
                               {m.link ? (
                                 <a href={m.link} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--accent)] underline hover:opacity-70 transition-opacity">
                                   {m.name}
                                 </a>
                               ) : (
                                 <span className="font-bold text-[var(--accent)]">{m.name}</span>
                               )}
                               {i < role.data.length - 1 && <span className="opacity-20">&</span>}
                             </React.Fragment>
                           )
                         ))}
                       </div>
                     </div>
                   )
                 ))}
              </div>
            </div>

            {selectedAsset.facebook_post_url && (
               <a 
                 href={selectedAsset.facebook_post_url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center justify-center gap-3 w-full py-4 bg-[var(--accent)] text-white font-bold rounded-[30px] shadow-lg hover:shadow-[var(--accent)]/40 hover:-translate-y-1 transition-all"
               >
                 <Facebook size={18} /> View on Social Media
               </a>
            )}
         </div>

         <div className="flex-1 min-h-[300px] rounded-[40px] overflow-hidden shadow-inner border border-gray-100">
            <GoogleMap 
              lat={metadata?.location?.lat || 21.0583} 
              lng={metadata?.location?.lng || 105.8133} 
              name={metadata?.location?.name || selectedAsset.location} 
            />
         </div>
      </div>
    </div>
  );
};

const ProfileForm = ({ isOpen, onClose, onSave, profile }: any) => {
  const [formData, setFormData] = useState<any>({
    height: 160,
    weight: 48,
    bust: 85,
    waist: 64,
    hips: 92,
    current_location: 'Hà Nội'
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        height: profile.height || 160,
        weight: profile.weight || 48,
        bust: profile.bust || 85,
        waist: profile.waist || 64,
        hips: profile.hips || 92,
        current_location: profile.current_location || 'Hà Nội'
      });
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl space-y-8"
      >
        <div>
          <h3 className="text-2xl font-display text-[var(--accent)]">Cập nhật chỉ số Model</h3>
          <p className="text-[10px] uppercase tracking-widest opacity-40">Thông tin cơ bản & Chỉ số hình thể</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-40">Chiều cao (cm)</label>
            <input 
              type="number" 
              value={formData.height}
              onChange={e => setFormData({...formData, height: parseInt(e.target.value)})}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm font-bold text-[var(--accent)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-40">Cân nặng (kg)</label>
            <input 
              type="number" 
              value={formData.weight}
              onChange={e => setFormData({...formData, weight: parseInt(e.target.value)})}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm font-bold text-[var(--accent)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-40">Vòng 1 (Bust)</label>
            <input 
              type="number" 
              value={formData.bust}
              onChange={e => setFormData({...formData, bust: parseInt(e.target.value)})}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm font-bold text-[var(--accent)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-40">Vòng 2 (Waist)</label>
            <input 
              type="number" 
              value={formData.waist}
              onChange={e => setFormData({...formData, waist: parseInt(e.target.value)})}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm font-bold text-[var(--accent)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-40">Vòng 3 (Hips)</label>
            <input 
              type="number" 
              value={formData.hips}
              onChange={e => setFormData({...formData, hips: parseInt(e.target.value)})}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm font-bold text-[var(--accent)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold opacity-40">Địa chỉ</label>
            <input 
              type="text" 
              value={formData.current_location}
              onChange={e => setFormData({...formData, current_location: e.target.value})}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm font-bold text-[var(--accent)]"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={onClose} className="flex-1 py-4 text-xs font-bold uppercase text-gray-400">Hủy</button>
          <button 
            onClick={() => onSave(formData)}
            className="flex-[2] bg-[var(--accent)] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
          >
            Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const ModelMode = () => {
  const { isAdmin } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [lookbookData, setLookbookData] = useState<any[]>([]);
  const [upcomingConcepts, setUpcomingConcepts] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [isCalendarFormOpen, setIsCalendarFormOpen] = useState(false);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);

  const loadData = () => {
    fetchProfile().then(setProfile).catch(console.error);
    fetchAssets('model_diary').then(setImages).catch(console.error);
    
    fetchCalendar().then(data => {
      // Filter out past dates on the client for safety, though UI constraint handles it
      const today = new Date();
      today.setHours(0,0,0,0);
      const filtered = data.filter((s: any) => new Date(s.date_str) >= today);
      setCalendarData(filtered);
    }).catch(console.error);

    fetchAssets('concept').then(setUpcomingConcepts).catch(console.error);

    fetchAssets('lookbook').then((data) => {
      const minItems = 6;
      if (data.length < minItems) {
        const placeholders = Array.from({ length: minItems - data.length }).map((_, i) => ({
          isPlaceholder: true,
          title: 'Coming Soon',
          url: '',
          concept: 'In Progress...'
        }));
        setLookbookData([...data, ...placeholders]);
      } else {
        setLookbookData(data);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAsset = async (assetData: any) => {
    try {
      await saveAsset(assetData);
      loadData();
      setEditingItem(null);
    } catch (error) {
      console.error('Save error:', error);
      alert('Không thể lưu dữ liệu.');
    }
  };

  const handleSaveCalendar = async (slot: any) => {
    try {
      await saveCalendar(slot);
      loadData();
    } catch (error) {
      console.error('Calendar save error:', error);
    }
  };

  const handleSaveProfile = async (data: any) => {
    try {
      await saveProfile({ ...profile, ...data });
      loadData();
      setIsProfileFormOpen(false);
    } catch (error) {
      console.error('Profile save error:', error);
      alert('Không thể lưu thông tin cá nhân.');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Xóa ảnh này khỏi Portfolio?')) return;
    try {
      await deleteAsset(id);
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Xóa thất bại.');
    }
  };

  const bentoGrid = Array.from({ length: 9 }).map((_, i) => images[i] || null);
  const bentoClasses = [
    'col-span-2 row-span-2', // Big one
    'col-span-1 row-span-1', 'col-span-1 row-span-1',
    'col-span-1 row-span-1', 'col-span-1 row-span-1',
    'col-span-1 row-span-1', 'col-span-1 row-span-1',
    'col-span-1 row-span-1', 'col-span-1 row-span-1'
  ];

  const formattedCalendar = calendarData.map(c => ({
    ...c,
    date: new Date(c.date_str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }));

  return (
    <div className="space-y-32 pb-40 relative">
      <HeroBanner />

      {/* Admin Controls */}
      {isAdmin && (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3 pointer-events-none">
          <motion.div 
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="flex flex-col gap-3 pointer-events-auto"
          >
              <div className="relative group">
                <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-pink-500 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">CONCEPT</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setEditingItem({ type: 'concept' });
                    setIsFormOpen(true);
                  }}
                  className="w-14 h-14 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-2xl border-2 border-white"
                >
                  <Sparkles size={24} />
                </motion.button>
              </div>

              <div className="relative group">
                <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-purple-500 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">CALENDAR</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCalendarFormOpen(true)}
                  className="w-14 h-14 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-2xl border-2 border-white"
                >
                  <Calendar size={24} />
                </motion.button>
              </div>

              <div className="relative group">
                <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-blue-500 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">LOOKBOOK</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setEditingItem({ type: 'lookbook' });
                    setIsFormOpen(true);
                  }}
                  className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-2xl border-2 border-white"
                >
                  <Camera size={24} />
                </motion.button>
              </div>

              <div className="relative group">
                <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">MODEL DIARY</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setEditingItem({ type: 'model_diary' });
                    setIsFormOpen(true);
                  }}
                  className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-2xl border-2 border-white"
                >
                  <Plus size={24} />
                </motion.button>
              </div>
            </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6">
        {/* Profile Stats */}
        <section className="relative group/stats mb-32">
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsProfileFormOpen(true)}
              className="absolute -top-12 right-0 p-3 bg-white shadow-xl rounded-full text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all z-20"
            >
              <Edit2 size={16} />
            </motion.button>
          )}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Height" value={profile?.height || "160"} icon={Ruler} unit="cm" />
            <StatCard label="Weight" value={profile?.weight || "48"} icon={Heart} unit="kg" />
            <StatCard label="Bust" value={profile?.bust || "85"} icon={Scissors} unit="cm" />
            <StatCard label="Waist" value={profile?.waist || "64"} icon={Shirt} unit="cm" />
            <StatCard label="Hips" value={profile?.hips || "92"} icon={Camera} unit="cm" />
          </div>
        </section>

        {/* Location Info */}
        <div className="flex justify-center mb-12">
            <div 
              className={`flex items-center gap-2 px-6 py-2 bg-[var(--secondary)] rounded-full text-[var(--accent)] text-xs font-bold uppercase tracking-[0.2em] shadow-sm italic ${isAdmin ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
              onClick={() => isAdmin && setIsProfileFormOpen(true)}
            >
                <MapPin size={14} /> {profile?.current_location || 'Hà Nội'}
            </div>
        </div>

        {/* Visual Diary (Perfect Bento 9 Slots) */}
        <section id="visual-diary" className="mb-32">
          <div className="flex justify-between items-end mb-12">
            <div>
               <h2 className="text-4xl font-display mb-2 text-[var(--accent)] tracking-tight">Visual Diary</h2>
               <p className="text-[9px] uppercase font-bold tracking-[0.4em] opacity-30">A curated collection of moments</p>
            </div>
            <div className="h-[1px] flex-1 mx-8 bg-[var(--accent)] opacity-20 hidden md:block"></div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 grid-rows-4 md:grid-rows-3 gap-3 bg-pink-50/10 p-3 rounded-[40px] border border-pink-100/20 shadow-2xl relative overflow-hidden h-[700px] md:h-[1000px]">
             {bentoGrid.map((item: any, i) => (
                <ImageWithCredit 
                  key={item?.id || `bento-${i}`} 
                  item={item || {}} 
                  isAdmin={isAdmin}
                  onEdit={(it: any) => {
                    setEditingItem(it);
                    setIsFormOpen(true);
                  }}
                  onDelete={handleDeleteAsset}
                  className={bentoClasses[i] || 'col-span-1 row-span-1'} 
                  onClick={item ? () => setSelectedAsset(item) : undefined}
                />
             ))}
          </div>
        </section>
      </div>

      {/* Section 1: Summer Lookbook (The Pink Parabolic Ribbon) */}
      <ParabolicRibbonSection 
        id="lookbook"
        items={lookbookData} 
        onSelect={setSelectedAsset} 
        isAdmin={isAdmin}
        onEdit={(it: any) => {
          setEditingItem(it);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteAsset}
      />

      {/* Section 2: Availability (Floating Orbit) */}
      <section id="availability" className="relative min-h-[100vh] py-32 overflow-hidden border-t border-[var(--accent)]/5 flex items-center justify-center">
        <div className={`absolute top-32 left-10 z-20 ${isAdmin ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`} onClick={() => isAdmin && setIsCalendarFormOpen(true)}>
          <h2 className="text-4xl font-display mb-4 text-[var(--accent)]">Availability</h2>
          <p className="text-[10px] uppercase tracking-[0.6em] font-bold text-[var(--accent)] opacity-40">The Floating Petals Calendar</p>
          {isAdmin && <span className="text-[8px] bg-[var(--accent)] text-white px-2 py-0.5 rounded-full">Admin: Click to edit</span>}
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "-10%", opacity: [0, 0.2, 0] }}
              transition={{ duration: 10, repeat: Infinity, delay: i * 2 }}
              className="absolute left-[30%] text-2xl"
            >🌸</motion.div>
          ))}
        </div>

        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="relative z-0 text-[120px] md:text-[180px] drop-shadow-2xl opacity-20 filter blur-[2px]"
        >
          🍓
        </motion.div>

        {formattedCalendar.map((slot, i) => (
          <OrbitingPetal 
            key={i} 
            slot={slot} 
            index={i} 
            onContact={() => {
              if (isAdmin) {
                setIsCalendarFormOpen(true);
              } else {
                window.open(SOCIAL_LINKS.zalo, '_blank');
              }
            }} 
          />
        ))}

        {!isAdmin && formattedCalendar.length === 0 && (
          <div className="absolute glass px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest opacity-40">
            Trông mong những kỉ niệm sắp tới...
          </div>
        )}

        {isAdmin && formattedCalendar.length === 0 && (
          <button 
            onClick={() => setIsCalendarFormOpen(true)}
            className="absolute glass px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-xl"
          >
            + Chạm để thêm lịch rảnh
          </button>
        )}
      </section>

      {/* Section: Services & Expertise */}
      <ServicesSection isAdmin={isAdmin} mode="model" />

      {/* Section 3: Upcoming Concepts (Origami Gallery) */}
      <section id="upcoming-concepts" className="relative py-32 bg-white/5 border-t border-[var(--accent)]/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-20 text-right">
          <h2 className="text-4xl font-display mb-4 text-[var(--accent)]">Upcoming Concepts</h2>
          <p className="text-[10px] uppercase tracking-[0.6em] font-bold text-[var(--accent)] opacity-40">The Origami Gallery</p>
        </div>

        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {upcomingConcepts.map((concept, i) => (
            <OrigamiCard 
              key={i} 
              concept={concept} 
              index={i} 
              isAdmin={isAdmin}
              onEdit={(it: any) => {
                setEditingItem(it);
                setIsFormOpen(true);
              }}
              onDelete={handleDeleteAsset}
            />
          ))}
          {isAdmin && upcomingConcepts.length < 3 && (
            <button 
              onClick={() => {
                setEditingItem({ type: 'concept' });
                setIsFormOpen(true);
              }}
              className="aspect-[3/4] border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-300 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all grayscale hover:grayscale-0 group"
            >
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[var(--accent)]/10 transition-colors">
                <Plus size={32} />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest">Thêm Concept mới</span>
            </button>
          )}
        </div>
      </section>

      {/* Album Modal */}
      <Modal isOpen={!!selectedAsset} onClose={() => setSelectedAsset(null)} title={selectedAsset?.title || 'Album Detail'}>
        {selectedAsset && <AssetDetailView selectedAsset={selectedAsset} />}
      </Modal>

      {/* Admin Form Modal */}
      <DiaryEntryForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveAsset}
        editingItem={editingItem}
      />

      <CalendarForm 
        isOpen={isCalendarFormOpen}
        onClose={() => setIsCalendarFormOpen(false)}
        onSave={handleSaveCalendar}
        existingSlots={calendarData}
      />

      <ProfileForm 
        isOpen={isProfileFormOpen}
        onClose={() => setIsProfileFormOpen(false)}
        onSave={handleSaveProfile}
        profile={profile}
      />
    </div>
  );
};
