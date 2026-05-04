import React from 'react';
import { ExternalLink, Navigation } from 'lucide-react';

interface GoogleMapProps {
  lat: number;
  lng: number;
  name: string;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({ lat, lng, name }) => {
  const latitude = lat || 21.0285;
  const longitude = lng || 105.8542;
  
  // Use name for search if available, otherwise coordinates
  const searchQuery = name ? encodeURIComponent(name) : `${latitude},${longitude}`;
  const embedUrl = `https://maps.google.com/maps?q=${searchQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;

  return (
    <div className="w-full h-full rounded-[30px] overflow-hidden relative group border border-white/20 bg-white/10">
      <iframe
        title={name}
        className="w-full h-full grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={embedUrl}
      />
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <a 
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          title="Chỉ đường"
        >
          <Navigation size={18} />
        </a>
      </div>
      <div className="absolute bottom-4 left-6 right-6">
        <div className="glass p-3 rounded-2xl border border-white/20">
           <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--accent)] flex items-center gap-2">
             <ExternalLink size={12} /> {name}
           </p>
        </div>
      </div>
    </div>
  );
};
