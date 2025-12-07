import React, { useState } from 'react';
import { AppSettings } from '../types';
import { generateGrowthAdvice } from '../services/aiService';
import { GraduationCap, TrendingUp, Search, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface GrowthHubProps {
  settings: AppSettings;
}

const GrowthHub: React.FC<GrowthHubProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<'mentor' | 'competitors'>('mentor');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const result = await generateGrowthAdvice(input, activeTab, settings);
      setOutput(result);
    } catch (e) {
      setOutput("Error generating advice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-full flex flex-col">
      <div className="mb-6 space-y-2">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-cyan-400" />
          Growth Hub
        </h2>
        <p className="text-slate-400">Accelerate your career with AI mentoring and market intelligence.</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
            onClick={() => setActiveTab('mentor')}
            className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                activeTab === 'mentor' 
                ? 'bg-slate-800 border-cyan-500 ring-1 ring-cyan-500/50' 
                : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
            }`}
        >
            <GraduationCap className={`w-6 h-6 ${activeTab === 'mentor' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="font-semibold">AI Mentor</span>
        </button>
        <button
            onClick={() => setActiveTab('competitors')}
            className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                activeTab === 'competitors' 
                ? 'bg-slate-800 border-cyan-500 ring-1 ring-cyan-500/50' 
                : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
            }`}
        >
            <Search className={`w-6 h-6 ${activeTab === 'competitors' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="font-semibold">Competitor Spy</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4">
        <div className="relative">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                placeholder={activeTab === 'mentor' ? "I want to learn Geometry Nodes. Where to start?" : "Analyze top Hard Surface artists on ArtStation..."}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 pr-14 text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none"
            />
            <button 
                onClick={handleAction}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-2 p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
            </button>
        </div>

        <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-xl p-6 overflow-y-auto">
            {output ? (
                 <div className="prose prose-invert prose-cyan max-w-none">
                    <ReactMarkdown>{output}</ReactMarkdown>
                 </div>
            ) : (
                <div className="text-center text-slate-600 mt-10">
                    <p>Ask for advice or analyze a niche.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GrowthHub;
