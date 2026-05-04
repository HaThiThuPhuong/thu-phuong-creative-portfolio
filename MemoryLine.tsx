import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Briefcase, GraduationCap, MapPin, Calendar, Quote, X } from 'lucide-react';

interface MemoryItem {
  id: string;
  image: string;
  title: string;
  thought: string;
  time: string;
  location: string;
  icon: any;
  note: string;
  rotate: number;
  position: { x: number; y: number };
}

const memories: MemoryItem[] = [
  {
    id: 'm1',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80',
    title: 'Teambuilding rực rỡ',
    thought: 'Làm hết mình, chơi nhiệt tình!',
    time: 'Tháng 10/2025',
    location: 'Hạ Long',
    icon: Heart,
    note: 'Kỷ niệm lần đầu gắn kết cùng mọi người trong team mới tại vịnh Hạ Long. Học được bài học về sự tin tưởng!',
    rotate: -3,
    position: { x: 5, y: 15 }
  },
  {
    id: 'm2',
    image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80',
    title: 'Leader Moment',
    thought: 'Học được cách quản lý team qua buổi này.',
    time: 'Tháng 12/2025',
    location: 'Office',
    icon: Briefcase,
    note: 'Lần đầu đứng ra dẫn dắt một task quan trọng. Áp lực nhưng rất vui! Mọi người đã hỗ trợ mình rất nhiều.',
    rotate: 4,
    position: { x: 25, y: 5 }
  },
  {
    id: 'm3',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80',
    title: 'Sweet Strawberry',
    thought: 'Những khoảnh khắc ngọt ngào bên ly cafe.',
    time: 'Mùa xuân 2026',
    location: 'Cầu Giấy, HN',
    icon: Heart,
    note: 'Tìm thấy nguồn cảm hứng BA từ chính những sở thích đời thường. Đôi khi logic đến từ sự thư giãn.',
    rotate: -2,
    position: { x: 45, y: 20 }
  },
  {
    id: 'm4',
    image: 'https://images.unsplash.com/photo-1523050338692-7b84878a6ff3?auto=format&fit=crop&q=80',
    title: 'The Beginning',
    thought: 'Hành trình vạn dặm bắt đầu từ một bước chân.',
    time: 'Mùa thu 2024',
    location: 'Đại học CMC',
    icon: GraduationCap,
    note: 'Ngày đầu tiên chính thức theo đuổi con đường Business Analyst. Đầy hào hứng và một chút lo lắng!',
    rotate: 5,
    position: { x: 65, y: 10 }
  },
  {
    id: 'm5',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80',
    title: 'Collaboration Hub',
    thought: 'Cùng nhau tạo ra những giá trị thật.',
    time: 'Tháng 02/2026',
    location: 'Hà Nội',
    icon: Briefcase,
    note: 'Buổi brainstorming căng thẳng nhưng hiệu quả. Ý tưởng lớn luôn nảy sinh từ sự va chạm góc nhìn.',
    rotate: -4,
    position: { x: 82, y: 22 }
  }
];

const Polaroid: React.FC<{ item: MemoryItem }> = ({ item }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showNote, setShowNote] = useState(false);

  return (
    <>
      <motion.div
        initial={{ y: 20, opacity: 0, rotate: item.rotate }}
        whileInView={{ y: 0, opacity: 1 }}
        animate={!isHovered ? { 
          rotate: [item.rotate - 1.5, item.rotate + 1.5, item.rotate - 1.5],
          y: [0, 8, 0]
        } : { 
          scale: 1.15, 
          zIndex: 50,
          rotate: 0,
          y: -15 
        }}
        transition={!isHovered ? {
          rotate: { duration: 4 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }
        } : { duration: 0.3, type: 'spring', stiffness: 300 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowNote(true)}
        className="absolute cursor-pointer"
        style={{ 
          left: `${item.position.x}%`, 
          top: `${item.position.y}%`
        }}
      >
        {/* String attachment line (visual) */}
        <div className="absolute -top-16 left-1/2 w-[1.5px] h-16 bg-[var(--accent)] opacity-30 pointer-events-none" />
        
        {/* Clip (visual) */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-5 bg-amber-800/90 rounded-sm z-10 shadow-md border-b border-black/20" />

        <div className="bg-white p-4 pb-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col gap-3 w-52 md:w-64">
          <div className="aspect-[4/5] overflow-hidden bg-gray-50 relative group/img">
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
              referrerPolicy="no-referrer"
            />
            {/* Icon in corner as requested */}
            <div className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-[var(--accent)]">
               <item.icon size={14} />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">{item.title}</h4>
            <p className="text-[13px] font-handwriting text-[var(--accent)] italic leading-tight scale-110 origin-left">"{item.thought}"</p>
            <div className="flex flex-col gap-1 pt-3 border-t border-gray-100 mt-1">
              <div className="flex items-center gap-1.5 text-[9px] font-medium opacity-40">
                <Calendar size={10} /> {item.time}
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-medium opacity-40">
                <MapPin size={10} /> {item.location}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showNote && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNote(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass max-w-sm w-full rounded-[30px] p-8 relative z-[101] shadow-2xl border border-white/30"
            >
              <button 
                onClick={() => setShowNote(false)}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--secondary)] flex items-center justify-center text-[var(--accent)] mb-4">
                  <Quote size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Lời nhắn từ Phương</h3>
                <p className="text-sm opacity-80 leading-relaxed font-handwriting text-lg italic">
                  "{item.note}"
                </p>
                <div className="mt-8 flex gap-2">
                   <span className="px-3 py-1 bg-[var(--secondary)] text-[var(--accent)] text-[10px] font-bold rounded-full uppercase tracking-wider">
                     {item.location}
                   </span>
                   <span className="px-3 py-1 bg-white/50 text-gray-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                     {item.time}
                   </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export const MemoryLine = ({ id }: { id?: string }) => {
  return (
    <section id={id} className="relative py-32 overflow-hidden bg-[var(--bg)]/50 min-h-[600px] md:min-h-[800px]">
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <h2 className="text-4xl font-display text-[var(--accent)] drop-shadow-sm">The Memory Line</h2>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-[10px] uppercase tracking-[0.6em] font-bold text-[var(--accent)] opacity-40">Dây treo ký ức</p>
          <div className="h-[1px] w-24 bg-[var(--accent)] opacity-20"></div>
        </div>
      </div>

      <div className="relative w-full h-full min-h-[500px]">
        {/* SVG String Path */}
        <svg className="absolute top-20 left-0 w-full h-32 pointer-events-none overflow-visible" preserveAspectRatio="none">
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            d="M -50 40 Q 500 120 1050 20"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="5,5"
            className="opacity-30"
          />
        </svg>

        {/* Polaroid Items */}
        <div className="relative w-full h-[600px] md:h-[700px] md:max-w-7xl mx-auto overflow-x-auto no-scrollbar md:overflow-visible">
          <div className="min-w-[1000px] md:min-w-0 h-full relative">
            {memories.map((memory) => (
              <Polaroid key={memory.id} item={memory} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
