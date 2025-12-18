import React, { useState, useRef } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const WKFooterLogo = () => (
  <div className="bg-[#003A70] py-1.5 px-3 rounded-lg flex flex-col items-start justify-center shadow-md border border-white/10 w-[120px] h-[52px] shrink-0">
    <span className="text-white font-bold text-[14px] leading-tight tracking-tight whitespace-nowrap">Wolters Kluwer</span>
    <span className="text-white/80 text-[7px] uppercase tracking-[0.18em] font-black leading-none mt-1">Pipeline Manager</span>
  </div>
);

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('michael.thompson@wolterskluwer.com');
  const [password, setPassword] = useState('PipelineGuide123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-5xl w-full glass-card rounded-[40px] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
        {/* Left Side - Brand Section */}
        <div className="lg:w-1/2 bg-gradient-to-br from-[#465B7D] to-[#2A3F5F] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mt-32"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-32 -mb-32"></div>
            
            <div className="relative z-10">
                <div className="bg-white py-3 px-8 rounded-2xl flex flex-col items-center justify-center shadow-2xl mb-8 inline-block">
                    <span className="text-[#003A70] font-bold text-3xl leading-none tracking-tighter">Wolters Kluwer</span>
                    <span className="text-[12px] text-[#00A3E0] uppercase tracking-[0.25em] font-black leading-none mt-2">Pipeline Manager</span>
                </div>
                <h2 className="text-4xl font-black text-white mb-6 leading-tight tracking-tight">Master the Art of Negotiation</h2>
                <p className="text-lg text-white/80 leading-relaxed font-medium">
                    Empower your sales organization with AI-driven insights and real-time coaching.
                </p>
            </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="lg:w-1/2 bg-white/95 p-12 flex flex-col justify-center">
            <div className="mb-10 text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full mb-4">
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Enterprise Access</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Welcome Back</h1>
                <p className="text-slate-500 font-medium">Please enter your credentials to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2 ml-1">Work Email</label>
                    <input 
                        type="email" 
                        required
                        className="w-full bg-slate-100 border-2 border-transparent focus:border-teal-500/30 focus:bg-white rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all placeholder-slate-400 font-medium"
                        placeholder="michael@wolterskluwer.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                        <label className="block text-slate-700 text-sm font-bold">Security Key</label>
                        <a href="#" className="text-xs text-teal-600 font-bold hover:underline">Reset Passkey?</a>
                    </div>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full bg-slate-100 border-2 border-transparent focus:border-teal-500/30 focus:bg-white rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all placeholder-slate-400 font-medium"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF6B35] hover:bg-[#FF8B60] text-white font-black py-5 rounded-[20px] shadow-xl shadow-orange-500/20 transform transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center group uppercase tracking-widest text-sm"
                >
                    {loading ? (
                        <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <span className="flex items-center">
                            Authorize Access
                            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </span>
                    )}
                </button>
            </form>
            
            <div className="mt-10 pt-10 border-t border-slate-100 flex flex-col items-center space-y-6">
                <div className="flex items-center space-x-6 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition duration-500">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg" alt="Salesforce" className="h-7" />
                    <WKFooterLogo />
                </div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">© 2024 Wolters Kluwer N.V.</p>
            </div>
        </div>
      </div>
    </div>
  );
};