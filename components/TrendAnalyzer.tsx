
import React from 'react';
import { AppSettings, TrendItem, TrendCategory } from '../types';
import { 
    Flame, RefreshCw, Globe, ArrowRight, Instagram, Linkedin, 
    Twitter, Music2, Film, Bell, Activity, Hash, Video
} from 'lucide-react';

interface TrendAnalyzerProps {
  settings: AppSettings;
  onSelectTrend: (trend: TrendItem) => void;
  // Lifted Props
  trends: TrendItem[];
  activeCategory: TrendCategory;
  onCategoryChange: (c: TrendCategory) => void;
  autoMonitor: boolean;
  onAutoMonitorChange: (v: boolean) => void;
  isScanning: boolean;
  onManualScan: () => void;
}

const TrendAnalyzer: React.FC<TrendAnalyzerProps> = ({ 
    settings, 
    onSelectTrend,
    trends,
    activeCategory,
    onCategoryChange,
    autoMonitor,
    onAutoMonitorChange,
    isScanning,
    onManualScan
}) => {

  // Helper for Category Styling
  const getCategoryTheme = () => {
      switch(activeCategory) {
          case TrendCategory.Audio: return "border-pink-500/50 bg-pink-900/10";
          case TrendCategory.Formats: return "border-purple-500/50 bg-purple-900/10";
          case TrendCategory.Plots: return "border-emerald-500/50 bg-emerald-900/10";
          default: return "border-orange-500/50 bg-orange-900/10";
      }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 h-full flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Activity className="w-8 h-8 text-cyan-400" />
            Intelligence Radar
          </h2>
          <p className="text-slate-400">Real-time surveillance of social media algorithms.</p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Auto Monitor Switch */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${autoMonitor ? 'bg-cyan-900/30 border-cyan-500' : 'bg-slate-900 border-slate-700'}`}>
                <Bell className={`w-4 h-4 ${autoMonitor ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                <span className={`text-xs font-medium ${autoMonitor ? 'text-cyan-200' : 'text-slate-500'}`}>
                    {autoMonitor ? 'Monitoring Active' : 'Auto-Monitor Off'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer ml-2">
                    <input type="checkbox" checked={autoMonitor} onChange={(e) => onAutoMonitorChange(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
            </div>

            <button
            onClick={onManualScan}
            disabled={isScanning}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
            >
            {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Scan Network
            </button>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <TabButton 
             active={activeCategory === TrendCategory.General} 
             onClick={() => onCategoryChange(TrendCategory.General)}
             icon={<Flame className="w-4 h-4" />}
             label="General Trends"
             color="text-orange-400"
          />
          <TabButton 
             active={activeCategory === TrendCategory.Audio} 
             onClick={() => onCategoryChange(TrendCategory.Audio)}
             icon={<Music2 className="w-4 h-4" />}
             label="Viral Audio"
             color="text-pink-400"
          />
          <TabButton 
             active={activeCategory === TrendCategory.Formats} 
             onClick={() => onCategoryChange(TrendCategory.Formats)}
             icon={<Video className="w-4 h-4" />}
             label="Video Formats"
             color="text-purple-400"
          />
          <TabButton 
             active={activeCategory === TrendCategory.Plots} 
             onClick={() => onCategoryChange(TrendCategory.Plots)}
             icon={<Hash className="w-4 h-4" />}
             label="Tags & Plots"
             color="text-emerald-400"
          />
      </div>

      {/* Content Grid */}
      {isScanning ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
          <div className="relative">
            <div className={`w-24 h-24 border-4 border-slate-800 rounded-full animate-spin ${activeCategory === TrendCategory.Audio ? 'border-t-pink-500' : 'border-t-cyan-500'}`}></div>
            <Activity className="w-8 h-8 text-slate-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-400 animate-pulse text-lg">Intercepting {activeCategory} signals...</p>
        </div>
      ) : trends.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 min-h-[400px]">
           <p>No active signals. Enable Monitor or Click Scan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {trends.map((trend, idx) => (
            <div 
              key={idx} 
              className={`bg-slate-900/80 border rounded-xl p-5 hover:bg-slate-800 transition-all duration-300 group flex flex-col relative overflow-hidden ${getCategoryTheme()}`}
            >
               {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800/50">
                    <PlatformIcon platform={trend.platform} />
                   <span className="text-xs font-bold text-slate-300">{trend.platform}</span>
                </div>
                {trend.growthMetric && (
                    <span className="text-[10px] font-mono border border-green-500/30 px-2 py-1 rounded bg-green-500/10 text-green-400 flex items-center gap-1">
                        <TrendingUpIcon /> {trend.growthMetric}
                    </span>
                )}
              </div>
              
              <div className="flex-1 mb-4 relative z-10">
                  <h3 className="text-lg font-bold text-white mb-2 leading-tight flex items-start gap-2">
                      {activeCategory === TrendCategory.Audio && <Music2 className="w-5 h-5 text-pink-500 shrink-0 mt-1" />}
                      {activeCategory === TrendCategory.Formats && <Film className="w-5 h-5 text-purple-500 shrink-0 mt-1" />}
                      {trend.trendName}
                  </h3>
                  <p className="text-sm text-slate-400">{trend.description}</p>
              </div>
              
              <div className="bg-slate-950/40 p-3 rounded-lg border border-white/5 mb-4 relative z-10 backdrop-blur-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Why it's Hype</p>
                        <p className="text-xs text-indigo-200">{trend.hypeReason}</p>
                    </div>
                    {trend.difficulty && (
                        <div className="text-right">
                             <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Diff</p>
                             <p className={`text-xs font-bold ${trend.difficulty.toLowerCase().includes('hard') ? 'text-red-400' : 'text-green-400'}`}>{trend.difficulty}</p>
                        </div>
                    )}
                     {trend.vibe && (
                        <div className="text-right ml-4">
                             <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Vibe</p>
                             <p className="text-xs text-pink-300">{trend.vibe}</p>
                        </div>
                    )}
                </div>
              </div>

              <button 
                onClick={() => onSelectTrend(trend)}
                className="w-full py-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all shadow-lg relative z-10"
              >
                Use This Trend <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color: string }> = ({ active, onClick, icon, label, color }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
            active 
            ? `bg-slate-800 border-white/20 shadow-lg ${color}` 
            : 'bg-slate-900 border-transparent text-slate-500 hover:bg-slate-800'
        }`}
    >
        {icon}
        <span className="font-semibold text-sm">{label}</span>
    </button>
);

const TrendingUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);

const PlatformIcon = ({ platform }: { platform: string }) => {
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return <Instagram className="w-3 h-3 text-pink-500" />;
    if (p.includes('twitter') || p.includes('x')) return <Twitter className="w-3 h-3 text-sky-400" />;
    if (p.includes('linkedin')) return <Linkedin className="w-3 h-3 text-blue-600" />;
    if (p.includes('tiktok')) return <Music2 className="w-3 h-3 text-pink-600" />;
    return <Globe className="w-3 h-3 text-slate-400" />;
};

export default TrendAnalyzer;
