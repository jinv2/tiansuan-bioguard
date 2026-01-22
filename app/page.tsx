'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, AlertTriangle, User, Activity, RefreshCcw, Save, ScanLine, Loader2, Volume2, Video } from 'lucide-react';

type AgentState = 'SETUP' | 'STANDBY' | 'ACTIVE' | 'ALERT';

export default function Home() {
  const [agentState, setAgentState] = useState<AgentState>('SETUP');
  const [phone, setPhone] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [countDown, setCountDown] = useState(3);
  const [cameraReady, setCameraReady] = useState(false);
  
  // 需要两个引用：一个给背景(特效)，一个给右上角(高清)
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const miniVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const savedPhone = localStorage.getItem('emergency_phone');
    if (savedPhone) {
      setPhone(savedPhone);
      setAgentState('STANDBY');
    }
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      
      // 1. 给背景视频流
      if (bgVideoRef.current) {
        bgVideoRef.current.srcObject = stream;
        bgVideoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
      
      // 2. 给迷你监视器视频流 (同一路流，不增加负担)
      if (miniVideoRef.current) {
        miniVideoRef.current.srcObject = stream;
      }

    } catch (e) { setCameraReady(true); }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (agentState === 'ACTIVE') speak("奶奶，下午好。");
    if (agentState === 'ALERT') speak("警报！警报！检测到跌倒。正在呼叫。");
  }, [agentState]);

  useEffect(() => {
    const autoLoop = setInterval(() => {
      if (!isDemoMode && agentState !== 'SETUP' && agentState !== 'ALERT') {
        const random = Math.random();
        if (random > 0.95) setAgentState('ACTIVE');
        else if (random < 0.3) setAgentState('STANDBY');
      }
    }, 3000);

    if ('wakeLock' in navigator) {
      // @ts-ignore
      navigator.wakeLock.request('screen').catch(() => {});
    }
    return () => clearInterval(autoLoop);
  }, [isDemoMode, agentState]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (agentState === 'ALERT' && countDown > 0) {
      timer = setTimeout(() => setCountDown(countDown - 1), 1000);
    } else if (agentState === 'ALERT' && countDown === 0) {
      triggerSimulation();
    }
    return () => clearTimeout(timer);
  }, [agentState, countDown]);

  const triggerSimulation = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      navigator.vibrate?.([500, 200, 500]);
      new Notification("🔴 跌倒警报", { body: `点击拨打: ${phone}`, icon: '/icon-192x192.png' });
    }
    setTimeout(() => { window.location.href = `tel:${phone}`; }, 1000);
  };

  const handleDemoTrigger = (mode: AgentState) => {
    setIsDemoMode(true);
    if (mode === 'ALERT') setCountDown(3);
    setAgentState(mode);
    if (mode !== 'ALERT') setTimeout(() => setIsDemoMode(false), 8000);
  };

  const handleSavePhone = () => {
    if (phone.length > 5) {
      localStorage.setItem('emergency_phone', phone);
      setAgentState('STANDBY');
      if ('Notification' in window) Notification.requestPermission();
    }
  };

  const clearData = () => {
    localStorage.removeItem('emergency_phone');
    setPhone('');
    setAgentState('SETUP');
  };

  return (
    <main className="h-[100dvh] w-screen bg-black overflow-hidden flex flex-col items-center justify-center relative select-none touch-none font-sans">
      
      {/* === 背景层 (模糊特效) === */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none grayscale contrast-125 overflow-hidden bg-black">
         <video ref={bgVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
         {!cameraReady && <div className="absolute inset-0 bg-black/80 z-20" />}
         <motion.div animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute left-0 w-full h-1 bg-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,1)] z-10" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40"></div>
      </div>

      {/* === 顶部监控栏 (Monitor Bar) === */}
      {agentState !== 'SETUP' && (
        <div className="absolute top-4 right-4 z-[60] flex flex-col items-end gap-3">
           
           {/* 1. 实时取景窗 (Live Viewfinder) */}
           <motion.div 
             initial={{ scale: 0 }} animate={{ scale: 1 }}
             className="relative w-32 h-24 bg-black rounded-lg border border-white/20 overflow-hidden shadow-2xl"
           >
              {/* 高清画面 */}
              <video ref={miniVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              
              {/* 取景框UI */}
              <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-white/50"></div>
              <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-white/50"></div>
              <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-white/50"></div>
              <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-white/50"></div>
              
              {/* REC 标记 */}
              <div className="absolute top-1 right-2 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] text-white/80 font-mono">LIVE</span>
              </div>
           </motion.div>

           {/* 2. 呼吸指示灯 */}
           <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
             <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className={`w-3 h-3 rounded-full ${agentState === 'ALERT' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`} />
             <span className={`text-xs font-bold tracking-wider ${agentState === 'ALERT' ? 'text-red-400' : 'text-emerald-400'}`}>
               {agentState === 'ALERT' ? '报警中' : 'AI 监护中'}
             </span>
           </div>

        </div>
      )}

      {/* 演示控制台 */}
      {agentState !== 'SETUP' && (
        <div className="absolute bottom-12 z-[100] flex gap-4 p-3 bg-black/60 rounded-full backdrop-blur-md border border-white/10 opacity-30 hover:opacity-100 transition-opacity">
          <button onClick={() => handleDemoTrigger('STANDBY')} className="p-3 rounded-full bg-white/10 hover:bg-white/30 text-white"><RefreshCcw size={20}/></button>
          <button onClick={() => handleDemoTrigger('ACTIVE')} className="p-3 rounded-full bg-blue-500/30 hover:bg-blue-500/60 text-blue-200"><Heart size={20} fill="currentColor"/></button>
          <button onClick={() => handleDemoTrigger('ALERT')} className="p-3 rounded-full bg-red-600/40 hover:bg-red-600/70 text-red-200 animate-pulse"><AlertTriangle size={20} fill="currentColor"/></button>
          <button onClick={clearData} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300"><Save size={20}/></button>
        </div>
      )}

      <AnimatePresence mode='wait'>
        {/* Setup */}
        {agentState === 'SETUP' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 backdrop-blur-md">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">天算生命哨兵 · 激活</h1>
            <div className="w-full max-w-sm bg-white/5 p-6 rounded-2xl border border-white/10 shadow-2xl">
              <label className="block text-sm text-gray-400 mb-2">输入监护人电话：</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="138..." className="w-full bg-black/50 border border-blue-500/50 rounded-xl px-4 py-4 text-xl text-white tracking-widest focus:outline-none"/>
              <button onClick={handleSavePhone} disabled={phone.length < 3} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2">
                <ScanLine size={20} /> 开启 AI 视觉守护
              </button>
            </div>
          </motion.div>
        )}

        {/* Standby */}
        {agentState === 'STANDBY' && (
          <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-black/90 z-0"></div>
            <div className="relative z-10 text-center px-4">
              <h1 className="text-[80px] md:text-[150px] font-thin text-white/80 leading-none tracking-tighter drop-shadow-2xl">
                {new Date().getHours()}:{new Date().getMinutes()<10?'0':''}{new Date().getMinutes()}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-4 text-emerald-400/50">
                <p className="text-[10px] tracking-[0.3em] uppercase">System Protected</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active */}
        {agentState === 'ACTIVE' && (
          <motion.div key="active" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 backdrop-blur-sm p-6">
            <div className="text-center">
               <div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-lg">
                 <User size={80} className="text-blue-500"/>
               </div>
               <h2 className="text-3xl md:text-4xl font-bold text-slate-800">奶奶，下午好！</h2>
            </div>
          </motion.div>
        )}

        {/* Alert */}
        {agentState === 'ALERT' && (
          <motion.div key="alert" initial={{ backgroundColor: "#220000" }} animate={{ backgroundColor: "#dc2626" }} className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white p-6">
             <div className="w-full max-w-sm bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/20 text-center shadow-2xl">
                <div className="relative">
                    <AlertTriangle size={60} className="mx-auto mb-6 text-red-500 animate-bounce" />
                    <Volume2 size={30} className="absolute top-0 right-10 text-white/50 animate-pulse" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black mb-2">严重跌倒警报!</h1>
                <p className="text-lg opacity-80 mb-6 text-red-200">正在呼叫子女...</p>
                <div className="w-full bg-black/30 h-4 rounded-full mb-4 overflow-hidden"><motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, ease: "linear" }} className="h-full bg-white"/></div>
                <p className="text-xl font-mono font-bold mb-6">{countDown > 0 ? `等待接通 (${countDown}s)` : '📞 正在拨号...'}</p>
                <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 bg-white text-red-600 w-full py-6 rounded-2xl font-black text-2xl shadow-xl active:scale-95 transition animate-pulse">立即通话</a>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-4 text-white/20 text-[10px] font-mono tracking-[0.5em] pointer-events-none z-50">TIANSUAN v2.4</div>
    </main>
  );
}
