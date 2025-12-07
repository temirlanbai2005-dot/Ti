import React, { useState } from 'react';
import { AppSettings } from '../types';
import { generateBusinessResponse } from '../services/aiService';
import { MessageSquare, Calculator, ShieldCheck, Send, Loader2, Copy, DollarSign, FileSignature } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BusinessCenterProps {
  settings: AppSettings;
}

type Tab = 'pricing' | 'contract' | 'chat';

const BusinessCenter: React.FC<BusinessCenterProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<Tab>('pricing');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // Form States
  const [pricingForm, setPricingForm] = useState({ hours: '', rate: '35', complexity: 'Medium', type: 'Freelance Gig' });
  const [contractForm, setContractForm] = useState({ clientName: '', project: '', terms: 'Standard' });
  const [chatInput, setChatInput] = useState('');

  const handleAction = async () => {
    setLoading(true);
    let finalInput = "";

    try {
        if (activeTab === 'pricing') {
            finalInput = `Estimate price for: ${pricingForm.type}. Estimated Hours: ${pricingForm.hours}. Hourly Rate: $${pricingForm.rate}. Complexity: ${pricingForm.complexity}.`;
        } else if (activeTab === 'contract') {
            finalInput = `Draft clauses for Client: ${contractForm.clientName}. Project: ${contractForm.project}. Specific Terms needed: ${contractForm.terms}.`;
        } else {
            finalInput = chatInput;
        }

        const result = await generateBusinessResponse(finalInput, activeTab, settings);
        setOutput(result);
    } catch (e) {
        setOutput("Error generating response.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-full flex flex-col">
      <div className="mb-6 space-y-2">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-emerald-400" />
          Business & Pricing
        </h2>
        <p className="text-slate-400">Professional tools to price work, secure contracts, and manage clients.</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <TabButton 
            id="pricing" 
            label="Smart Pricing" 
            desc="Rate calculator & Negotiation"
            icon={<Calculator className="w-6 h-6 text-emerald-400" />} 
            active={activeTab === 'pricing'} 
            onClick={() => { setActiveTab('pricing'); setOutput(''); }} 
        />
        <TabButton 
            id="contract" 
            label="Legal Shield" 
            desc="Contract clauses & IP Rights"
            icon={<ShieldCheck className="w-6 h-6 text-indigo-400" />} 
            active={activeTab === 'contract'} 
            onClick={() => { setActiveTab('contract'); setOutput(''); }} 
        />
        <TabButton 
            id="chat" 
            label="Client Comms" 
            desc="Replies & Proposals"
            icon={<MessageSquare className="w-6 h-6 text-pink-400" />} 
            active={activeTab === 'chat'} 
            onClick={() => { setActiveTab('chat'); setOutput(''); }} 
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Input Area */}
        <div className="lg:w-1/3 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-xl font-bold text-white mb-2">
              {activeTab === 'pricing' && "Project Details"}
              {activeTab === 'contract' && "Agreement Setup"}
              {activeTab === 'chat' && "Message Context"}
          </h3>

          {activeTab === 'pricing' && (
              <div className="space-y-4">
                  <div>
                      <label className="text-xs text-slate-400 uppercase font-bold">Project Type</label>
                      <input type="text" value={pricingForm.type} onChange={e => setPricingForm({...pricingForm, type: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mt-1" placeholder="e.g. 3D Product Animation" />
                  </div>
                  <div className="flex gap-2">
                      <div className="flex-1">
                          <label className="text-xs text-slate-400 uppercase font-bold">Est. Hours</label>
                          <input type="number" value={pricingForm.hours} onChange={e => setPricingForm({...pricingForm, hours: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mt-1" placeholder="10" />
                      </div>
                      <div className="flex-1">
                          <label className="text-xs text-slate-400 uppercase font-bold">Hourly Rate ($)</label>
                          <input type="number" value={pricingForm.rate} onChange={e => setPricingForm({...pricingForm, rate: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mt-1" placeholder="50" />
                      </div>
                  </div>
                  <div>
                      <label className="text-xs text-slate-400 uppercase font-bold">Complexity</label>
                      <select value={pricingForm.complexity} onChange={e => setPricingForm({...pricingForm, complexity: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mt-1">
                          <option>Low (Basic Modeling)</option>
                          <option>Medium (Texturing/Lighting)</option>
                          <option>High (Fluid Sims/Character)</option>
                      </select>
                  </div>
              </div>
          )}

          {activeTab === 'contract' && (
               <div className="space-y-4">
                  <div>
                      <label className="text-xs text-slate-400 uppercase font-bold">Client Name/Company</label>
                      <input type="text" value={contractForm.clientName} onChange={e => setContractForm({...contractForm, clientName: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mt-1" placeholder="e.g. Nike" />
                  </div>
                  <div>
                      <label className="text-xs text-slate-400 uppercase font-bold">Deliverables</label>
                      <input type="text" value={contractForm.project} onChange={e => setContractForm({...contractForm, project: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mt-1" placeholder="e.g. 3 Renders 4K" />
                  </div>
                  <div>
                      <label className="text-xs text-slate-400 uppercase font-bold">Special Terms?</label>
                      <textarea value={contractForm.terms} onChange={e => setContractForm({...contractForm, terms: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mt-1 h-24 resize-none" placeholder="e.g. They want source files, I want 50% deposit." />
                  </div>
              </div>
          )}

          {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col">
                  <label className="text-xs text-slate-400 uppercase font-bold mb-2">Incoming Message / Situation</label>
                  <textarea 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white resize-none" 
                    placeholder="Paste the angry client email or describe the situation..."
                  />
              </div>
          )}

          <button
            onClick={handleAction}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20 mt-auto"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Send className="w-4 h-4" /> Generate Analysis</>}
          </button>
        </div>

        {/* Output Area */}
        <div className="lg:w-2/3 bg-slate-800/50 border border-slate-700 rounded-xl p-6 overflow-y-auto relative group">
          {output ? (
            <>
              <button 
                onClick={() => navigator.clipboard.writeText(output)} 
                className="absolute top-4 right-4 p-2 bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-600 z-10"
              >
                <Copy className="w-4 h-4 text-slate-300" />
              </button>
              <div className="prose prose-invert prose-indigo max-w-none">
                <ReactMarkdown>{output}</ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
               {activeTab === 'pricing' && <DollarSign className="w-16 h-16 mb-4 opacity-20" />}
               {activeTab === 'contract' && <FileSignature className="w-16 h-16 mb-4 opacity-20" />}
               {activeTab === 'chat' && <MessageSquare className="w-16 h-16 mb-4 opacity-20" />}
              <p className="text-lg opacity-50 font-medium">
                  {activeTab === 'pricing' && "Fill details to get a price estimate."}
                  {activeTab === 'contract' && "Enter details to draft legal clauses."}
                  {activeTab === 'chat' && "Paste text to generate a professional reply."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ id: Tab, label: string, desc: string, icon: React.ReactNode, active: boolean, onClick: () => void }> = ({ label, desc, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
      active 
        ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/50' 
        : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
    }`}
  >
    <div className="p-2 bg-slate-950 rounded-lg">{icon}</div>
    <div>
        <div className={`font-bold ${active ? 'text-white' : 'text-slate-300'}`}>{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
    </div>
  </button>
);

export default BusinessCenter;
