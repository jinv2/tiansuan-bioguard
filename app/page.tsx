'use client';
import { useState, useEffect, useRef } from 'react';
import { agentInstance } from '@/lib/agent-brain';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, AlertTriangle } from 'lucide-react';

export default function Home() {
  const [agentState, setAgentState] = useState<'STANDBY' | 'ACTIVE' | 'ALERT'>('STANDBY');

  useEffect(() => {
    // 模拟视觉循环
    const mockVisionLoop = setInterval(() => {
      const mockData = {
        movement: Math.random() > 0.7,
        hasPerson: Math.random() > 0.5,
        posture: Math.random() > 0.98 ? 'fallen' : 'standing',
        timestamp: Date.now()
      };
      // @ts-ignore
      const newState = agentInstance.perceive(mockData);
      setAgentState(newState);
    }, 2000);
    
    // 屏幕常亮申请
    if ('wakeLock' in navigator) {
        // @ts-ignore
        navigator.wakeLock.request('screen').catch(()=> console.log('Wake Lock skipped'));
    }
    return () => clearInterval(mockVisionLoop);
  }, []);

  return (
    <main className="h-screen w-screen bg-black overflow-hidden flex flex-col items-center justify-center relative">
      <AnimatePresence mode='wait'>
        {agentState === 'STANDBY' && (
          <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-blue-900 to-black"><div className="text-center text-white/50"><h1 className="text-6xl font-light mb-4">14:30</h1><p className="text-2xl">天算AI · 守护运行中</p></div></motion.div>
        )}
        {agentState === 'ACTIVE' && (
          <motion.div key="active" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-white"><div className="text-center"><Heart size={100} className="text-blue-500 mx-auto animate-pulse" /><h2 className="text-4xl font-bold mt-4 text-black">奶奶，下午好！</h2><p className="text-xl mt-4 text-gray-500">记得喝水哦</p></div></motion.div>
        )}
        {agentState === 'ALERT' && (
          <motion.div key="alert" initial={{ backgroundColor: "#000" }} animate={{ backgroundColor: "#ef4444" }} className="absolute inset-0 z-50 flex items-center justify-center text-white"><div className="text-center animate-bounce"><AlertTriangle size={150} className="mx-auto" /><h1 className="text-6xl font-black">检测到跌倒!</h1><p className="text-3xl mt-4">正在呼叫紧急联系人...</p></div></motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-5 right-5 text-white/20 text-sm font-mono">TIANSUAN AI LABS v1.0</div>
    </main>
  );
}
