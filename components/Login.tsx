
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GravityStarsBackground } from './GravityStarsBackground';
import { MorphingText } from './MorphingText';
import { AIAgentLogo } from './AIAgentLogo';

interface LoginProps {
  onLogin: (role: 'rep' | 'manager') => void;
}

const WKLoginLogo = () => (
  <div className="flex items-center justify-center shrink-0 mb-4 transition-all duration-300">
    <AIAgentLogo size="md" noBackground />
  </div>
);

const StepperArrow = ({ 
  fromColor, 
  toColor, 
  delay, 
  arrowColor, 
  isFlipped = false,
  animKey 
}: { 
  fromColor: string, 
  toColor: string, 
  delay: number, 
  arrowColor: string,
  isFlipped?: boolean,
  animKey: number
}) => (
  <div className={`flex-1 flex items-center max-w-[30px] md:max-w-[45px] relative ${isFlipped ? 'flex-row-reverse' : ''}`}>
    <motion.div 
      key={`line-${animKey}`}
      initial={{ scaleX: 0, originX: isFlipped ? 1 : 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ delay, duration: 0.6, ease: "circOut" }}
      className={`h-0.5 w-full bg-gradient-to-r ${isFlipped ? `from-${toColor.split('-')[1]}-400 to-${fromColor.split('-')[1]}-400` : `${fromColor} ${toColor}`} rounded-full`}
    />
    <motion.div
      key={`head-${animKey}`}
      initial={{ opacity: 0, x: isFlipped ? 5 : -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay + 0.4, duration: 0.3 }}
      className={`absolute ${isFlipped ? '-left-1.5' : '-right-1.5'} ${arrowColor} ${isFlipped ? 'rotate-180' : ''}`}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </motion.div>
  </div>
);

const LoginStepper = () => {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    // Loop every 5 seconds: trigger a re-animation
    const interval = setInterval(() => {
      setAnimKey(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Use "as const" on type: "spring" to satisfy Framer Motion type requirements
  const stepVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (delay: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay, duration: 0.5, type: "spring" as const, stiffness: 100 }
    })
  };

  const labelStyle = (color: string) => ({
    color,
    textShadow: '0 1px 1px rgba(0,0,0,0.4)',
    fontSize: '8px',
    fontWeight: '700'
  });

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3 mb-6 mt-1 w-full max-w-[450px]">
      {/* Step 1: Identify Sales */}
      <div className="flex flex-col items-center">
        <motion.div 
          variants={stepVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-500/20 border-2 border-orange-400 flex items-center justify-center shadow-[0_0_15px_rgba(251,146,60,0.2)]"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </motion.div>
        <motion.div variants={stepVariants} initial="hidden" animate="visible" custom={0.1} className="mt-2 text-center">
          <p style={labelStyle('#FF6B4A')} className="uppercase tracking-widest leading-tight whitespace-nowrap">Identify Sales</p>
          <p style={labelStyle('#FF6B4A')} className="uppercase tracking-wider mt-0.5 whitespace-nowrap opacity-90">Spot Deals</p>
        </motion.div>
      </div>

      <StepperArrow 
        fromColor="from-orange-400" 
        toColor="to-blue-400" 
        delay={0.5} 
        arrowColor="text-blue-400"
        animKey={animKey}
      />

      <div className="flex flex-col items-center">
        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.1 }}
            transition={{ delay: 0.7, duration: 1, repeat: Infinity, repeatType: "reverse" }}
            className="absolute inset-0 bg-blue-400/30 blur-xl rounded-full"
          />
          <motion.div 
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            custom={0.7}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/95 border-2 border-blue-300 flex items-center justify-center shadow-xl relative z-10 p-2"
          >
            <img 
              src="https://www.vectorlogo.zone/logos/salesforce/salesforce-icon.svg" 
              alt="Salesforce" 
              className="w-full h-full object-contain"
            />
          </motion.div>
        </div>
        <motion.div variants={stepVariants} initial="hidden" animate="visible" custom={0.8} className="mt-2 text-center">
          <p style={labelStyle('#00D4FF')} className="uppercase tracking-[0.2em] leading-tight whitespace-nowrap">CRM DATA</p>
          <p style={labelStyle('#00D4FF')} className="uppercase tracking-wider mt-0.5 whitespace-nowrap opacity-90">Intelligence</p>
        </motion.div>
      </div>

      <StepperArrow 
        fromColor="from-blue-400" 
        toColor="to-green-400" 
        delay={1.2} 
        arrowColor="text-green-400"
        animKey={animKey}
      />

      <div className="flex flex-col items-center">
        <motion.div 
          variants={stepVariants}
          initial="hidden"
          animate="visible"
          custom={1.6}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center shadow-[0_0_15px_rgba(74,222,128,0.2)]"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </motion.div>
        <motion.div variants={stepVariants} initial="hidden" animate="visible" custom={1.7} className="mt-2 text-center">
          <p style={labelStyle('#00FF88')} className="uppercase tracking-widest leading-tight whitespace-nowrap">Drive Revenue</p>
          <p style={labelStyle('#00FF88')} className="uppercase tracking-wider mt-0.5 whitespace-nowrap opacity-90">Close Faster</p>
        </motion.div>
      </div>
    </div>
  );
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('michael.thompson@wolterskluwer.com');
  const [password, setPassword] = useState('PipelineGuide123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'rep' | 'manager'>('rep');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(selectedRole);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 relative overflow-hidden">
      <GravityStarsBackground 
        starsCount={90}
        starsSize={1.4}
        starsOpacity={0.6}
        mouseGravity="repel"
        gravityStrength={45}
        movementSpeed={0.14}
        glowAnimation="spring"
        glowIntensity={8}
      />

      <div className="max-w-3xl w-full bg-white/10 backdrop-blur-2xl border border-white/30 rounded-[32px] overflow-hidden flex flex-col lg:flex-row shadow-[0_32px_120px_rgba(0,0,0,0.5)] relative z-10 transition-all duration-500">
        
        {/* Left Side - Hero Area */}
        <div className="lg:w-[40%] py-6 px-6 md:py-8 flex flex-col items-center justify-center text-center relative border-b lg:border-b-0 lg:border-r border-white/20 bg-white/5">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10 w-full flex flex-col items-center">
                <WKLoginLogo />
                
                <div className="flex flex-col items-center mb-0.5">
                  <MorphingText 
                    texts={["Fix Risks.", "Win Deals.", "Fuel Growth.", "Sales Success."]}
                    loop={true}
                    holdDelay={2500}
                    className="text-2xl md:text-3xl font-black tracking-tight h-12"
                  />
                </div>

                <LoginStepper />
            </div>
        </div>

        {/* Right Side - Form Section (Glassmorphic) */}
        <div className="lg:w-[60%] bg-white/25 backdrop-blur-[10px] p-6 md:p-8 flex flex-col justify-center border-l border-white/10 relative">
            {/* Role Toggle Selector */}
            <div className="flex items-start justify-center gap-4 mb-8 relative z-10">
              <div className="flex flex-col items-center">
                <button 
                  type="button"
                  className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-95 ${ 
                    selectedRole === 'rep' 
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-white/20 text-slate-700 hover:bg-white/40' 
                  }`} 
                  onClick={() => setSelectedRole('rep')}
                >
                  Sales Rep
                </button>
              </div>

              <div className="flex flex-col items-center">
                <button
                  type="button"
                  style={{ backgroundColor: 'rgba(243, 244, 246, 0.4)', color: '#4B5563' }}
                  className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest pointer-events-none cursor-not-allowed opacity-60 backdrop-blur-sm"
                >
                  Sales Manager
                </button>
                <span className="text-[12px] text-slate-800 font-black uppercase tracking-widest mt-1 opacity-60">Coming Soon</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <div>
                    <label className="block text-slate-800 text-[8px] font-black uppercase tracking-widest mb-1.5 ml-0.5">Work Email</label>
                    <input 
                        type="email" 
                        required
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg py-2.5 px-4 text-slate-900 outline-none transition-all placeholder-slate-400 font-bold text-sm shadow-sm"
                        placeholder="email@wolterskluwer.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-1.5 ml-0.5">
                        <label className="block text-slate-800 text-[8px] font-black uppercase tracking-widest">Security Key</label>
                    </div>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg py-2.5 px-4 text-slate-900 outline-none transition-all placeholder-slate-400 font-bold text-sm shadow-sm"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            {showPassword ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943-9.543-7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7" /></svg>
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF6B35] hover:bg-[#FF8B60] focus:ring-4 focus:ring-orange-500/20 text-white font-black py-3 rounded-lg shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center uppercase tracking-[0.25em] text-[10px] mt-4 border border-orange-400/20"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <span className="flex items-center">
                            Authorize Access
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </span>
                    )}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};
