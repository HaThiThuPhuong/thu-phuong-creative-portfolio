import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { ScopedParticles } from './ScopedParticles';
import { fetchProfile, fetchAssets, saveProfile, saveAsset, deleteAsset } from '../services/api';
import { compressImage } from '../lib/imageUtils';
import { BrandLogo } from './BrandLogo';

import { ChevronLeft, ChevronRight, Camera, Trash2, Loader2, Plus, Edit2 } from 'lucide-react';

export const HeroBanner = () => {
  const { isModelMode, isParticlesEnabled, toggleParticles, isAdmin } = useTheme();
  const [index, setIndex] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [banners, setBanners] = useState<{ model: any[], ba: any[] }>({ model: [], ba: [] });
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'add' | 'replace'>('add');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const refreshBanners = () => {
    Promise.all([
      fetchAssets('model_banner'),
      fetchAssets('ba_banner')
    ]).then(([modelBanners, baBanners]) => {
      setBanners({
        model: modelBanners,
        ba: baBanners
      });
    }).catch(err => {
      console.error(err);
      alert('Không thể tải dữ liệu banner. Vui lòng thử lại.');
    });
  };

  useEffect(() => {
    fetchProfile().then(setProfile).catch(console.error);
    refreshBanners();
  }, []);

  const currentBanners = isModelMode ? banners.model : banners.ba;
  const bannerUrls = currentBanners.map(b => b.url);

  const nextSlide = () => {
    if (bannerUrls.length > 1) {
      setIndex((prev) => (prev + 1) % bannerUrls.length);
    }
  };
  
  const prevSlide = () => {
    if (bannerUrls.length > 1) {
      setIndex((prev) => (prev - 1 + bannerUrls.length) % bannerUrls.length);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressedUrl = await compressImage(reader.result as string, 1200, 0.5);
        const isReplace = uploadMode === 'replace' && currentBanners[index];
        const data = {
          type: isModelMode ? 'model_banner' : 'ba_banner',
          url: compressedUrl,
          title: 'Banner Image'
        };

        if (isReplace) {
          await saveAsset({ id: currentBanners[index].id, ...data });
        } else {
          await saveAsset(data);
        }
        
        refreshBanners();
        if (!isReplace) {
          setIndex(currentBanners.length);
        }
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Lỗi kết nối khi upload.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteBanner = async () => {
    const bannerToDelete = currentBanners[index];
    if (!bannerToDelete) return;

    try {
      await deleteAsset(bannerToDelete.id);
      refreshBanners();
      setIndex(0);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Lỗi kết nối khi xóa.');
    }
  };

  useEffect(() => {
    // Reset index when switching modes to prevent out of bounds
    setIndex(0);
  }, [isModelMode]);

  useEffect(() => {
    if (bannerUrls.length > 1) {
      const timer = setInterval(nextSlide, 6000);
      return () => clearInterval(timer);
    }
  }, [isModelMode, bannerUrls]);

  const [isEditingText, setIsEditingText] = useState(false);
  const [textData, setTextData] = useState({ title: '', subtitle: '' });
  const [savingText, setSavingText] = useState(false);

  useEffect(() => {
    if (profile) {
      setTextData({
        title: isModelMode ? (profile.banner_title_model || 'Phuong Thu') : (profile.banner_title_ba || 'Phuong Thu'),
        subtitle: isModelMode ? (profile.banner_subtitle_model || profile.job_title_model || 'Editorial Muse') : (profile.banner_subtitle_ba || profile.job_title_ba || 'Business Analyst Professional')
      });
    }
  }, [profile, isModelMode]);

  const handleSaveText = async () => {
    setSavingText(true);
    try {
      const fieldTitle = isModelMode ? 'banner_title_model' : 'banner_title_ba';
      const fieldSubtitle = isModelMode ? 'banner_subtitle_model' : 'banner_subtitle_ba';
      
      const updateData = {
        [fieldTitle]: textData.title,
        [fieldSubtitle]: textData.subtitle
      };
      
      await saveProfile(updateData);
      setProfile({ ...profile, ...updateData });
      setIsEditingText(false);
    } catch (err) { console.error(err); }
    finally { setSavingText(false); }
  };

  return (
    <section 
      className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden bg-black group/banner"
      onDragOver={(e) => {
        if (isAdmin) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDrop={(e) => {
        if (isAdmin) {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files[0];
          if (file) {
            const mockEvent = { target: { files: [file] } } as any;
            handleFileUpload(mockEvent);
          }
        }
      }}
    >
      {/* Level 1: Background Slider / Static (z-index: 1) */}
      <div className="absolute inset-0 z-10 w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {bannerUrls.length > 0 ? (
            <motion.div
              key={`${isModelMode ? 'model' : 'ba'}-${index}`}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <img 
                src={bannerUrls[index]} 
                className={`w-full h-full object-cover animate-ken-burns ${!isModelMode ? 'opacity-40 grayscale-[50%] brightness-[0.4] saturate-50' : ''}`} 
                alt={`${isModelMode ? 'Model' : 'BA'} Slide`}
                referrerPolicy="no-referrer"
              />
              {!isModelMode && (
                <div className="absolute inset-0 bg-[#0d4f45]/30 backdrop-filter backdrop-blur-[2px] flex items-center justify-center overflow-hidden">
                   {/* Technical Grid Pattern */}
                   <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#2d7a70 1px, transparent 1px), linear-gradient(90deg, #2d7a70 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                   <div className="absolute inset-0 bg-gradient-to-b from-[#0d4f45]/60 to-transparent" />
                </div>
              )}
            </motion.div>
          ) : (
            <div key="empty-banner" className="absolute inset-0 bg-gradient-to-br from-[#0d4f45] to-[#1a2b27] flex items-center justify-center overflow-hidden">
               {!isModelMode ? (
                 <>
                   <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#A2D2FF 1px, transparent 1px), linear-gradient(90deg, #A2D2FF 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
                   <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                     <div className="w-24 h-24 rounded-full border-4 border-[#2d7a70]/30 flex items-center justify-center text-[#2d7a70]/50 animate-pulse">
                        <Camera size={40} />
                     </div>
                     <p className="text-[#2d7a70] text-[10px] uppercase tracking-[0.6em] font-black opacity-40">Architecting Business Logic</p>
                   </div>
                 </>
               ) : (
                 <p className="text-white/10 text-[10px] uppercase tracking-[0.5em] font-bold">
                   Waiting for Model Banner SQL Data
                 </p>
               )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Manual Controls */}
      {bannerUrls.length > 1 && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-50 flex justify-between px-6 pointer-events-none opacity-0 group-hover/banner:opacity-100 transition-opacity duration-500">
           <button 
            onClick={prevSlide}
            className="w-12 h-12 rounded-full glass border border-white/20 flex items-center justify-center text-white pointer-events-auto hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all active:scale-95"
           >
             <ChevronLeft size={24} />
           </button>
           <button 
            onClick={nextSlide}
            className="w-12 h-12 rounded-full glass border border-white/20 flex items-center justify-center text-white pointer-events-auto hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all active:scale-95"
           >
             <ChevronRight size={24} />
           </button>
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-24 left-8 z-[60] flex flex-col gap-3">
          <button 
            onClick={() => {
              setUploadMode('add');
              fileInputRef.current?.click();
            }}
            disabled={uploading}
            className="flex items-center gap-3 px-4 py-2 rounded-full glass border border-white/20 text-white hover:bg-green-500/80 hover:border-green-500 transition-all shadow-lg active:scale-95 group/upload"
          >
            {uploading && uploadMode === 'add' ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            <span className="text-[10px] uppercase font-bold tracking-widest">Thêm slide mới</span>
          </button>

          {bannerUrls.length > 0 && (
            <button 
              onClick={() => {
                setUploadMode('replace');
                fileInputRef.current?.click();
              }}
              disabled={uploading}
              className="flex items-center gap-3 px-4 py-2 rounded-full glass border border-white/20 text-white hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all shadow-lg active:scale-95 group/upload"
            >
              {uploading && uploadMode === 'replace' ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              <span className="text-[10px] uppercase font-bold tracking-widest">Thay ảnh slide này</span>
            </button>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload} 
          />
          
          {bannerUrls.length > 0 && (
            <div className="flex flex-col gap-2">
              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-3 px-4 py-2 rounded-full glass border border-white/20 text-white hover:bg-red-500 hover:border-red-500 transition-all shadow-lg active:scale-95"
                >
                  <Trash2 size={18} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Xóa slide này</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleDeleteBanner}
                    className="flex-1 px-4 py-2 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95"
                  >
                    Xác nhận xóa
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-full glass border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Slide Indicators */}
      {bannerUrls.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex gap-3">
          {bannerUrls.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1 transition-all duration-500 rounded-full ${i === index ? 'w-8 bg-[var(--accent)]' : 'w-2 bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>
      )}

      {/* Level 2: Cherry Blossom Frame (z-index: 2) */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {isModelMode && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {/* Top Left Artistic Branch */}
              <motion.div 
                animate={{ 
                  rotate: [-1, 1.5, -1],
                  y: [0, 10, 0]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -left-10 w-[400px] md:w-[700px] origin-top-left"
              >
                <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-2xl">
                  {/* Branch Structure */}
                  <path d="M0,0 C50,20 150,10 250,80 C300,120 350,100 450,150" fill="none" stroke="#4A3728" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
                  <path d="M150,45 C180,120 120,200 80,300" fill="none" stroke="#4A3728" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
                  <path d="M280,95 C320,150 400,160 420,250" fill="none" stroke="#4A3728" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                  
                  {/* Petal Clusters - Extreme density and variety */}
                  {[
                    { x: 250, y: 80, s: 1.2, c1: "#FFC0CB", c2: "#FFB6C1" },
                    { x: 450, y: 150, s: 1.5, c1: "#FFB6C1", c2: "#FFB7C5" },
                    { x: 80, y: 300, s: 1.3, c1: "#FFF0F5", c2: "#FFC0CB" },
                    { x: 420, y: 250, s: 1.1, c1: "#FFE4E1", c2: "#FFB6C1" },
                    { x: 180, y: 140, s: 0.9, c1: "#FFC0CB", c2: "#FFB6C1" },
                    { x: 330, y: 110, s: 1, c1: "#FFF5F7", c2: "#FFC0CB" },
                    { x: 60, y: 30, s: 0.8, c1: "#FFB6C1", c2: "#FFC0CB" },
                    { x: 120, y: 40, s: 0.7, c1: "#FFE4E1", c2: "#FFB6C1" },
                    { x: 360, y: 160, s: 0.8, c1: "#FFB7C5", c2: "#FFC0CB" },
                    { x: 200, y: 250, s: 0.9, c1: "#FFF0F5", c2: "#FFB6C1" },
                    { x: 400, y: 100, s: 0.7, c1: "#FFC0CB", c2: "#FFF5F7" },
                    { x: 50, y: 150, s: 1, c1: "#FFB6C1", c2: "#FFE4E1" },
                    { x: 280, y: 50, s: 0.85, c1: "#FFDEF0", c2: "#FFC0CB" },
                    { x: 380, y: 130, s: 1.1, c1: "#FFB7C5", c2: "#FFB6C1" },
                    { x: 160, y: 240, s: 0.95, c1: "#FFF0F5", c2: "#FFDEF0" },
                    { x: 300, y: 70, s: 1.05, c1: "#FFC0CB", c2: "#FFB7C1" },
                    { x: 430, y: 180, s: 0.9, c1: "#FFE4E1", c2: "#FFB6C1" },
                    { x: 100, y: 50, s: 0.8, c1: "#FFB6C1", c2: "#FFC0CB" },
                    { x: 220, y: 100, s: 1.1, c1: "#FFF5F7", c2: "#FFC0CB" },
                    { x: 480, y: 120, s: 1.2, c1: "#FFB6C1", c2: "#FF99AA" },
                    { x: 140, y: 200, s: 1.0, c1: "#FFDEF0", c2: "#FFB6C1" },
                    { x: 310, y: 140, s: 0.9, c1: "#FFC0CB", c2: "#FFE4E1" },
                    { x: 410, y: 210, s: 1.1, c1: "#FFB7C5", c2: "#FFDEF0" },
                    { x: 70, y: 250, s: 0.75, c1: "#FFF0F5", c2: "#FFC0CB" },
                    { x: 350, y: 50, s: 0.8, c1: "#FFDEF0", c2: "#FFC0CB" },
                    { x: 20, y: 60, s: 0.9, c1: "#FFB6C1", c2: "#FFDEF0" }
                  ].map((p, i) => (
                    <g key={i} transform={`translate(${p.x}, ${p.y}) scale(${p.s}) rotate(${i * 45})`}>
                      <path d="M0,0 C5,-10 15,-10 20,0 C15,10 5,10 0,0" fill={p.c1} opacity="0.9" />
                      <path d="M0,0 C-5,-10 -15,-10 -20,0 C-15,10 -5,10 0,0" fill={p.c2} opacity="0.8" transform="rotate(72)" />
                      <path d="M0,0 C-5,-10 -15,-10 -20,0 C-15,10 -5,10 0,0" fill={p.c1} opacity="0.9" transform="rotate(144)" />
                      <path d="M0,0 C-5,-10 -15,-10 -20,0 C-15,10 -5,10 0,0" fill={p.c2} opacity="0.8" transform="rotate(216)" />
                      <path d="M0,0 C-5,-10 -15,-10 -20,0 C-15,10 -5,10 0,0" fill={p.c1} opacity="0.9" transform="rotate(288)" />
                      <circle r="3" fill="#FFE4E1" />
                    </g>
                  ))}
                  
                  {/* Small scattered petals */}
                  {[
                    { x: 300, y: 200 }, { x: 150, y: 250 }, { x: 400, y: 50 }, { x: 200, y: 350 },
                    { x: 450, y: 50 }, { x: 100, y: 100 }, { x: 350, y: 300 }, { x: 250, y: 150 },
                    { x: 180, y: 320 }, { x: 420, y: 100 }, { x: 50, y: 220 }
                  ].map((p, i) => (
                    <path key={`sp-${i}`} d={`M${p.x},${p.y} C${p.x+5},${p.y-5} ${p.x+10},${p.y-5} ${p.x+15},${p.y} C${p.x+10},${p.y+5} ${p.x+5},${p.y+5} ${p.x},${p.y}`} fill="#FFDBE9" opacity="0.6" transform={`rotate(${i*15}, ${p.x}, ${p.y})`} />
                  ))}
                </svg>
              </motion.div>

              {/* Bottom Right Artistic Branch */}
              <motion.div 
                animate={{ 
                  rotate: [179, 181.5, 179],
                  y: [0, -10, 0]
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -right-10 w-[400px] md:w-[700px] origin-center rotate-180"
              >
                <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-2xl">
                  {/* Branch Structure */}
                  <path d="M0,0 C60,30 180,20 280,100 C330,140 400,120 480,180" fill="none" stroke="#3D2B1F" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
                  <path d="M180,55 C220,150 150,250 100,350" fill="none" stroke="#3D2B1F" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
                  
                  {/* Petal Clusters - Much higher density */}
                  {[
                    { x: 280, y: 100, s: 1.4, c1: "#FFB6C1", c2: "#FFC0CB" },
                    { x: 480, y: 180, s: 1.7, c1: "#FFB7C5", c2: "#FFB6C1" },
                    { x: 100, y: 350, s: 1.5, c1: "#FFF0F5", c2: "#FFC0CB" },
                    { x: 200, y: 160, s: 1, c1: "#FFC0CB", c2: "#FFE4E1" },
                    { x: 380, y: 130, s: 1.1, c1: "#FFB6C1", c2: "#FFF5F7" },
                    { x: 50, y: 40, s: 0.9, c1: "#FFE4E1", c2: "#FFB6C1" },
                    { x: 150, y: 80, s: 1.2, c1: "#FFB7C5", c2: "#FFC0CB" },
                    { x: 420, y: 220, s: 1.3, c1: "#FFB6C1", c2: "#FFB7C5" },
                    { x: 320, y: 180, s: 1.1, c1: "#FFDEF0", c2: "#FFB6C1" },
                    { x: 220, y: 60, s: 0.95, c1: "#FFC0CB", c2: "#FFDEF0" },
                    { x: 440, y: 300, s: 1.4, c1: "#FFB7C5", c2: "#FFC0CB" },
                    { x: 120, y: 120, s: 1.05, c1: "#FFB6C1", c2: "#FFB7C1" },
                    { x: 350, y: 100, s: 1.2, c1: "#FFF5F7", c2: "#FFC0CB" },
                    { x: 250, y: 150, s: 1.0, c1: "#FFDEF0", c2: "#FFB6C1" },
                    { x: 400, y: 250, s: 1.3, c1: "#FFB7C5", c2: "#FFDEF0" },
                    { x: 80, y: 200, s: 0.9, c1: "#FFC0CB", c2: "#FFB7C5" },
                    { x: 460, y: 80, s: 1.1, c1: "#FFB6C1", c2: "#FFDEF0" },
                  ].map((p, i) => (
                    <g key={i} transform={`translate(${p.x}, ${p.y}) scale(${p.s}) rotate(${i * 60})`}>
                      <path d="M0,0 C5,-10 15,-10 20,0 C15,10 5,10 0,0" fill={p.c1} opacity="0.9" />
                      <path d="M0,0 C-5,-10 -15,-10 -20,0 C-15,10 -5,10 0,0" fill={p.c2} opacity="0.8" transform="rotate(72)" />
                      <path d="M0,0 C-5,-10 -15,-10 -20,0 C-15,10 -5,10 0,0" fill={p.c1} opacity="0.9" transform="rotate(144)" />
                      <path d="M0,0 C-5,-10 -15,-10 -20,0 C-15,10 -5,10 0,0" fill={p.c2} opacity="0.8" transform="rotate(216)" />
                      <path d="M0,0 C-5,-10 -15,-10 -20,0 C-15,10 -5,10 0,0" fill={p.c1} opacity="0.9" transform="rotate(288)" />
                      <circle r="3" fill="#FFE4E1" />
                    </g>
                  ))}
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Level 3: Text Content (z-index: 3) */}
      <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1.2, ease: "easeOut" }}
           className="flex flex-col items-center text-center px-6 max-w-5xl"
        >
          <div className="relative flex items-center justify-center pointer-events-auto">
            {isEditingText ? (
              <input 
                className="bg-transparent border-b-2 border-white/30 text-white text-5xl md:text-8xl font-sans text-center outline-none py-2 px-4 focus:border-[var(--accent)] transition-colors w-full max-w-2xl"
                value={textData.title}
                onChange={e => setTextData({ ...textData, title: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleSaveText()}
                autoFocus
              />
            ) : (
              <div className="relative">
                <BrandLogo size="hero" hideStroke={true} className="text-white drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
                  {textData.title}
                </BrandLogo>
                <BrandLogo size="hero" hideStroke={true} className="absolute inset-0 text-black/10 blur-xl -z-10">
                  {textData.title}
                </BrandLogo>
              </div>
            )}
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-6 pointer-events-auto"
          >
            {isEditingText ? (
              <textarea 
                className="bg-transparent border border-white/20 rounded-xl p-4 text-white/90 font-sans tracking-[0.2em] md:tracking-[0.5em] uppercase text-[10px] md:text-sm text-center outline-none w-full max-w-lg min-h-[80px]"
                value={textData.subtitle}
                onChange={e => setTextData({ ...textData, subtitle: e.target.value })}
              />
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-px w-12 bg-[var(--accent)] mb-6" />
                <p className="text-white/90 font-sans tracking-[0.4em] md:tracking-[0.8em] uppercase text-[10px] md:text-sm drop-shadow-xl font-bold max-w-2xl leading-relaxed">
                  {textData.subtitle}
                </p>
              </div>
            )}
          </motion.div>

          {isAdmin && (
            <div className="mt-8 pointer-events-auto">
              {!isEditingText ? (
                <button 
                  onClick={() => setIsEditingText(true)}
                  className="px-4 py-2 rounded-full glass border border-white/20 text-white text-[10px] items-center gap-2 flex uppercase font-bold tracking-widest hover:bg-white/20 transition-all opacity-0 group-hover/banner:opacity-100"
                >
                  <Edit2 size={12} /> Sửa chữ
                </button>
              ) : (
                <div className="flex gap-4">
                  <button 
                    onClick={handleSaveText}
                    disabled={savingText}
                    className="px-6 py-2 rounded-full bg-green-500 text-white text-[10px] flex items-center gap-2 uppercase font-bold tracking-widest"
                  >
                    {savingText ? <Loader2 size={12} className="animate-spin" /> : 'Lưu'}
                  </button>
                  <button 
                    onClick={() => setIsEditingText(false)}
                    className="px-6 py-2 rounded-full glass border border-white/20 text-white text-[10px] uppercase font-bold tracking-widest"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Level 4: Ambient Scoped Particle System (z-index: 4) */}
      <ScopedParticles type="ambient" />

      {/* Level 5: Effect Toggle Switch (z-index: 50) */}
      <div className="absolute top-8 right-8 z-50 flex items-center gap-3">
        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40 opacity-0 group-hover/banner:opacity-100 transition-opacity">
          {isParticlesEnabled ? 'Trail On' : 'Trail Off'}
        </span>
        <button 
          onClick={toggleParticles}
          className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${isParticlesEnabled ? 'bg-[var(--accent)]' : 'bg-white/20'}`}
        >
          <motion.div 
            animate={{ x: isParticlesEnabled ? 16 : 0 }}
            className="w-4 h-4 bg-white rounded-full shadow-sm"
          />
        </button>
      </div>
    </section>
  );
};
