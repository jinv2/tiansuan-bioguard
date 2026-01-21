'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, AlertTriangle, User, Activity } from 'lucide-react';

type AgentState = 'STANDBY' | 'ACTIVE' | 'ALERT';

export default function Home() {
  const [agentState, setAgentState] = useState<AgentState>('STANDBY');
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const autoLoop = setInterval(() => {
      if (!isDemoMode) {
        // 自动随机演示
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
    // 5秒后恢复自动
    setTimeout(() => setIsDemoMode(false), 5000);
  };

  return (
    <main className="h-screen w-screen bg-black overflow-hidden flex flex-col items-center justify-center relative select-none touch-none">
      
      {/* === 隐形控制按钮 (演示专用) === */}
      {/* 左下角：触发问候 */}
      <div onClick={() => handleDemoTrigger('ACTIVE')} className="absolute left-0 bottom-0 w-1/3 h-1/2 z-50 cursor-pointer opacity-0" />
      
      {/* 右下角：触发报警 */}
      <div onClick={() => handleDemoTrigger('ALERT')} className="absolute right-0 bottom-0 w-1/3 h-1/2 z-50 cursor-pointer opacity-0" />
      
      {/* 顶部：复位 */}
      <div onClick={() => handleDemoTrigger('STANDBY')} className="absolute top-0 w-full h-1/3 z-50 cursor-pointer opacity-0" />

      <AnimatePresence mode='wait'>
        {/* 状态 1: 待机 (时钟) */}
        {agentState === 'STANDBY' && (
          <motion.div 
            key="standby"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black"
          >
            <div className="text-center text-white/60">
               <h1 className="text-[100px] md:text-[150px] font-thin leading-none tracking-tighter">
                 {new Date().getHours()}:{new Date().getMinutes()<10?'0':''}{new Date().getMinutes()}
               </h1>
               <div className="flex items-center justify-center gap-2 mt-4 text-emerald-400/80">
                 <Activity size={16} className="animate-pulse" />
                 <p className="text-sm tracking-widest uppercase">Bio-Guard Scanning</p>
               </div>
            </div>
          </motion.div>
        )}

        {/* 状态 2: 活跃 (问候) */}
        {agentState === 'ACTIVE' && (
          <motion.div 
            key="active"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-white"
          >
            <div className="text-center">
               <div className="w-32 h-32 md:w-40 md:h-40 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6">
                 <User size={80} className="text-blue-500" />
               </div>
               <h2 className="text-4xl font-bold text-slate-800">奶奶，下午好！</h2>
               <p className="text-xl mt-4 text-slate-500">今天阳光不错，窗边坐坐吗？</p>
            </div>
          </motion.div>
        )}

        {/* 状态 3: 报警 (跌倒) */}
        {agentState === 'ALERT' && (
          <motion.div 
            key="alert"
            initial={{ backgroundColor: "#220000" }} animate={{ backgroundColor: "#dc2626" }}
            className="absolute inset-0 z-50 flex items-center justify-center text-white"
          >
             <div className="text-center animate-bounce">
                <AlertTriangle size={120} className="mx-auto mb-4" />
                <h1 className="text-6xl font-black tracking-tighter">跌倒检测!</h1>
                <p className="text-2xl mt-4 opacity-90">正在接通子女视频...</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="absolute bottom-6 text-white/10 text-xs font-mono tracking-[0.5em]">
        TIANSUAN AI LABS
      </div>
    </main>
  );
}
