import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AnimeCard } from './components/AnimeCard';
import { AIChat } from './components/AIChat';
import { 
  getOngoingAnime, 
  searchAnime, 
  getAnimeDetail, 
  getEpisodeStream, 
  getServerUrl,
  getCompletedAnime, 
  getGenres, 
  getAnimeByGenre, 
  getFullAnimeList,
  getCategoryAnime
} from './services/animeService';
import { getJikanMetadata, getTopAnime } from './services/jikanService';
import { getGeminiSummary } from './services/geminiService';
import { AnimeSummary, SearchResult, AnimeDetail, StreamResponse, AnimeSource, PaginationInfo, Genre } from './types';
import { Play, Clock, Info, ArrowLeft, Layers, Video, CheckCircle, ChevronLeft, ChevronRight, Hash, FolderOpen, Tag, Star, Film, Flame, Monitor, Tv, Plus, RefreshCw, ExternalLink } from 'lucide-react';

// --- Context for Global Source Management ---
interface SourceContextType {
  source: AnimeSource;
  setSource: (s: AnimeSource) => void;
}
const SourceContext = createContext<SourceContextType>({ source: 'otakudesu', setSource: () => {} });

// --- Components ---

// Featured Hero Component for Home Page
const HomeHero: React.FC<{ anime: AnimeSummary | null, onClick: (id: string) => void }> = ({ anime, onClick }) => {
    if (!anime) return <div className="w-full h-[50vh] bg-surface animate-pulse" />;

    return (
        <div className="relative w-full h-[60vh] md:h-[70vh] flex items-end overflow-hidden group">
            <div className="absolute inset-0">
                <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover object-top opacity-60 group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0F] via-[#0B0C0F]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C0F] via-[#0B0C0F]/60 to-transparent" />
            </div>
            
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-20">
                <div className="max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-700">
                    <span className="inline-block px-2 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-sm mb-2">
                        Featured Highlight
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl">
                        {anime.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-300">
                        <span className="text-green-400">98% Match</span>
                        <span>{anime.releaseDay || '2024'}</span>
                        <span className="border border-gray-600 px-1 rounded text-xs">HD</span>
                        <span>{anime.episodes ? `${anime.episodes} Eps` : 'Ongoing'}</span>
                    </div>
                    <p className="text-gray-300 line-clamp-2 md:line-clamp-3 text-lg max-w-xl">
                        Experience the latest episode of this trending anime. Click to start watching immediately on our premium player.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={() => onClick(anime.animeId)}
                            className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded font-bold flex items-center gap-2 transition-colors uppercase tracking-wide"
                        >
                            <Play className="w-5 h-5 fill-black" /> Play Now
                        </button>
                        <button className="bg-white/10 text-white hover:bg-white/20 border border-white/20 px-8 py-3 rounded font-bold flex items-center gap-2 transition-colors uppercase tracking-wide">
                            <Plus className="w-5 h-5" /> My List
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HorizontalList: React.FC<{ title: string, list: AnimeSummary[], isLoading: boolean, onNavigate: (id: string) => void }> = ({ title, list, isLoading, onNavigate }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth / 1.5 : current.offsetWidth / 1.5;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 my-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-6 w-48 bg-surface rounded animate-pulse" />
                <div className="flex gap-6 overflow-hidden py-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[160px] md:w-[200px] h-[280px] bg-surface rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (list.length === 0) return null;

    return (
        <div className="space-y-2 group/section my-12 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide hover:text-primary cursor-pointer transition-colors flex items-center gap-2">
                    {title} <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover/section:opacity-100 transition-opacity" />
                </h2>
                <span className="text-xs font-bold text-primary cursor-pointer uppercase hover:underline opacity-80">View All</span>
            </div>
            
            <div className="relative group">
                <button 
                    onClick={() => scroll('left')} 
                    className="absolute -left-4 top-0 bottom-0 z-20 w-16 bg-gradient-to-r from-[#0B0C0F] via-[#0B0C0F]/80 to-transparent flex items-center justify-start pl-4 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                >
                    <ChevronLeft className="w-10 h-10 text-white hover:text-primary transition-colors drop-shadow-lg" />
                </button>

                <div 
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto py-8 snap-x snap-mandatory scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {list.map((anime, idx) => (
                        <div key={`${anime.animeId || idx}`} className="flex-shrink-0 w-[160px] md:w-[200px] snap-start transition-transform">
                            <AnimeCard anime={anime} onClick={onNavigate} />
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => scroll('right')} 
                    className="absolute -right-4 top-0 bottom-0 z-20 w-16 bg-gradient-to-l from-[#0B0C0F] via-[#0B0C0F]/80 to-transparent flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronRight className="w-10 h-10 text-white hover:text-primary transition-colors drop-shadow-lg" />
                </button>
            </div>
        </div>
    );
};

const HomePage: React.FC = () => {
  const { source } = useContext(SourceContext);
  const navigate = useNavigate();

  const [ongoing, setOngoing] = useState<AnimeSummary[]>([]);
  const [movies, setMovies] = useState<AnimeSummary[]>([]);
  const [completed, setCompleted] = useState<AnimeSummary[]>([]);
  const [popular, setPopular] = useState<AnimeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const [ongoingData, moviesData, completedData, popularData] = await Promise.all([
          getOngoingAnime(source, 1),
          getCategoryAnime(source, 'movie', 1),
          getCompletedAnime(source, 1),
          getTopAnime()
      ]);
      setOngoing(ongoingData.data);
      setMovies(moviesData.data);
      setCompleted(completedData.data);
      setPopular(popularData);
      setLoading(false);
    };
    fetchAllData();
  }, [source]);

  const handleNavigate = (slug: string) => slug && navigate(`/detail/${slug}`);
  const handleJikanClick = (title: string) => navigate(`/search?q=${encodeURIComponent(title)}`);

  // Pick a random featured anime from ongoing list
  const featuredAnime = ongoing.length > 0 ? ongoing[0] : null;

  return (
    <div className="pb-12 -mt-16 md:-mt-20"> {/* Negative margin to pull under transparent navbar */}
      <HomeHero anime={featuredAnime} onClick={(id) => handleNavigate(id)} />

      <div className="relative z-20 -mt-10 md:-mt-20 bg-gradient-to-t from-[#0B0C0F] via-[#0B0C0F] to-transparent pt-10">
          <HorizontalList 
            title="Newly Released Episodes" 
            list={ongoing.slice(1)} 
            isLoading={loading}
            onNavigate={handleNavigate}
          />

          <HorizontalList 
            title="Top Rated Globally" 
            list={popular} 
            isLoading={loading}
            onNavigate={(id) => {
                 // The anime card usually passes an ID, but for Jikan lists we need the title fallback logic
                 const item = popular.find(p => p.animeId === id) || popular.find(p => p.poster.includes('myanimelist')); // rough check
                 if (item) handleJikanClick(item.title);
                 else handleJikanClick(id); // fallback if ID is actually title in some contexts
            }}
          />

          <HorizontalList 
            title="Movies & Specials" 
            list={movies} 
            isLoading={loading}
            onNavigate={handleNavigate}
          />

          <HorizontalList 
            title="Binge-Worthy Completed Series" 
            list={completed} 
            isLoading={loading}
            onNavigate={handleNavigate}
          />
      </div>
    </div>
  );
};

const DetailPage: React.FC = () => {
  const { source } = useContext(SourceContext);
  const { slug } = useParams();
  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>('');
  const navigate = useNavigate();

  const loadDetail = async () => {
    if (!slug) return;
    setLoading(true);
    const sourceData = await getAnimeDetail(source, slug);
    if (!sourceData) { setLoading(false); return; }
    setDetail(sourceData);
    setLoading(false);
    
    const jikanData = await getJikanMetadata(sourceData.title);
    if (jikanData) setDetail(prev => prev ? ({ ...prev, ...jikanData }) : null);
    
    const summary = await getGeminiSummary(sourceData.title, jikanData?.synopsis || sourceData.synopsis);
    setAiSummary(summary);
  };

  useEffect(() => {
    loadDetail();
  }, [slug, source]);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#0B0C0F]"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (!detail) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-[#0B0C0F]">
        <h2 className="text-2xl font-bold text-white mb-2">Oops! Details Not Found</h2>
        <p className="text-gray-400 mb-6 max-w-md">We couldn't retrieve the details for this anime. It might be a bad link or the server is busy.</p>
        <div className="flex gap-4">
            <button onClick={() => navigate(-1)} className="px-6 py-2 border border-white/20 rounded hover:bg-white/10 text-white transition-colors">Go Back</button>
            <button onClick={loadDetail} className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Retry
            </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0C0F] -mt-20">
      {/* Full Screen Hero Background */}
      <div className="relative w-full h-[80vh] md:h-[90vh]">
          <img src={detail.poster} alt={detail.title} className="w-full h-full object-cover object-top opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0F] via-[#0B0C0F]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C0F] via-[#0B0C0F]/80 to-transparent" />
          
          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-16">
             <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="flex gap-2">
                    {detail.genres.slice(0,3).map((g, i) => (
                        <span key={i} className="text-xs font-bold uppercase tracking-wider text-primary border border-primary/30 px-2 py-1 rounded">
                            {g.name}
                        </span>
                    ))}
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black text-white leading-tight drop-shadow-2xl">
                    {detail.title}
                </h1>

                <div className="flex items-center gap-6 text-sm md:text-base font-medium text-gray-200">
                    <span className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4 fill-yellow-400" /> {detail.score || 'N/A'}</span>
                    <span>{detail.release_date}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-white text-xs">{detail.type}</span>
                    <span>{detail.total_episodes} Episodes</span>
                </div>

                <div className="grid md:grid-cols-[2fr_1fr] gap-8">
                     <p className="text-gray-300 text-lg leading-relaxed line-clamp-3 md:line-clamp-4 max-w-2xl">
                        {aiSummary || detail.synopsis}
                     </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                    <button 
                        onClick={() => detail.episode_list.length > 0 && navigate(`/watch/${detail.episode_list[0].slug}`)}
                        className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded font-bold flex items-center gap-3 transition-all transform hover:scale-105 shadow-lg shadow-primary/30 uppercase tracking-widest"
                    >
                        <Play className="w-6 h-6 fill-white" /> Start Watching
                    </button>
                    {detail.trailer_url && (
                        <a 
                            href={detail.trailer_url} target="_blank" rel="noreferrer"
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded font-bold flex items-center gap-3 transition-colors uppercase tracking-widest"
                        >
                            <Video className="w-6 h-6" /> Trailer
                        </a>
                    )}
                </div>
             </div>
          </div>
      </div>

      {/* Episodes & Info Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
         <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        Episodes <span className="text-gray-500 text-lg font-normal">({detail.episode_list.length})</span>
                     </h3>
                     <div className="text-sm text-primary font-bold cursor-pointer hover:underline">See All</div>
                </div>

                <div className="grid gap-3">
                    {detail.episode_list.map((ep, idx) => (
                        <div 
                            key={idx}
                            onClick={() => navigate(`/watch/${ep.slug}`)}
                            className="group flex items-center justify-between p-4 bg-surface/50 hover:bg-white/5 border border-white/5 hover:border-primary/50 rounded-lg cursor-pointer transition-all"
                        >
                             <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                     <Play className="w-4 h-4 fill-current ml-0.5" />
                                 </div>
                                 <div>
                                     <h4 className="text-white font-bold group-hover:text-primary transition-colors">{ep.title}</h4>
                                     <span className="text-xs text-gray-500">{ep.date}</span>
                                 </div>
                             </div>
                             <span className="text-xs text-gray-500 font-mono">24m</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-surface/30 p-6 rounded-xl border border-white/5 space-y-4">
                    <h4 className="text-white font-bold uppercase tracking-wider text-sm border-b border-white/10 pb-2">Details</h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Status</span> <span className="text-white">{detail.status}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Studio</span> <span className="text-white">{detail.studio}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Duration</span> <span className="text-white">{detail.duration}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Rank</span> <span className="text-primary font-bold">#{detail.rank}</span></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-xl border border-primary/20">
                     <h4 className="text-primary font-bold uppercase tracking-wider text-sm mb-2">AniBot AI Insight</h4>
                     <p className="text-gray-300 text-sm italic leading-relaxed">
                         "{aiSummary ? aiSummary.slice(0, 150) + '...' : detail.synopsis.slice(0,100) + '...'}"
                     </p>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const WatchPage: React.FC = () => {
  const { source } = useContext(SourceContext);
  const { slug } = useParams();
  const [streamData, setStreamData] = useState<StreamResponse | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [playerType, setPlayerType] = useState<'iframe' | 'video'>('iframe');
  const [loading, setLoading] = useState(true);
  const [serverLoading, setServerLoading] = useState(false);
  const navigate = useNavigate();

  // Load Stream Data and Auto-Play First Server
  useEffect(() => {
    const loadStream = async () => {
      if (!slug) return;
      setLoading(true);
      const data = await getEpisodeStream(source, slug);
      setStreamData(data);
      setLoading(false);
      
      // Auto select first stream if available
      if (data && data.stream_list.length > 0) {
          // If first item is direct URL, use it
          if (data.stream_list[0].url) {
              setPlayerSource(data.stream_list[0].url);
          } 
          // If it has a serverId, fetch it automatically
          else if (data.stream_list[0].serverId) {
              handleServerClick(data.stream_list[0].serverId);
          }
      }
    };
    loadStream();
  }, [slug, source]);

  // Helper to determine type and set URL
  const setPlayerSource = (url: string) => {
      if (!url) return;
      
      // Clean HTML entities if any
      let clean = url.replace(/&amp;/g, '&');
      
      // Ensure protocol
      if (clean.startsWith('//')) clean = 'https:' + clean;

      // Determine type
      if (clean.match(/\.(mp4|mkv|webm)$/i)) {
          setPlayerType('video');
      } else {
          setPlayerType('iframe');
      }
      setCurrentUrl(clean);
  };

  const handleServerClick = async (serverId: string, url?: string) => {
      // If direct URL is present and not an iframe string, use it
      if (url && (url.startsWith('http') || url.startsWith('//')) && !url.includes('<iframe')) {
          setPlayerSource(url);
          return;
      }
      
      // If serverId is present, fetch the link
      if (serverId) {
          setServerLoading(true);
          const videoUrl = await getServerUrl(source, serverId);
          if (videoUrl) {
              setPlayerSource(videoUrl);
          }
          setServerLoading(false);
      }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0B0C0F]"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!streamData) return <div className="text-center py-40 text-gray-400">Stream unavailable.</div>;

  return (
    <div className="min-h-screen bg-[#0B0C0F] pt-20 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
       <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-5 h-5" /> <span className="uppercase font-bold text-sm tracking-widest">Back to Details</span>
       </button>

       {/* Video Player Container */}
       <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-primary/10 relative border border-white/10 group">
         {serverLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-primary font-medium tracking-wide animate-pulse">CONNECTING TO SERVER...</p>
            </div>
         ) : currentUrl ? (
             playerType === 'iframe' ? (
                <iframe 
                    src={currentUrl} 
                    className="w-full h-full" 
                    allowFullScreen 
                    title="Anime Stream"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
             ) : (
                <video 
                    controls 
                    autoPlay 
                    className="w-full h-full bg-black"
                    src={currentUrl}
                >
                    Your browser does not support the video tag.
                </video>
             )
         ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4 bg-[#151619]">
                <Monitor className="w-20 h-20 opacity-20" />
                <p className="text-lg font-medium tracking-wide">CHOOSE A SERVER TO START STREAM</p>
            </div>
         )}
         
         {/* External Link Button Overlay */}
         {currentUrl && (
             <a 
                href={currentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute top-4 right-4 bg-black/60 hover:bg-primary text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-50 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
             >
                 <ExternalLink className="w-4 h-4" /> Open External
             </a>
         )}
       </div>

       {/* Episode Info & Servers */}
       <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                 <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{streamData.title}</h1>
                 <p className="text-gray-400 text-sm">You are watching episode content provided by {source}.</p>
                 <div className="mt-4 flex gap-2">
                     <span className="text-xs border border-white/20 rounded px-2 py-1 text-gray-400">Auto-Play Enabled</span>
                     <span className="text-xs border border-white/20 rounded px-2 py-1 text-gray-400">{playerType === 'iframe' ? 'Embed Player' : 'Direct Video'}</span>
                 </div>
            </div>
            
            <div className="bg-surface/50 p-6 rounded-xl border border-white/5">
                <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                    <Tv className="w-4 h-4 text-primary" /> Select Server
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {streamData.stream_list.map((server, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleServerClick(server.serverId || '', server.url)}
                            className={`px-4 py-3 rounded text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-between ${
                                (currentUrl && (currentUrl === server.url || (server.serverId && currentUrl.includes('...')))) // Simplified check
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                                : 'bg-[#0B0C0F] text-gray-400 border-white/10 hover:bg-white/5 hover:text-white hover:border-white/30'
                            }`}
                        >
                            <span className="truncate">{server.server}</span>
                            <span className={`w-2 h-2 rounded-full ${currentUrl === server.url ? 'bg-white' : 'bg-gray-600'}`}></span>
                        </button>
                    ))}
                </div>
            </div>
       </div>
    </div>
  );
};

// ... Completed, Search, Directory, etc., remain mostly similar in structure but inherit the new darker styling from global CSS/Layout.
// Just ensuring Layout component passes children correctly.

const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const navigate = useNavigate();
  const { source, setSource } = useContext(SourceContext);

  const handleSearch = (q: string) => navigate(`/search?q=${encodeURIComponent(q)}`);
  const location = useLocation();

  let aiContext = `Browsing ${source} Home`;
  if (location.pathname.includes('detail')) aiContext = `Viewing Anime Details on ${source}`;

  return (
    <div className="min-h-screen bg-[#0B0C0F] font-sans text-gray-100 flex flex-col">
      <Navbar onSearch={handleSearch} currentSource={source} onSourceChange={setSource} />
      <main className="flex-1 w-full mx-auto">
        {children}
      </main>
      <footer className="border-t border-white/5 bg-[#0B0C0F] py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">ANISTREAM</h4>
            <div className="flex justify-center gap-6 mb-8 text-sm text-gray-400">
                <a href="#" className="hover:text-primary">Terms of Use</a>
                <a href="#" className="hover:text-primary">Privacy Policy</a>
                <a href="#" className="hover:text-primary">DMCA</a>
            </div>
            <p className="text-gray-600 text-xs">&copy; 2024 AniStream AI. Data provided by {source}.</p>
        </div>
      </footer>
      <AIChat context={aiContext} />
    </div>
  );
};

// ... Search, Directory, Genre pages need to be present
const SearchPage: React.FC = () => {
    const { source } = useContext(SourceContext);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const { search } = useLocation();
    const query = new URLSearchParams(search).get('q') || '';
    const navigate = useNavigate();
  
    useEffect(() => {
      const doSearch = async () => {
        if (!query) return;
        setLoading(true);
        const data = await searchAnime(source, query);
        setResults(data);
        setLoading(false);
      };
      doSearch();
    }, [query, source]);
  
    return (
      <div className="pt-24 px-4 max-w-7xl mx-auto min-h-screen">
        <h2 className="text-3xl font-bold text-white mb-8">Results for <span className="text-primary">"{query}"</span></h2>
        {loading ? <div className="text-center py-20 text-primary">Searching...</div> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {results.map((anime, idx) => <AnimeCard key={idx} anime={anime} onClick={(slug) => navigate(`/detail/${slug}`)} />)}
          </div>
        )}
      </div>
    );
};

const DirectoryPage: React.FC = () => {
    const { source } = useContext(SourceContext);
    const [list, setList] = useState<AnimeSummary[]>([]);
    const [filtered, setFiltered] = useState<AnimeSummary[]>([]);
    const [filter, setFilter] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        getFullAnimeList(source).then(data => { setList(data); setFiltered(data); });
    }, [source]);

    useEffect(() => {
        setFiltered(list.filter(a => a.title.toLowerCase().includes(filter.toLowerCase())));
    }, [filter, list]);

    return (
        <div className="pt-24 px-4 max-w-7xl mx-auto min-h-screen space-y-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3"><FolderOpen className="text-primary"/> Directory</h2>
            <input className="w-full bg-surface border border-white/10 rounded-lg p-4 text-white focus:border-primary focus:outline-none" placeholder="Filter anime title..." value={filter} onChange={e => setFilter(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filtered.map((a,i) => (
                    <button key={i} onClick={() => navigate(`/detail/${a.animeId || a.slug}`)} className="text-left px-4 py-3 rounded hover:bg-white/5 truncate text-gray-400 hover:text-white transition-colors border-b border-white/5">
                        {a.title}
                    </button>
                ))}
            </div>
        </div>
    )
};

const CompletedPage: React.FC = () => {
    const { source } = useContext(SourceContext);
    const [list, setList] = useState<AnimeSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
  
    useEffect(() => {
      getCompletedAnime(source, 1).then(d => { setList(d.data); setLoading(false); });
    }, [source]);
  
    return (
      <div className="pt-24 px-4 max-w-7xl mx-auto min-h-screen">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-2"><CheckCircle className="text-primary"/> Completed Series</h2>
        {loading ? <div className="text-center py-20">Loading...</div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {list.map((anime, idx) => <AnimeCard key={idx} anime={anime} onClick={(slug) => navigate(`/detail/${slug}`)} />)}
            </div>
        )}
      </div>
    );
};

const GenresPage: React.FC = () => {
    const { source } = useContext(SourceContext);
    const [genres, setGenres] = useState<Genre[]>([]);
    const navigate = useNavigate();
    useEffect(() => { getGenres(source).then(setGenres); }, [source]);

    return (
        <div className="pt-24 px-4 max-w-7xl mx-auto min-h-screen space-y-6">
             <h2 className="text-3xl font-bold text-white flex items-center gap-2"><Hash className="text-primary"/> Genres</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {genres.map((g,i) => (
                     <button key={i} onClick={() => navigate(`/genres/${g.id || g.slug}`)} className="p-6 bg-surface border border-white/5 rounded-xl hover:border-primary/50 text-gray-300 hover:text-white hover:bg-white/5 transition-all uppercase font-bold tracking-wider">
                         {g.name || g.title}
                     </button>
                 ))}
             </div>
        </div>
    )
}

const GenreDetailPage: React.FC = () => {
    const { source } = useContext(SourceContext);
    const { slug } = useParams();
    const [list, setList] = useState<AnimeSummary[]>([]);
    const navigate = useNavigate();
    useEffect(() => { if(slug) getAnimeByGenre(source, slug, 1).then(d => setList(d.data)); }, [source, slug]);

    return (
        <div className="pt-24 px-4 max-w-7xl mx-auto min-h-screen space-y-8">
            <h2 className="text-3xl font-bold text-white capitalize flex items-center gap-2"><Tag className="text-primary"/> {slug?.replace(/-/g, ' ')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {list.map((a,i) => <AnimeCard key={i} anime={a} onClick={s => navigate(`/detail/${s}`)} />)}
            </div>
        </div>
    )
}

export default function App() {
  const [source, setSource] = useState<AnimeSource>('otakudesu');

  return (
    <HashRouter>
      <SourceContext.Provider value={{ source, setSource }}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/completed" element={<CompletedPage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/genres/:slug" element={<GenreDetailPage />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/detail/:slug" element={<DetailPage />} />
            <Route path="/watch/:slug" element={<WatchPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </SourceContext.Provider>
    </HashRouter>
  );
}