import React, { useState, useEffect } from 'react';
import { AppSettings, SocialPlatform } from '../types';
import { SUPPORTED_PLATFORMS } from '../constants';
import { generatePost, analyzePostImprovement, generateCreativeIdea, translatePost } from '../services/aiService';
import { 
  Wand2, Search, Copy, RefreshCw, CheckCircle, 
  Share2, AlertCircle, Sparkles, Microscope, Layers, Trash2, Languages
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PostGeneratorProps {
  settings: AppSettings;
  initialTopic?: string;
  initialPlatform?: SocialPlatform;
}

const PostGenerator: React.FC<PostGeneratorProps> = ({ settings, initialTopic, initialPlatform }) => {
  const [topic, setTopic] = useState('');
  // Changed to array for multi-select
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([SocialPlatform.Instagram]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  
  // Store results as a map: { [PlatformName]: Content }
  const [generatedResults, setGeneratedResults] = useState<Record<string, string>>({});
  
  const [critique, setCritique] = useState<{platform: string, text: string} | null>(null);
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [translatingStates, setTranslatingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
    if (initialPlatform) {
        // If coming from Trends, reset selection to just that platform
        setSelectedPlatforms([initialPlatform]);
    }
  }, [initialTopic, initialPlatform]);

  const togglePlatform = (platform: SocialPlatform) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        // Prevent deselecting the last one if you want at least one selected
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  const handleGenerate = async () => {
    if (!topic.trim() || selectedPlatforms.length === 0) return;
    
    setIsGenerating(true);
    setGeneratedResults({}); // Clear previous
    setCritique(null);
    
    try {
      // Parallel generation for all selected platforms
      const promises = selectedPlatforms.map(async (platform) => {
        const content = await generatePost({
          topic,
          platform,
          settings,
          useSearch
        });
        return { platform, content };
      });

      const results = await Promise.all(promises);
      
      const newResults: Record<string, string> = {};
      results.forEach(r => {
        newResults[r.platform] = r.content;
      });
      
      setGeneratedResults(newResults);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCritique = async (platform: string, content: string) => {
    setIsCritiquing(true);
    try {
        const result = await analyzePostImprovement(content, platform as SocialPlatform, settings);
        setCritique({ platform, text: result });
    } catch (e) {
        setCritique({ platform, text: "Could not generate critique." });
    } finally {
        setIsCritiquing(false);
    }
  };

  const handleTranslate = async (platform: string, content: string) => {
    setTranslatingStates(prev => ({...prev, [platform]: true}));
    try {
        const translated = await translatePost(content, settings);
        setGeneratedResults(prev => ({
            ...prev,
            [platform]: translated
        }));
    } catch (e) {
        console.error("Translation failed", e);
    } finally {
        setTranslatingStates(prev => ({...prev, [platform]: false}));
    }
  };

  const handleCopy = (text: string, platformKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [platformKey]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [platformKey]: false }));
    }, 2000);
  };

  const handleBrainstorm = async () => {
    setIsBrainstorming(true);
    try {
        const idea = await generateCreativeIdea(settings);
        setTopic(idea);
    } catch(e) {
        setTopic("Share a breakdown of your most complex node shader network.");
    } finally {
        setIsBrainstorming(false);
    }
  };

  const clearResults = () => {
    setGeneratedResults({});
    setCritique(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Left Column: Input Controls (4 cols) */}
      <div className="lg:col-span-4 space-y-6 flex flex-col h-full overflow-y-auto pr-2">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Wand2 className="w-8 h-8 text-pink-500" />
            Create Post
          </h2>
          <p className="text-slate-400">Compose viral content tailored to your platform.</p>
        </div>

        {/* Platform Selector */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300">Select Platforms ({selectedPlatforms.length})</label>
            <button 
              onClick={() => setSelectedPlatforms(SUPPORTED_PLATFORMS.map(p => p.id))}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Select All
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SUPPORTED_PLATFORMS.map((plat) => {
              const isSelected = selectedPlatforms.includes(plat.id);
              return (
                <button
                  key={plat.id}
                  onClick={() => togglePlatform(plat.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'bg-slate-800 border-pink-500 ring-1 ring-pink-500/50 shadow-lg shadow-pink-900/20'
                      : 'bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></div>
                  )}
                  <span className={`text-xs font-bold ${plat.color}`}>{plat.id.substring(0, 3)}</span>
                  <span className="text-[9px] text-slate-400 mt-1 truncate w-full text-center">{plat.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic Input */}
        <div className="space-y-3 flex-1">
          <div className="flex justify-between items-center">
             <label className="text-sm font-medium text-slate-300">Topic or Idea</label>
             <button 
               onClick={handleBrainstorm}
               disabled={isBrainstorming}
               className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
             >
               {isBrainstorming ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
               AI Brainstorm
             </button>
          </div>
          <div className="relative h-full min-h-[160px]">
            <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full h-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                placeholder="Describe your art, or click AI Brainstorm..."
            />
            {isBrainstorming && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-sm text-indigo-300">
                    Thinking of ideas...
                </div>
            )}
          </div>
        </div>

        {/* Search Toggle */}
        <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
          <div className={`p-2 rounded-lg ${useSearch ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
            <Search className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-slate-200">Google Grounding</h4>
            <p className="text-xs text-slate-500">Search web for real-time info.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            isGenerating
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-500/25'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" /> Generating...
            </>
          ) : (
            <>
              Generate {selectedPlatforms.length} Posts <Layers className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Right Column: Output Grid (8 cols) */}
      <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
         {/* Results Header */}
         <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-400" /> 
                Generated Content
             </h3>
             {Object.keys(generatedResults).length > 0 && (
                <button onClick={clearResults} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear All
                </button>
             )}
         </div>

         <div className="flex-1 overflow-y-auto pr-2 pb-20">
            {Object.keys(generatedResults).length === 0 ? (
                 // Empty State
                <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl p-10">
                    <Wand2 className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium opacity-50">Select platforms and generate to see results here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(generatedResults).map(([platformName, content]) => (
                        <div key={platformName} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-lg backdrop-blur-sm group">
                            {/* Card Header */}
                            <div className="bg-slate-900/80 p-3 flex justify-between items-center border-b border-slate-700">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold text-sm ${SUPPORTED_PLATFORMS.find(p => p.id === platformName)?.color}`}>
                                        {platformName}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleTranslate(platformName, content as string)}
                                        className="p-1.5 hover:bg-indigo-500/20 text-indigo-300 rounded transition-colors"
                                        title="Translate Post"
                                    >
                                        {translatingStates[platformName] ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleCritique(platformName, content as string)}
                                        className="p-1.5 hover:bg-indigo-500/20 text-indigo-300 rounded transition-colors"
                                        title="Analyze & Improve"
                                    >
                                        <Microscope className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleCopy(content as string, platformName)}
                                        className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                                        title="Copy Content"
                                    >
                                        {copiedStates[platformName] ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Card Body */}
                            <div className="p-4 overflow-y-auto max-h-[300px] text-sm prose prose-invert prose-p:text-slate-300 prose-headings:text-indigo-400 max-w-none">
                                <ReactMarkdown>{content as string}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </div>

         {/* Critique Overlay Panel (Bottom Sheet) */}
         {critique && (
            <div className="absolute bottom-0 left-0 right-0 lg:left-auto lg:w-[66%] bg-slate-900 border-t border-indigo-500/30 shadow-2xl animate-in slide-in-from-bottom-10 z-20 rounded-t-2xl">
                 <div className="p-3 bg-indigo-950/30 border-b border-indigo-500/20 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span className="font-semibold text-indigo-200 text-sm">Analysis for {critique.platform}</span>
                      </div>
                      <button onClick={() => setCritique(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <div className="p-4 max-h-[250px] overflow-y-auto prose prose-sm prose-invert">
                      <ReactMarkdown>{critique.text}</ReactMarkdown>
                  </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default PostGenerator;