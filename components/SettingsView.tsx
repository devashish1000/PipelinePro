
import React, { useState } from 'react';
import { woltersKluwerReps } from '../data/salesReps';

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button 
     onClick={onChange}
     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner ${enabled ? 'bg-white shadow-white/20' : 'bg-white/20'}`}
  >
     <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${enabled ? 'translate-x-6' : 'translate-x-1'} ${enabled ? 'bg-blue-600' : 'bg-white'}`} />
  </button>
);

const SettingsSection = ({ title, icon, color, children }: any) => (
   <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-xl overflow-hidden mb-4 animate-ios-slide">
      <div className="px-5 py-4 border-b border-white/20 flex items-center justify-between">
         <div className="flex items-center space-x-4">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>
               {icon}
            </div>
            <div>
               <h3 className="text-white font-black text-base tracking-tight leading-none">{title}</h3>
               <p className="text-white/70 text-[8px] font-bold uppercase tracking-widest mt-1.5">System Rule</p>
            </div>
         </div>
      </div>
      <div className="p-5 space-y-4">
         {children}
      </div>
   </div>
);

export const SettingsView = () => {
  const [strictValidation, setStrictValidation] = useState(true);
  const [useLovableAI, setUseLovableAI] = useState(true);
  const [useCloud, setUseCloud] = useState(false);

  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 min-h-screen p-4 md:p-8 pb-32 w-full flex flex-col">
        <div className="max-w-3xl mx-auto w-full">
            <div className="mb-6 mt-2 px-2">
                <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Preferences</p>
                <h2 className="text-3xl font-black text-white tracking-tight">System Settings</h2>
                <p className="text-white/90 text-[12px] font-medium mt-1">Configure your Pipeline Manager and AI Coach experience.</p>
            </div>

            <SettingsSection 
                title="Validation Controls"
                color="bg-purple-500 shadow-purple-500/30"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-bold text-[14px]">Strict Data Enforcement</h4>
                        <p className="text-white/90 text-[11px] mt-0.5 font-medium">Require all compliance fields before stage progression</p>
                    </div>
                    <Toggle enabled={strictValidation} onChange={() => setStrictValidation(!strictValidation)} />
                </div>
            </SettingsSection>

            <SettingsSection 
                title="AI Coach Intelligence"
                color="bg-teal-500 shadow-teal-500/30"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-bold text-[14px]">Simulation Feedback</h4>
                        <p className="text-white/90 text-[11px] mt-0.5 font-medium">Generative AI analysis vs fixed rules</p>
                    </div>
                    <Toggle enabled={useLovableAI} onChange={() => setUseLovableAI(!useLovableAI)} />
                </div>
            </SettingsSection>

            <SettingsSection 
                title="Infrastructure"
                color="bg-blue-500 shadow-blue-500/30"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-bold text-[14px]">Cloud Persistence</h4>
                        <p className="text-white/90 text-[11px] mt-0.5 font-medium">Sync modifications with global WK Cloud</p>
                    </div>
                    <Toggle enabled={useCloud} onChange={() => setUseCloud(!useCloud)} />
                </div>
                <button className="w-full mt-4 bg-white/30 hover:bg-white/40 text-white rounded-full py-3 transition-all duration-300 font-black text-[10px] uppercase tracking-widest active:scale-95">Reset System Cache</button>
            </SettingsSection>
        </div>
    </div>
  );
};
