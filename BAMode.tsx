import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Github, ExternalLink, Calendar, GraduationCap, Briefcase, 
  Code2, MapPin, Phone, Mail, Sparkles, ArrowRight,
  Database, Layout, Smartphone, Camera, Heart, Globe, X,
  ClipboardList, Palette, Workflow, BookOpen, Layers, Edit2, Plus, Trash2, Loader2
} from 'lucide-react';
import CountUp from 'react-countup';
import { HeroBanner } from './HeroBanner';
import { useTheme } from '../context/ThemeContext';
import { ServicesSection } from './ServicesSection';
import { ImageWrapper } from './ImageWrapper';
import { compressImage } from '../lib/imageUtils';
import { fetchProfile, fetchMilestones, fetchBAProjects, fetchLifeHobbies, saveMilestone, deleteMilestone, saveBAProject, deleteBAProject, saveLifeHobby, deleteLifeHobby, saveProfile } from '../services/api';

const ProjectCarousel = ({ projects, isAdmin, onEdit }: { projects: any[], isAdmin?: boolean, onEdit?: (p: any) => void }) => {
  const [scrollX, setScrollX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!projects || projects.length === 0) {
    return (
      <div className="h-[400px] rounded-[30px] bg-[var(--secondary)]/30 border border-dashed border-[var(--accent)]/30 flex items-center justify-center">
        <p className="text-[var(--accent)]/40 text-xs font-bold uppercase tracking-[0.4em]">Project Showcase In Progress</p>
      </div>
    );
  }

  return (
    <div className="relative group/carousel">
      <div 
        ref={containerRef}
        className="flex gap-8 overflow-x-auto snap-x no-scrollbar pb-10 px-4"
        onScroll={(e) => setScrollX(e.currentTarget.scrollLeft)}
      >
        {projects.map((project, idx) => (
          <motion.div
            key={project.id || idx}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="min-w-[300px] md:min-w-[450px] snap-center aspect-[16/10] rounded-[32px] overflow-hidden relative group/item glass border border-white/30 shadow-xl"
          >
            {/* Multi-image Carousel - show first image if exists */}
            {project.images?.[0] ? (
              <img src={project.images[0]} className="w-full h-full object-cover" alt={project.title} />
            ) : (
              <div className="w-full h-full bg-[var(--secondary)]/20 flex flex-col items-center justify-center space-y-3">
                 <Database size={48} className="text-[var(--accent)] opacity-20" />
                 <p className="text-[8px] font-bold uppercase tracking-[0.4em] opacity-30">No Preview Image</p>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
              {isAdmin && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(project);
                  }}
                  className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white text-white hover:text-black rounded-lg backdrop-blur-md transition-all shadow-xl"
                >
                  <Edit2 size={16} />
                </button>
              )}
              <div className="space-y-3">
                <h4 className="text-2xl font-bold text-white">{project.title}</h4>
                <p className="text-sm text-white/70 font-medium">{project.role} • {project.description}</p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {project.tags?.map((tag: string) => (
                    <span key={tag} className="text-[9px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-md text-white">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.a 
                    href={project.github_url}
                    target="_blank"
                    whileHover={{ scale: 1.05 }}
                    className="flex-1 bg-white text-black py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider relative overflow-hidden group/btn ripple-parent"
                  >
                    View on GitHub
                    <div className="ripple-effect bg-black/5" />
                  </motion.a>
                  {project.flowchart_url && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      className="flex-1 bg-[var(--accent)] text-white py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider ripple-parent"
                    >
                      View Flowchart
                      <div className="ripple-effect bg-white/20" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const MemoryString = ({ items, isAdmin, onEdit, onAdd }: { items: any[], isAdmin?: boolean, onEdit?: (item: any) => void, onAdd?: () => void }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  if (!items || (items.length === 0 && !isAdmin)) {
    return <div ref={containerRef} className="hidden" />;
  }

  return (
    <section id="ba-memories" ref={containerRef} className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-20 flex justify-between items-end">
        <div>
           <h2 className="text-4xl font-display text-[var(--accent)] mb-2">Life & Hobbies</h2>
           <p className="text-[10px] tracking-[0.5em] font-bold uppercase text-[var(--accent)]/40">The Memory String</p>
        </div>
        {isAdmin && (
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
          >
            <Plus size={16} /> Thêm khoảnh khắc
          </button>
        )}
      </div>

      <div className="relative h-[600px] w-full flex items-center justify-center">
        {/* SVG String Path */}
        <svg className="absolute top-1/4 inset-x-0 w-full h-[200px] pointer-events-none" preserveAspectRatio="none">
           <motion.path
             d="M 0 100 Q 250 200 500 100 T 1000 100 T 1500 100"
             fill="none"
             stroke="var(--accent)"
             strokeWidth="1"
             strokeDasharray="5,5"
             className="opacity-30"
           />
        </svg>

        <div className="flex gap-12 md:gap-20 px-12 md:px-32 overflow-x-auto no-scrollbar snap-x relative z-10 w-full justify-center lg:justify-between items-center h-full">
           {items.map((item, i) => (
             <motion.div
               key={item.id}
               drag
               dragConstraints={{ left: -10, right: 10, top: -10, bottom: 10 }}
               animate={{ 
                 rotate: [i % 2 === 0 ? -3 : 3, i % 2 === 0 ? 3 : -3, i % 2 === 0 ? -3 : 3],
                 y: [0, -10, 0]
               }}
               transition={{ 
                 duration: 4 + i, 
                 repeat: Infinity,
                 ease: "easeInOut"
               }}
               className="min-w-[240px] md:min-w-[280px] bg-white p-4 pb-12 shadow-2xl rounded-sm border border-gray-100/50 snap-center transform-gpu cursor-grab active:cursor-grabbing relative group/mem"
             >
                <div className="aspect-square overflow-hidden mb-4 rounded-sm bg-gray-50 flex items-center justify-center">
                   {item.image_url ? (
                     <img src={item.image_url} className="w-full h-full object-cover" alt={item.title} />
                   ) : (
                     <div className="flex flex-col items-center justify-center opacity-20 transform -rotate-12">
                        <Camera size={40} className="text-[var(--accent)]" />
                        <span className="text-[7px] font-bold uppercase tracking-widest mt-2">Memory Slot</span>
                     </div>
                   )}
                </div>
                <div className="space-y-2">
                   <h5 className="font-signature text-2xl text-[var(--accent)]">{item.title}</h5>
                   <p className="text-[11px] leading-relaxed italic opacity-70">"{item.thought}"</p>
                   <div className="pt-2 flex justify-between items-center text-[8px] font-bold uppercase tracking-widest opacity-40">
                      <span>{item.date}</span>
                      <span>{item.location}</span>
                   </div>
                </div>
                {isAdmin && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(item);
                    }}
                    className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white text-black rounded-lg backdrop-blur-sm opacity-0 group-hover/mem:opacity-100 transition-all shadow-sm z-20"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
                {/* Pin/Clip Effect */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-8 bg-[var(--accent)]/10 rounded-full border border-[var(--accent)]/20" />
             </motion.div>
           ))}
        </div>
      </div>
    </section>
  );
};

export const BAMode = () => {
  const { isModelMode, isAdmin } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState<any>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [editingMilestoneId, setEditingMilestoneId] = useState<string | 'new' | null>(null);
  const [milestoneFormData, setMilestoneFormData] = useState<any>({});

  const [editingProjectId, setEditingProjectId] = useState<string | 'new' | null>(null);
  const [projectFormData, setProjectFormData] = useState<any>({});

  const [editingHobbyId, setEditingHobbyId] = useState<string | 'new' | null>(null);
  const [hobbyFormData, setHobbyFormData] = useState<any>({});

  const [uploading, setUploading] = useState(false);
  const projectImageInputRef = useRef<HTMLInputElement>(null);
  const hobbyImageInputRef = useRef<HTMLInputElement>(null);

  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 1000, 0.6);
        const currentImages = Array.isArray(projectFormData.images) ? projectFormData.images : [];
        setProjectFormData({ ...projectFormData, images: [...currentImages, compressed] });
      } catch (err) {
        console.error('Compression failed:', err);
        alert('Không thể nén ảnh.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleHobbyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 1000, 0.6);
        setHobbyFormData({ ...hobbyFormData, image_url: compressed });
      } catch (err) {
        console.error('Compression failed:', err);
        alert('Không thể nén ảnh.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadData = () => {
    fetchProfile().then(data => {
      setProfile(data);
      setProfileFormData(data);
    });
    fetchMilestones().then(setMilestones);
    fetchBAProjects().then(setProjects);
    fetchLifeHobbies().then(setMemories);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveMilestone(milestoneFormData);
      setEditingMilestoneId(null);
      loadData();
    } catch (err) {
      console.error('Failed to save milestone:', err);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm('Xóa mốc sự nghiệp này?')) return;
    try {
      await deleteMilestone(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    }
  };

  const handleNewMilestone = () => {
    setMilestoneFormData({
      year: new Date().getFullYear(),
      period: '',
      role: '',
      company: '',
      type: 'Agency',
      status: 'completed',
      description: '',
      projects: []
    });
    setEditingMilestoneId('new');
  };

  const handleEditMilestone = (m: any) => {
    setMilestoneFormData({ ...m });
    setEditingMilestoneId(m.id);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveBAProject(projectFormData);
      setEditingProjectId(null);
      loadData();
    } catch (err) {
      console.error('Failed to save project:', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Xóa dự án này?')) return;
    try {
      await deleteBAProject(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleNewProject = () => {
    setProjectFormData({
      title: '',
      role: '',
      description: '',
      github_url: '',
      flowchart_url: '',
      grid_class: '',
      images: [],
      tags: []
    });
    setEditingProjectId('new');
  };

  const handleEditProject = (p: any) => {
    setProjectFormData({ ...p });
    setEditingProjectId(p.id);
  };

  const handleHobbySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveLifeHobby(hobbyFormData);
      setEditingHobbyId(null);
      loadData();
    } catch (err) {
      console.error('Failed to save hobby:', err);
    }
  };

  const handleDeleteHobby = async (id: string) => {
    if (!confirm('Xóa khoảnh khắc này?')) return;
    try {
      await deleteLifeHobby(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete hobby:', err);
    }
  };

  const handleNewHobby = () => {
    setHobbyFormData({
      title: '',
      thought: '',
      image_url: '',
      date: new Date().toLocaleDateString('vi-VN'),
      location: 'Hanoi'
    });
    setEditingHobbyId('new');
  };

  const handleEditHobby = (h: any) => {
    setHobbyFormData({ ...h });
    setEditingHobbyId(h.id);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveProfile(profileFormData);
      setIsEditingProfile(false);
      loadData();
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 500, 0.7);
        setProfileFormData({ ...profileFormData, avatar_url: compressed });
      } catch (err) {
        console.error('Avatar compression failed:', err);
        alert('Lỗi nén ảnh đại diện.');
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const subjects = profile?.subjects ? (typeof profile.subjects === 'string' ? JSON.parse(profile.subjects) : profile.subjects) : [];

  return (
    <div className="bg-[#f8fcfb] text-[#1a2b27] font-sans selection:bg-[#A2D2FF] selection:text-white">
      <HeroBanner />

      {/* Admin Controls */}
      {isAdmin && (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3 pointer-events-none">
          {/* Admin buttons can be added here if needed, like the FAB in ModelMode */}
          <button className="hidden" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 space-y-32 py-32">
        {/* Section A: Bento Header */}
        <section id="professional-overview" className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[800px]">
          {/* Identity Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="md:col-span-8 bg-[#E6F4F1] rounded-[40px] p-10 flex flex-col md:flex-row gap-10 items-center border border-white/50 shadow-sm relative group/ident"
          >
            {isAdmin && !isEditingProfile && (
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="absolute top-6 right-6 p-3 bg-white/50 hover:bg-[var(--accent)] hover:text-white rounded-2xl transition-all shadow-sm opacity-0 group-hover/ident:opacity-100"
              >
                <Edit2 size={20} />
              </button>
            )}

            <div 
              className={`w-56 h-72 rounded-[32px] overflow-hidden flex-shrink-0 shadow-2xl border-4 border-white bg-white/40 flex items-center justify-center relative group/avatar ${isAdmin && isEditingProfile ? 'ring-2 ring-[var(--accent)] cursor-pointer' : ''}`}
              onClick={() => isAdmin && isEditingProfile && avatarInputRef.current?.click()}
            >
                {/* Image Placeholder or Actual Image */}
                {(isEditingProfile ? profileFormData.avatar_url : profile?.avatar_url) ? (
                  <img src={isEditingProfile ? profileFormData.avatar_url : profile?.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                     <Smartphone size={64} className="text-[#2d7a70]" />
                     <div className="text-[8px] font-extrabold uppercase tracking-[0.5em] text-center">{profile?.full_name?.split(' ').pop() || 'USER'} PHOTO</div>
                  </div>
                )}

                {isAdmin && isEditingProfile && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <Camera className="text-white" />
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                />
            </div>

            <div className="flex-1 space-y-6 w-full">
               {isEditingProfile ? (
                 <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Full Name</label>
                          <input 
                            type="text" 
                            value={profileFormData.full_name || ''} 
                            onChange={e => setProfileFormData({...profileFormData, full_name: e.target.value})}
                            className="w-full p-3 rounded-2xl bg-white/60 border border-white/80 focus:border-[var(--accent)] outline-none text-sm font-bold"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Job Title (BA)</label>
                          <input 
                            type="text" 
                            value={profileFormData.job_title_ba || ''} 
                            onChange={e => setProfileFormData({...profileFormData, job_title_ba: e.target.value})}
                            className="w-full p-3 rounded-2xl bg-white/60 border border-white/80 focus:border-[var(--accent)] outline-none text-sm font-bold"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Address</label>
                          <input 
                            type="text" 
                            value={profileFormData.address || ''} 
                            onChange={e => setProfileFormData({...profileFormData, address: e.target.value})}
                            className="w-full p-2 rounded-xl bg-white/60 border border-white/80 text-xs"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Phone</label>
                          <input 
                            type="text" 
                            value={profileFormData.phone || ''} 
                            onChange={e => setProfileFormData({...profileFormData, phone: e.target.value})}
                            className="w-full p-2 rounded-xl bg-white/60 border border-white/80 text-xs"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Email</label>
                          <input 
                            type="email" 
                            value={profileFormData.email || ''} 
                            onChange={e => setProfileFormData({...profileFormData, email: e.target.value})}
                            className="w-full p-2 rounded-xl bg-white/60 border border-white/80 text-xs"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Birth Date</label>
                          <input 
                            type="text" 
                            value={profileFormData.birth_date || ''} 
                            onChange={e => setProfileFormData({...profileFormData, birth_date: e.target.value})}
                            className="w-full p-2 rounded-xl bg-white/60 border border-white/80 text-xs"
                          />
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Career Goal</label>
                       <textarea 
                         rows={2}
                         value={profileFormData.career_goal || ''} 
                         onChange={e => setProfileFormData({...profileFormData, career_goal: e.target.value})}
                         className="w-full p-3 rounded-2xl bg-white/60 border border-white/80 focus:border-[var(--accent)] outline-none text-xs leading-relaxed"
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">University</label>
                          <input 
                            type="text" 
                            value={profileFormData.university || ''} 
                            onChange={e => setProfileFormData({...profileFormData, university: e.target.value})}
                            className="w-full p-2 rounded-xl bg-white/60 border border-white/80 text-xs"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">GPA</label>
                          <input 
                            type="text" 
                            value={profileFormData.gpa || ''} 
                            onChange={e => setProfileFormData({...profileFormData, gpa: e.target.value})}
                            className="w-full p-2 rounded-xl bg-white/60 border border-white/80 text-xs"
                          />
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Chuyên ngành (JSON array)</label>
                       <input 
                         type="text" 
                         value={Array.isArray(profileFormData.subjects) ? JSON.stringify(profileFormData.subjects) : profileFormData.subjects || '[]'} 
                         onChange={e => {
                           try {
                             const parsed = JSON.parse(e.target.value);
                             setProfileFormData({...profileFormData, subjects: parsed});
                           } catch {
                             setProfileFormData({...profileFormData, subjects: e.target.value});
                           }
                         }}
                         className="w-full p-2 rounded-xl bg-white/60 border border-white/80 text-[10px] font-mono"
                       />
                    </div>

                    <div className="flex gap-2 pt-2">
                       <button 
                         type="submit"
                         className="flex-1 py-3 bg-[var(--accent)] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
                       >
                         Lưu thay đổi
                       </button>
                       <button 
                         type="button"
                         onClick={() => {
                           setIsEditingProfile(false);
                           setProfileFormData(profile);
                         }}
                         className="px-6 py-3 bg-white/50 text-[#0d4f45] rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-white"
                       >
                         Hủy
                       </button>
                    </div>
                 </form>
               ) : (
                 <>
                   <div>
                      <h1 className="text-5xl font-bold tracking-tight mb-2 text-[#0d4f45]">{profile?.full_name || 'Hà Thị Thu Phương'}</h1>
                      <p className="text-lg text-[#2d7a70] font-medium tracking-wide uppercase">{profile?.job_title_ba || 'Business Analyst / UI-UX Professional'}</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 text-sm opacity-60">
                        <MapPin size={18} className="text-[#2d7a70]" /> {profile?.address}
                      </div>
                      <div className="flex items-center gap-3 text-sm opacity-60">
                        <Phone size={18} className="text-[#2d7a70]" /> {profile?.phone}
                      </div>
                      <div className="flex items-center gap-3 text-sm opacity-60">
                        <Mail size={18} className="text-[#2d7a70]" /> {profile?.email}
                      </div>
                      <div className="flex items-center gap-3 text-sm opacity-60">
                        <Calendar size={18} className="text-[#2d7a70]" /> {profile?.birth_date}
                      </div>
                   </div>

                   <div className="bg-white/40 p-6 rounded-[30px] border border-white/60">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 opacity-50">Mục tiêu nghề nghiệp</h4>
                      <p className="text-sm leading-relaxed font-medium">
                        {profile?.career_goal || 'Khảo sát yêu cầu, tài liệu hóa chuyên nghiệp, tối ưu hóa quy trình doanh nghiệp bằng giải pháp công nghệ.'}
                      </p>
                   </div>
                 </>
               )}
            </div>
          </motion.div>

          {/* Education Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="md:col-span-4 bg-[#A2D2FF]/20 rounded-[40px] p-10 flex flex-col justify-between border border-white/50 shadow-sm"
          >
            <div className="space-y-8">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-white rounded-2xl text-[#0d4f45] shadow-sm">
                    <GraduationCap size={28} />
                  </div>
                  <h3 className="text-xl font-bold leading-tight">Học vấn & Đào tạo</h3>
               </div>
               
               <div>
                  <h4 className="text-lg font-bold mb-1 text-[#0d4f45]">{profile?.university || 'Đại học CMC'}</h4>
                  <p className="text-xs font-bold opacity-40 uppercase tracking-widest">BSc in Information Systems</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-6 rounded-3xl text-center shadow-sm">
                    <span className="text-[9px] font-bold uppercase opacity-30 tracking-widest block mb-1">GPA</span>
                    <div className="text-4xl font-bold text-[#2d7a70]">
                       <CountUp end={parseFloat(profile?.gpa || '3.2')} decimals={1} duration={4} />
                       <span className="text-xs opacity-20 ml-1">/4.0</span>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-3xl text-center shadow-sm flex items-center justify-center">
                    <span className="text-[10px] font-bold leading-tight">Giỏi & Toàn diện</span>
                 </div>
               </div>

               <div className="space-y-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-3 ml-1">Chuyên ngành trọng tâm</h5>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s: string) => (
                      <span key={s} className="px-3 py-1.5 bg-[#E6F4F1] text-[9px] font-bold rounded-lg border border-white/50">
                        {s}
                      </span>
                    ))}
                  </div>
               </div>
            </div>
          </motion.div>
        </section>

        {/* Section B: Experience Timeline */}
        <section id="experience" className="relative pl-12 border-l-2 border-[#E6F4F1]">
           <div className="absolute top-0 -left-6 w-12 h-12 bg-[#0d4f45] text-white rounded-full flex items-center justify-center shadow-xl">
              <Workflow size={24} />
           </div>
           
           <div className="mb-20 ml-6 flex justify-between items-end">
              <div>
                 <h2 className="text-4xl font-display text-[#0d4f45] mb-2">Professional Journey</h2>
                 <p className="text-[10px] tracking-[0.5em] font-bold uppercase text-gray-400">Experience Timeline</p>
              </div>
              {isAdmin && (
                <button 
                  onClick={handleNewMilestone}
                  className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus size={16} /> Thêm giai đoạn
                </button>
              )}
           </div>

           <div className="space-y-16 ml-10">
              <AnimatePresence>
                {editingMilestoneId === 'new' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-16"
                  >
                    <form onSubmit={handleMilestoneSubmit} className="p-10 rounded-[40px] border border-dashed border-[var(--accent)]/50 bg-white/40 space-y-6">
                       <h3 className="text-lg font-bold text-[#0d4f45]">Thêm mốc sự nghiệp mới</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Năm (Để sắp xếp)</label>
                             <input 
                               type="number" 
                               value={milestoneFormData.year || ''} 
                               onChange={e => setMilestoneFormData({...milestoneFormData, year: parseInt(e.target.value)})}
                               className="w-full p-3 rounded-2xl bg-white border border-gray-100 outline-none text-sm font-bold"
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Thời gian (VD: 2023 - Present)</label>
                             <input 
                               type="text" 
                               value={milestoneFormData.period || ''} 
                               onChange={e => setMilestoneFormData({...milestoneFormData, period: e.target.value})}
                               className="w-full p-3 rounded-2xl bg-white border border-gray-100 outline-none text-sm font-bold"
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Loại (VD: Agency, Full-time)</label>
                             <input 
                               type="text" 
                               value={milestoneFormData.type || ''} 
                               onChange={e => setMilestoneFormData({...milestoneFormData, type: e.target.value})}
                               className="w-full p-3 rounded-2xl bg-white border border-gray-100 outline-none text-sm font-bold"
                             />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Vị trí</label>
                             <input 
                               type="text" 
                               value={milestoneFormData.role || ''} 
                               onChange={e => setMilestoneFormData({...milestoneFormData, role: e.target.value})}
                               className="w-full p-3 rounded-2xl bg-white border border-gray-100 outline-none text-sm font-bold"
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Công ty</label>
                             <input 
                               type="text" 
                               value={milestoneFormData.company || ''} 
                               onChange={e => setMilestoneFormData({...milestoneFormData, company: e.target.value})}
                               className="w-full p-3 rounded-2xl bg-white border border-gray-100 outline-none text-sm font-bold"
                             />
                          </div>
                       </div>

                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Mô tả</label>
                          <textarea 
                            rows={3}
                            value={milestoneFormData.description || ''} 
                            onChange={e => setMilestoneFormData({...milestoneFormData, description: e.target.value})}
                            className="w-full p-4 rounded-2xl bg-white border border-gray-100 outline-none text-xs leading-relaxed"
                          />
                       </div>

                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Dự án tham gia (Cấu trúc: ["Tên dự án 1", "Tên dự án 2"])</label>
                          <input 
                            type="text" 
                            value={Array.isArray(milestoneFormData.projects) ? JSON.stringify(milestoneFormData.projects) : milestoneFormData.projects || '[]'} 
                            onChange={e => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                setMilestoneFormData({...milestoneFormData, projects: parsed});
                              } catch {
                                setMilestoneFormData({...milestoneFormData, projects: e.target.value});
                              }
                            }}
                            className="w-full p-3 rounded-2xl bg-white border border-gray-100 outline-none text-xs font-mono"
                          />
                       </div>

                       <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={milestoneFormData.status === 'active'} 
                              onChange={e => setMilestoneFormData({...milestoneFormData, status: e.target.checked ? 'active' : 'completed'})}
                              className="w-4 h-4 rounded accent-[var(--accent)]"
                            />
                            <span className="text-[10px] font-bold uppercase opacity-60">Đang hoạt động (Active)</span>
                          </label>
                       </div>

                       <div className="flex gap-2 pt-4">
                          <button 
                            type="submit"
                            className="flex-1 py-3 bg-[var(--accent)] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
                          >
                            Lưu giai đoạn
                          </button>
                          <button 
                            type="button"
                            onClick={() => setEditingMilestoneId(null)}
                            className="px-6 py-3 bg-white/50 text-[#0d4f45] rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-white"
                          >
                            Hủy
                          </button>
                       </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {milestones.map((m, i) => (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="relative group/ms"
                >
                  {/* Indicator Dot */}
                  <div className={`absolute -left-[54px] top-6 w-5 h-5 rounded-full border-4 border-[#f8fcfb] z-10 transition-transform group-hover/ms:scale-125
                    ${m.status === 'active' ? 'bg-[#2d7a70]' : 'bg-gray-300'}`}
                  >
                    {m.status === 'active' && (
                      <div className="absolute inset-0 rounded-full bg-[#2d7a70] animate-ping opacity-75" />
                    )}
                  </div>

                  {editingMilestoneId === m.id ? (
                    <form onSubmit={handleMilestoneSubmit} className="p-10 rounded-[40px] border border-[var(--accent)] bg-white space-y-6 shadow-xl relative z-20">
                        {/* Same form as above but for editing */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Năm</label>
                             <input type="number" value={milestoneFormData.year || ''} onChange={e => setMilestoneFormData({...milestoneFormData, year: parseInt(e.target.value)})} className="w-full p-2 rounded-xl bg-gray-50 border-none outline-none text-sm font-bold" />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Thời gian</label>
                             <input type="text" value={milestoneFormData.period || ''} onChange={e => setMilestoneFormData({...milestoneFormData, period: e.target.value})} className="w-full p-2 rounded-xl bg-gray-50 border-none outline-none text-sm font-bold" />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Loại</label>
                             <input type="text" value={milestoneFormData.type || ''} onChange={e => setMilestoneFormData({...milestoneFormData, type: e.target.value})} className="w-full p-2 rounded-xl bg-gray-50 border-none outline-none text-sm font-bold" />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Vị trí</label>
                             <input type="text" value={milestoneFormData.role || ''} onChange={e => setMilestoneFormData({...milestoneFormData, role: e.target.value})} className="w-full p-2 rounded-xl bg-gray-50 border-none outline-none text-sm font-bold" />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Công ty</label>
                             <input type="text" value={milestoneFormData.company || ''} onChange={e => setMilestoneFormData({...milestoneFormData, company: e.target.value})} className="w-full p-2 rounded-xl bg-gray-50 border-none outline-none text-sm font-bold" />
                          </div>
                       </div>

                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Mô tả</label>
                          <textarea rows={3} value={milestoneFormData.description || ''} onChange={e => setMilestoneFormData({...milestoneFormData, description: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 border-none outline-none text-xs" />
                       </div>

                       <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={milestoneFormData.status === 'active'} onChange={e => setMilestoneFormData({...milestoneFormData, status: e.target.checked ? 'active' : 'completed'})} className="w-4 h-4 rounded accent-[var(--accent)]" />
                            <span className="text-[10px] font-bold uppercase opacity-60">Active</span>
                          </label>
                       </div>

                       <div className="flex gap-2">
                          <button type="submit" className="flex-1 py-3 bg-[var(--accent)] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all">Lưu</button>
                          <button type="button" onClick={() => setEditingMilestoneId(null)} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest">Hủy</button>
                          <button type="button" onClick={() => handleDeleteMilestone(m.id)} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                       </div>
                    </form>
                  ) : (
                    <div className={`p-10 rounded-[40px] border border-white/50 shadow-sm transition-all relative overflow-hidden
                      ${m.status === 'active' ? 'bg-[#E6F4F1]/30 border-[#A2D2FF]/30' : 'bg-white/40'}`}
                    >
                      {isAdmin && (
                        <button 
                          onClick={() => handleEditMilestone(m)}
                          className="absolute top-6 right-6 p-3 bg-white/50 hover:bg-[var(--accent)] hover:text-white rounded-2xl transition-all shadow-sm opacity-0 group-hover/ms:opacity-100 z-10"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}

                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8">
                         <div>
                            <div className="flex items-center gap-3 mb-2">
                               <h4 className="text-xl font-bold text-[#0d4f45]">{m.role}</h4>
                               {m.status === 'active' && (
                                 <span className="px-3 py-1 bg-[#2d7a70] text-white text-[8px] font-bold uppercase tracking-widest rounded-full flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Active
                                 </span>
                               )}
                            </div>
                            <p className="text-sm font-bold opacity-40 uppercase tracking-[0.2em]">{m.period} • {m.type}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-lg font-bold text-[#2d7a70]">{m.company}</p>
                            <p className="text-xs opacity-50 uppercase tracking-widest font-bold">Vị trí đảm nhiệm</p>
                         </div>
                      </div>
                      
                      <div className="space-y-6">
                         <p className="text-sm leading-relaxed opacity-70 border-l-4 border-[#2d7a70]/20 pl-6 italic">
                           {m.description}
                         </p>
                         
                         <div className="flex flex-wrap gap-2">
                           {m.projects.map((p: string) => (
                             <span key={p} className="px-4 py-2 bg-white/60 text-[10px] font-bold rounded-xl border border-white text-[#2d7a70]">
                                # {p}
                             </span>
                           ))}
                         </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
           </div>
        </section>

        {/* Section C: Project Showcase */}
        <section id="projects" className="space-y-16">
          <div className="flex justify-between items-center px-4">
             <div>
                <h2 className="text-4xl font-display text-[#0d4f45] mb-2">Project Showcase</h2>
                <p className="text-[10px] tracking-[0.5em] font-bold uppercase text-gray-400">Logic & Creativity</p>
             </div>
             <div className="flex gap-4">
                {isAdmin && (
                  <button 
                    onClick={handleNewProject}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:shadow-xl transition-all mr-4"
                  >
                    <Plus size={16} /> Thêm dự án
                  </button>
                )}
                <div className="p-4 bg-[#A2D2FF]/20 rounded-2xl text-[var(--accent)]"><Layers size={24} /></div>
                <div className="p-4 bg-[#E6F4F1] rounded-2xl text-[#2d7a70]"><Workflow size={24} /></div>
             </div>
          </div>

          <AnimatePresence>
            {editingProjectId && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-6 px-4 md:p-10 pointer-events-none"
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setEditingProjectId(null)} />
                <motion.div className="bg-[#f8fcfb] w-full max-w-4xl rounded-[40px] p-8 md:p-12 shadow-2xl relative z-10 overflow-y-auto max-h-[90vh] pointer-events-auto border border-white/50">
                   <button 
                      onClick={() => setEditingProjectId(null)}
                      className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-all"
                   >
                     <X size={24} />
                   </button>

                   <h3 className="text-3xl font-display text-[#0d4f45] mb-10">
                     {editingProjectId === 'new' ? 'Thêm dự án mới' : 'Chỉnh sửa dự án'}
                   </h3>

                   <form onSubmit={handleProjectSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Tên dự án</label>
                            <input 
                              type="text" 
                              required
                              value={projectFormData.title || ''} 
                              onChange={e => setProjectFormData({...projectFormData, title: e.target.value})}
                              className="w-full p-4 rounded-[24px] bg-white border border-gray-100 focus:border-[var(--accent)] outline-none text-sm font-bold shadow-sm"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Vai trò</label>
                            <input 
                              type="text" 
                              required
                              value={projectFormData.role || ''} 
                              onChange={e => setProjectFormData({...projectFormData, role: e.target.value})}
                              className="w-full p-4 rounded-[24px] bg-white border border-gray-100 focus:border-[var(--accent)] outline-none text-sm font-bold shadow-sm"
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Mô tả ngắn</label>
                         <textarea 
                           rows={3}
                           required
                           value={projectFormData.description || ''} 
                           onChange={e => setProjectFormData({...projectFormData, description: e.target.value})}
                           className="w-full p-5 rounded-[30px] bg-white border border-gray-100 focus:border-[var(--accent)] outline-none text-sm leading-relaxed shadow-sm"
                         />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase opacity-40 ml-1">GitHub URL</label>
                            <input 
                              type="url" 
                              value={projectFormData.github_url || ''} 
                              onChange={e => setProjectFormData({...projectFormData, github_url: e.target.value})}
                              className="w-full p-4 rounded-[24px] bg-white border border-gray-100 focus:border-[var(--accent)] outline-none text-xs font-mono shadow-sm"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Flowchart URL</label>
                            <input 
                              type="url" 
                              value={projectFormData.flowchart_url || ''} 
                              onChange={e => setProjectFormData({...projectFormData, flowchart_url: e.target.value})}
                              className="w-full p-4 rounded-[24px] bg-white border border-gray-100 focus:border-[var(--accent)] outline-none text-xs font-mono shadow-sm"
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Images (Tải lên hoặc nhập JSON array)</label>
                         <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={Array.isArray(projectFormData.images) ? JSON.stringify(projectFormData.images) : projectFormData.images || '[]'} 
                              onChange={e => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  setProjectFormData({...projectFormData, images: parsed});
                                } catch {
                                  setProjectFormData({...projectFormData, images: e.target.value});
                                }
                              }}
                              className="flex-1 p-4 rounded-[24px] bg-white border border-gray-100 focus:border-[var(--accent)] outline-none text-[10px] font-mono shadow-sm"
                            />
                            <button 
                              type="button"
                              onClick={() => projectImageInputRef.current?.click()}
                              disabled={uploading}
                              className="px-6 rounded-[24px] bg-white border border-gray-100 hover:bg-gray-50 flex items-center justify-center text-[var(--accent)]"
                            >
                              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                            </button>
                            <input 
                              type="file" 
                              ref={projectImageInputRef} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handleProjectImageUpload} 
                            />
                         </div>
                         {Array.isArray(projectFormData.images) && projectFormData.images.length > 0 && (
                           <div className="flex gap-2 mt-2 px-2 overflow-x-auto pb-2">
                              {projectFormData.images.map((img: string, idx: number) => (
                                <div key={idx} className="relative w-16 h-12 flex-shrink-0 group">
                                   <img src={img} className="w-full h-full object-cover rounded-lg border border-gray-100" />
                                   <button 
                                      onClick={() => {
                                        const newImgs = [...projectFormData.images];
                                        newImgs.splice(idx, 1);
                                        setProjectFormData({...projectFormData, images: newImgs});
                                      }}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                   >
                                      <X size={10} />
                                   </button>
                                </div>
                              ))}
                           </div>
                         )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Tags (JSON array: ["React", "UI/UX"])</label>
                           <input 
                             type="text" 
                             value={Array.isArray(projectFormData.tags) ? JSON.stringify(projectFormData.tags) : projectFormData.tags || '[]'} 
                             onChange={e => {
                               try {
                                 const parsed = JSON.parse(e.target.value);
                                 setProjectFormData({...projectFormData, tags: parsed});
                               } catch {
                                 setProjectFormData({...projectFormData, tags: e.target.value});
                               }
                             }}
                             className="w-full p-4 rounded-[24px] bg-white border border-gray-100 focus:border-[var(--accent)] outline-none text-[10px] font-mono shadow-sm"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Grid Class (Tailwind)</label>
                           <input 
                             type="text" 
                             value={projectFormData.grid_class || ''} 
                             onChange={e => setProjectFormData({...projectFormData, grid_class: e.target.value})}
                             placeholder="e.g. md:col-span-8"
                             className="w-full p-4 rounded-[24px] bg-white border border-gray-100 focus:border-[var(--accent)] outline-none text-xs shadow-sm"
                           />
                        </div>
                      </div>

                      <div className="flex gap-4">
                         <button 
                           type="submit"
                           className="flex-1 py-5 bg-[var(--accent)] text-white rounded-[30px] text-xs font-bold uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                         >
                           Lưu dự án
                         </button>
                         {editingProjectId !== 'new' && (
                           <button 
                             type="button" 
                             onClick={() => {
                               if (editingProjectId && editingProjectId !== 'new') {
                                 handleDeleteProject(editingProjectId as string);
                               }
                             }}
                             className="p-5 bg-red-50 text-red-500 rounded-[30px] hover:bg-red-500 hover:text-white transition-all shadow-sm"
                           >
                             <Trash2 size={20} />
                           </button>
                         )}
                      </div>
                   </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <ProjectCarousel projects={projects} isAdmin={isAdmin} onEdit={handleEditProject} />
        </section>

        {/* Section D: Expertise */}
        <ServicesSection isAdmin={isAdmin} />

        {/* Section E: Memory String */}
        <MemoryString items={memories} isAdmin={isAdmin} onEdit={handleEditHobby} onAdd={handleNewHobby} />
        
        <AnimatePresence>
          {editingHobbyId && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-6 px-4 md:p-10 pointer-events-none"
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setEditingHobbyId(null)} />
              <motion.div className="bg-[#f8fcfb] w-full max-w-2xl rounded-[40px] p-8 md:p-12 shadow-2xl relative z-10 overflow-y-auto max-h-[90vh] pointer-events-auto border border-white/50">
                 <button 
                    onClick={() => setEditingHobbyId(null)}
                    className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-all"
                 >
                   <X size={24} />
                 </button>

                 <h3 className="text-3xl font-display text-[#0d4f45] mb-10">
                   {editingHobbyId === 'new' ? 'Thêm khoảnh khắc mới' : 'Chỉnh sửa khoảnh khắc'}
                 </h3>

                 <form onSubmit={handleHobbySubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Tiêu đề</label>
                          <input 
                            type="text" 
                            required
                            value={hobbyFormData.title || ''} 
                            onChange={e => setHobbyFormData({...hobbyFormData, title: e.target.value})}
                            className="w-full p-3 rounded-2xl bg-white border border-gray-100 outline-none text-sm font-bold shadow-sm"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Ngày (VD: 2024)</label>
                          <input 
                            type="text" 
                            value={hobbyFormData.date || ''} 
                            onChange={e => setHobbyFormData({...hobbyFormData, date: e.target.value})}
                            className="w-full p-3 rounded-2xl bg-white border border-gray-100 outline-none text-sm font-bold shadow-sm"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Image URL / Upload</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={hobbyFormData.image_url || ''} 
                              onChange={e => setHobbyFormData({...hobbyFormData, image_url: e.target.value})}
                              className="flex-1 p-3 rounded-2xl bg-white border border-gray-100 outline-none text-[10px] font-mono shadow-sm"
                            />
                            <button 
                              type="button"
                              onClick={() => hobbyImageInputRef.current?.click()}
                              disabled={uploading}
                              className="px-4 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 flex items-center justify-center text-[var(--accent)]"
                            >
                              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                            </button>
                            <input 
                              type="file" 
                              ref={hobbyImageInputRef} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handleHobbyImageUpload} 
                            />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Địa điểm</label>
                          <input 
                            type="text" 
                            value={hobbyFormData.location || ''} 
                            onChange={e => setHobbyFormData({...hobbyFormData, location: e.target.value})}
                            className="w-full p-3 rounded-2xl bg-white border border-gray-100 outline-none text-xs shadow-sm"
                          />
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-bold uppercase opacity-40 ml-1">Cảm nghĩ (Thought)</label>
                       <textarea 
                         rows={3}
                         value={hobbyFormData.thought || ''} 
                         onChange={e => setHobbyFormData({...hobbyFormData, thought: e.target.value})}
                         className="w-full p-4 rounded-3xl bg-white border border-gray-100 outline-none text-xs leading-relaxed shadow-sm italic"
                       />
                    </div>

                    <div className="flex gap-2 pt-4">
                       <button 
                         type="submit"
                         className="flex-1 py-4 bg-[var(--accent)] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all"
                       >
                         Lưu khoảnh khắc
                       </button>
                       {editingHobbyId !== 'new' && (
                         <button 
                           type="button"
                           onClick={() => {
                             if (editingHobbyId && editingHobbyId !== 'new') {
                               handleDeleteHobby(editingHobbyId as string);
                             }
                           }}
                           className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                         >
                           <Trash2 size={20} />
                         </button>
                       )}
                    </div>
                 </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Water Ripple Global Helper - implemented as styled-components or in index.css but we'll use inline tailwind logic */}
      <style>{`
        .ripple-parent { position: relative; overflow: hidden; }
        .ripple-effect {
          position: absolute;
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.8s linear;
          pointer-events: none;
        }
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        .organic-photo {
           box-shadow: 0 10px 30px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.01);
        }
      `}</style>
    </div>
  );
};
