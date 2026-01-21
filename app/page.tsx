'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, AlertTriangle, User, Activity, RefreshCcw, Phone, Video } from 'lucide-react';

type AgentState = 'STANDBY' | 'ACTIVE' | 'ALERT';

export default function Home() {
  const [agentState, setAgentState] = useState<AgentState>('STANDBY');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 模拟配置：这是子女预设的号码（演示用）
  const EMERGENCY_PHONE = "13800138000";
  // 模拟配置：这是一个免费的公共视频房间，用于演示
  const VIDEO_ROOM_URL = "https://meet.jit.si/TiansuanDemoRoom_" + Math.floor(Math.random() * 1000);

  useEffect(() => {
    const autoLoop = setInterval(() => {
      if (!isDemoMode) {
        const random = Math.random();
        if (random > 0.95) setAgentState('ACTIVE');
        else if (random > 0.99) setAgentState('ALERT');
        else if (random < 0.3) setAgentState('STANDBY');
      }
    }, 3000);

    if ('wakeLock' in navigator) {
      // @ts-ignore
      navigator.wakeLock.request('screen').catch(() => {});
    }
    return () => clearInterval(autoLoop);
  }, [isDemoMode]);

  const handleDemoTrigger = (mode: AgentState) => {
    setIsDemoMode(true);
    setAgentState(mode);
    setTimeout(() => setIsDemoMode(false), 10000);
  };

  return (
    <main className="h-screen w-screen bg-black overflow-hidden flex flex-col items-center justify-center relative select-none touch-none">
      
      {/* === 底部演示控制台 === */}
      <div className="absolute bottom-8 z-[100] flex gap-4 p-3 bg-black/40 rounded-full backdrop-blur-md border border-white/10 transition-opacity duration-300 opacity-30 hover:opacity-100">
        <button onClick={() => handleDemoTrigger('STANDBY')} className="p-3 rounded-full bg-white/10 hover:bg-white/30 text-white"><RefreshCcw size={20}/></button>
        <button onClick={() => handleDemoTrigger('ACTIVE')} className="p-3 rounded-full bg-blue-500/30 hover:bg-blue-500/60 text-blue-200"><Heart size={20} fill="currentColor"/></button>
        <button onClick={() => handleDemoTrigger('ALERT')} className="p-3 rounded-full bg-red-600/40 hover:bg-red-600/70 text-red-200 animate-pulse"><AlertTriangle size={20} fill="currentColor"/></button>
      </div>

      <AnimatePresence mode='wait'>
        {/* 1. 待机 */}
        {agentState === 'STANDBY' && (
          <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black">
            <h1 className="text-[100px] md:text-[150px] font-thin text-white/60 leading-none">{new Date().getHours()}:{new Date().getMinutes()<10?'0':''}{new Date().getMinutes()}</h1>
            <div className="flex items-center gap-2 mt-4 text-emerald-400/80"><Activity size={16} className="animate-pulse"/><p className="text-sm tracking-widest uppercase">Bio-Guard Scanning</p></div>
          </motion.div>
        )}

        {/* 2. 问候 */}
        {agentState === 'ACTIVE' && (
          <motion.div key="active" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-white">
            <div className="text-center">
               <div className="w-32 h-32 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6"><User size={80} className="text-blue-500"/></div>
               <h2 className="text-4xl font-bold text-slate-800">奶奶，下午好！</h2>
            </div>
          </motion.div>
        )}

        {/* 3. 报警 (核心升级) */}
        {agentState === 'ALERT' && (
          <motion.div key="alert" initial={{ backgroundColor: "#220000" }} animate={{ backgroundColor: "#dc2626" }} className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white p-4">
             <AlertTriangle size={100} className="animate-bounce mb-4" />
             <h1 className="text-5xl font-black mb-2">检测到跌倒!</h1>
             <p className="text-xl opacity-90 mb-8">已定位：客厅 (置信度 98%)</p>
             
             {/* 紧急操作按钮区 */}
             <div className="flex flex-col gap-4 w-full max-w-sm">
                {/* 按钮A: 拨打电话 */}
                <a href={`tel:${EMERGENCY_PHONE}`} className="flex items-center justify-center gap-3 bg-white text-red-600 px-6 py-4 rounded-xl font-bold text-xl shadow-lg active:scale-95 transition">
                  <Phone size={24} />
                  拨打子女电话
                </a>
                
                {/* 按钮B: 视频连线 (Jitsi) */}
                <a href={VIDEO_ROOM_URL} target="_blank" className="flex items-center justify-center gap-3 bg-black/40 border-2 border-white/30 text-white px-6 py-4 rounded-xl font-bold text-xl active:scale-95 transition">
                  <Video size={24} />
                  视频接入 (Jitsi)
                </a>
             </div>
             
             <p className="mt-6 text-sm opacity-60">正在尝试自动接通...</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-4 text-white/10 text-xs font-mono tracking-[0.5em] pointer-events-none">TIANSUAN AI LABS</div>
    </main>
  );
}
