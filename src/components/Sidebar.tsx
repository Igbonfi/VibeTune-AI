import React, { useState, useMemo } from 'react';
import { Search, Music, Zap, Info } from 'lucide-react';
import { IEM } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  selectedIem: IEM | null;
  onSelectIem: (iem: IEM) => void;
  ytmUrl: string;
  onYtmUrlChange: (url: string) => void;
  onTune: () => void;
  isLoading: boolean;
  iems: IEM[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedIem,
  onSelectIem,
  ytmUrl,
  onYtmUrlChange,
  onTune,
  isLoading,
  iems,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIems = useMemo(() => {
    if (!searchTerm) {
      // If no search, show a mix of initial list (if iems is empty/loading) or first few items
      return iems.length > 0 ? iems.slice(0, 100) : [];
    }
    return iems.filter(iem => 
      iem.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      iem.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 100); // Limit to 100 for performance
  }, [searchTerm, iems]);

  return (
    <aside className="w-80 h-screen overflow-y-auto border-r border-gray-200 bg-white p-6 flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <Zap className="text-white w-5 h-5 fill-current" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">VibeTune AI</h1>
      </div>

      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <Search className="w-3 h-3" /> Search {iems.length > 0 ? `${iems.length} Models` : 'Hi-End IEMs'}
        </label>
        <input
          id="iem-search-input"
          type="text"
          placeholder="Filter elite models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/5 mb-2"
        />
        <div className="space-y-1 overflow-y-auto flex-1 pr-2">
          {filteredIems.map((iem) => (
            <button
              key={iem.id}
              id={`iem-${iem.id.replace(/\s+/g, '-')}`}
              onClick={() => onSelectIem(iem)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                selectedIem?.id === iem.id
                  ? "bg-black text-white"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              <div className="font-medium truncate">{iem.name}</div>
              <div className="text-[10px] opacity-60 uppercase truncate">{iem.manufacturer}</div>
            </button>
          ))}
          {filteredIems.length === 0 && (
            <div className="text-xs text-gray-400 italic p-4 text-center">No matching IEMs found</div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-2 pt-2">
          <Music className="w-3 h-3" /> YouTube Music Link
        </label>
        <input
          id="music-url-input"
          type="text"
          placeholder="YouTube Music Track or Album Link..."
          value={ytmUrl}
          onChange={(e) => onYtmUrlChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
        />
        <button
          id="tune-button"
          onClick={onTune}
          disabled={isLoading || !selectedIem || !ytmUrl}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Tune EQ
            </>
          )}
        </button>
      </div>


      <div className="mt-auto pt-6 border-t border-gray-100 italic text-gray-400 text-xs flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0" />
        <p>VibeTune AI uses Gemini to analyze track mastering and engineer PEQ settings that bridge your IEM signature to the music's intent.</p>
      </div>
    </aside>
  );
};
