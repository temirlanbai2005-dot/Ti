import React, { useState, useRef } from 'react';
import { AppSettings } from '../types';
import { analyzeImage } from '../services/aiService';
import { UploadCloud, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface WorkAnalyzerProps {
  settings: AppSettings;
}

const WorkAnalyzer: React.FC<WorkAnalyzerProps> = ({ settings }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        // Extract base64 part only
        const base64 = result.split(',')[1];
        setBase64Data(base64);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!base64Data) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeImage(base64Data, settings);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      setAnalysis("Error analyzing image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-full flex flex-col lg:flex-row gap-6">
      {/* Upload Section */}
      <div className="lg:w-1/3 space-y-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-8 h-8 text-emerald-500" />
            Visual Audit
          </h2>
          <p className="text-slate-400">Upload your render for an AI Art Director critique.</p>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-800 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all aspect-square relative overflow-hidden group"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          ) : (
            <div className="text-center space-y-2">
              <UploadCloud className="w-12 h-12 text-slate-500 mx-auto" />
              <p className="text-slate-400 font-medium">Click to Upload Render</p>
              <p className="text-xs text-slate-600">JPG, PNG supported</p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!base64Data || isAnalyzing}
          className={`w-full py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            !base64Data ? 'bg-slate-800 text-slate-600 cursor-not-allowed' :
            isAnalyzing ? 'bg-emerald-800 text-emerald-200' :
            'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
          }`}
        >
          {isAnalyzing ? <Loader2 className="animate-spin" /> : "Analyze Render"}
        </button>
      </div>

      {/* Analysis Output */}
      <div className="lg:w-2/3 bg-slate-900/50 border border-slate-800 rounded-xl p-6 overflow-y-auto min-h-[400px]">
        {analysis ? (
          <div className="prose prose-invert prose-emerald max-w-none">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600">
             <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
             <p>Upload an image and hit analyze to receive feedback on lighting, composition, and realism.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkAnalyzer;
