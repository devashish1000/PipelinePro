import React, { useState } from 'react';

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button 
     onClick={onChange}
     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
  >
     <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const SettingsSection = ({ title, icon, children }: any) => (
   <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/30">
         <div className="p-2 bg-slate-800 rounded-lg text-cyan-400 border border-slate-700">
            {icon}
         </div>
         <h3 className="text-white font-bold">{title}</h3>
      </div>
      <div className="p-6 space-y-6">
         {children}
      </div>
   </div>
);

export const SettingsView = () => {
  const [strictValidation, setStrictValidation] = useState(true);
  const [useLovableAI, setUseLovableAI] = useState(false);
  const [useCloud, setUseCloud] = useState(false);

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-fade-in">
        <div className="mb-8">
            <button className="flex items-center text-slate-400 hover:text-white mb-4 transition">
               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
               Back
            </button>
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <p className="text-slate-400 mt-1">Configure your Pipeline Manager experience</p>
        </div>

        <SettingsSection 
            title="Validation"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-white font-medium">Strict Validation</h4>
                    <p className="text-slate-400 text-sm mt-0.5">Require all fields before deal progression</p>
                </div>
                <Toggle enabled={strictValidation} onChange={() => setStrictValidation(!strictValidation)} />
            </div>
        </SettingsSection>

        <SettingsSection 
            title="Deal Coach"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-white font-medium">AI Coach Tone</h4>
                    <p className="text-slate-400 text-sm mt-0.5">Rule-based recommendations</p>
                </div>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-full p-1">
                    <span className="px-3 py-1 text-xs font-bold text-white">Rules</span>
                    <button className="w-8 h-4 bg-slate-800 rounded-full mx-2"></button>
                    <span className="px-3 py-1 text-xs font-medium text-slate-500">AI</span>
                </div>
            </div>
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                    <h4 className="text-white font-medium">Use Lovable AI</h4>
                    <p className="text-slate-400 text-sm mt-0.5">Enable AI-powered features</p>
                </div>
                <Toggle enabled={useLovableAI} onChange={() => setUseLovableAI(!useLovableAI)} />
            </div>
        </SettingsSection>

        <SettingsSection 
            title="Cloud & Data"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>}
        >
             <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-white font-medium">Use Lovable Cloud</h4>
                    <p className="text-slate-400 text-sm mt-0.5">Persist data with cloud storage</p>
                </div>
                <Toggle enabled={useCloud} onChange={() => setUseCloud(!useCloud)} />
            </div>
            <button className="w-full mt-2 border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 py-3 rounded-lg text-sm font-medium transition flex items-center justify-center space-x-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
               <span>Reset Demo Data</span>
            </button>
        </SettingsSection>

        <SettingsSection 
            title="Salesforce Integration"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
        >
             <p className="text-slate-400 text-sm mb-4">Embed as Lightning Web Component or Canvas App</p>
             
             <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300">
                <p className="text-slate-500 mb-2">// Lightning Web Component</p>
                <div className="text-emerald-400">&lt;template&gt;</div>
                <div className="pl-4">
                    <span className="text-cyan-300">&lt;c-deal-health-app</span> <br/>
                    <span className="pl-4 text-purple-300">record-id</span>=<span className="text-orange-300">{"{recordId}"}</span> <br/>
                    <span className="pl-4 text-purple-300">object-api-name</span>=<span className="text-orange-300">{"{objectApiName}"}</span><span className="text-cyan-300">&gt;</span>
                </div>
                <div className="pl-4 text-cyan-300">&lt;/c-deal-health-app&gt;</div>
                <div className="text-emerald-400">&lt;/template&gt;</div>
             </div>

             <div className="mt-4">
                <a href="#" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    View Salesforce LWC Documentation
                </a>
             </div>
        </SettingsSection>
    </div>
  );
};