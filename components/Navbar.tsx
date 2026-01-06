import React, { useState, useEffect } from 'react';
import { Search, MonitorPlay, ChevronDown, Menu, X } from 'lucide-react';
import { AnimeSource } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  onSearch: (query: string) => void;
  currentSource: AnimeSource;
  onSourceChange: (source: AnimeSource) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, currentSource, onSourceChange }) => {
  const [query, setQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Add background on scroll for that premium feel
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Movies', path: '/directory' }, // Simplified mapping for UI
    { name: 'Completed', path: '/completed' },
    { name: 'Genres', path: '/genres' },
  ];

  const isHome = location.pathname === '/';
  
  const availableSources: AnimeSource[] = ['otakudesu', 'kuramanime'];

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled || !isHome ? 'bg-[#0B0C0F]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer flex items-center gap-2 group" onClick={() => navigate('/')}>
            <MonitorPlay className="w-8 h-8 text-white group-hover:text-primary transition-colors" />
            <span className="hidden md:block text-2xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
              ANISTREAM
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button 
                key={link.path}
                onClick={() => navigate(link.path)} 
                className={`text-sm font-semibold tracking-wide transition-colors uppercase ${
                    location.pathname === link.path ? 'text-white border-b-2 border-primary pb-1' : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
             {/* Source Selector (Styled minimal) */}
            <div className="relative group hidden sm:block">
                <button className="flex items-center gap-2 text-xs font-bold text-gray-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded hover:bg-white/10 transition-colors uppercase tracking-wider">
                {currentSource}
                <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-40 bg-[#151619] border border-white/10 rounded-md shadow-2xl overflow-hidden hidden group-hover:block transition-all">
                    {availableSources.map(src => (
                        <button
                            key={src}
                            onClick={() => onSourceChange(src)}
                            className={`block w-full text-left px-4 py-3 text-sm uppercase font-bold hover:bg-white/5 ${currentSource === src ? 'text-primary' : 'text-gray-400'}`}
                        >
                            {src}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="hidden sm:block">
                <form onSubmit={handleSubmit} className="relative group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="FIND ANIME..."
                    className="w-48 bg-transparent border-b border-white/30 py-1 pl-0 pr-8 text-sm text-white focus:outline-none focus:border-primary focus:w-64 transition-all placeholder-gray-500 font-medium"
                />
                <button type="submit" className="absolute right-0 top-1">
                    <Search className="w-4 h-4 text-white hover:text-primary transition-colors" />
                </button>
                </form>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-2 sm:hidden">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#151619] border-t border-white/5 p-4 space-y-4 shadow-xl">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-black/30 border border-white/10 rounded p-3 text-sm text-white"
              />
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            </form>
            <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                <button 
                    key={link.path}
                    onClick={() => { navigate(link.path); setIsMobileMenuOpen(false); }} 
                    className="text-left py-3 text-sm font-bold text-gray-300 hover:text-primary uppercase border-b border-white/5 last:border-0"
                >
                    {link.name}
                </button>
                ))}
            </div>
            <div className="pt-2 border-t border-white/10">
                 <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Source</p>
                 <div className="flex gap-2">
                     {availableSources.map(src => (
                         <button 
                            key={src}
                            onClick={() => { onSourceChange(src); setIsMobileMenuOpen(false); }}
                            className={`px-2 py-1 text-xs rounded border ${currentSource === src ? 'border-primary text-primary' : 'border-white/10 text-gray-400'}`}
                         >
                             {src}
                         </button>
                     ))}
                 </div>
            </div>
        </div>
      )}
    </nav>
  );
};