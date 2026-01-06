import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { AnimeSummary, SearchResult } from '../types';
import { getHighQualityPoster } from '../services/jikanService';

interface AnimeCardProps {
  anime: AnimeSummary | SearchResult;
  onClick: (slug: string) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick }) => {
  const [currentPoster, setCurrentPoster] = useState(anime.poster);
  const [isHovered, setIsHovered] = useState(false);

  const title = anime.title;
  const id = (anime as AnimeSummary).animeId || (anime as SearchResult).slug;
  const episodeCount = (anime as AnimeSummary).episodes || (anime as any).current_episode;
  const status = (anime as SearchResult).status;
  // Extract releaseDay safely as it's optional on AnimeSummary and missing on SearchResult
  const releaseDay = (anime as AnimeSummary).releaseDay;

  // Upgrade image quality on mount
  useEffect(() => {
    let isMounted = true;
    
    // Don't fetch if it's already a high-res source (like Jikan Top Anime)
    // Basic heuristic: Otakudesu/Kuramanime images usually don't have 'myanimelist' in domain
    if (!anime.poster.includes('myanimelist') && !anime.poster.includes('cdn.myanimelist')) {
        getHighQualityPoster(title).then((hdUrl) => {
            if (isMounted && hdUrl) {
                setCurrentPoster(hdUrl);
            }
        });
    }

    return () => { isMounted = false; };
  }, [title, anime.poster]);

  return (
    <div 
      className="group relative cursor-pointer flex flex-col gap-2.5 w-full transform-gpu"
      onClick={() => onClick(id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 
         Change: Replaced ring-4 with custom shadow and scale.
         Use transform-gpu for smoother animation.
         z-index ensures the hovered card sits on top of siblings visually if they overlap slightly.
      */}
      <div 
        className={`
            relative aspect-[2/3] rounded-xl overflow-hidden transition-all duration-300 ease-out
            z-0 group-hover:z-20
            ${isHovered ? 'scale-105 shadow-[0_0_20px_rgba(0,163,255,0.6)]' : 'shadow-none'}
        `}
      >
        <img 
          src={currentPoster} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Hover Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-60'}`} />

        {/* Play Icon on Hover */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <div className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/50">
                <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
        </div>

        {/* Top Left Badge */}
        {(status || episodeCount) && (
             <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-wider">
                {episodeCount ? `EP ${episodeCount}` : status}
            </div>
        )}
      </div>

      <div className="px-0.5 space-y-1">
        <h3 
            className={`font-bold text-base leading-tight line-clamp-2 transition-colors duration-300 ${isHovered ? 'text-primary' : 'text-white'}`} 
            title={title}
        >
          {title}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-1 flex items-center gap-1">
            {anime.type || 'Anime'} {releaseDay ? `• ${releaseDay}` : ''}
        </p>
      </div>
    </div>
  );
};