'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, AlertTriangle, User, Activity, RefreshCcw, Save, Bell, Eye, ScanLine } from 'lucide-react';

type AgentState = 'SETUP' | 'STANDBY' | 'ACTIVE' | 'ALERT';

export default function Home() {
  const [agentState, setAgentState] = useState<AgentState>('SETUP');
  const [phone, setPhone] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [countDown, setCountDown] = useState(3);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) { console.log("Camera access denied"); }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (agentState === 'ACTIVE') speak("奶奶，下午好。今天阳光不错。");
    if (agentState === 'ALERT') speak("警告，检测到跌倒。正在启动紧急响应。");
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
    window.location.href = `sms:${phone}?&body=${encodeURIComponent("【天算急救】检测到跌倒！位置：家中客厅。")}`;
    if ('Notification' in window && Notification.permission === 'granted') {
      navigator.vibrate?.([200, 100, 200, 100, 500]);
      new Notification("🔔 紧急警报", { body: `正在联系子女: ${phone}`, icon: '/icon-192x192.png' });
    }
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
    <main className="h-screen w-screen bg-black overflow-hidden flex flex-col items-center justify-center relative select-none touch-none font-sans">
      
      {/* === 背景层：真实摄像头 + 激光扫描特效 === */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none grayscale contrast-125 overflow-hidden">
         <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
         
         {/* AI 扫描线 (上下移动) */}
         <motion.div 
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 w-full h-1 bg-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,1)] z-10"
         />
         
         {/* 网格遮罩 */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40"></div>
         
         {/* 四角对焦框 */}
         <div className="absolute top-10 left-10 w-8 h-8 border-t-2 border-l-2 border-emerald-500/50"></div>
         <div className="absolute top-10 right-10 w-8 h-8 border-t-2 border-r-2 border-emerald-500/50"></div>
         <div className="absolute bottom-10 left-10 w-8 h-8 border-b-2 border-l-2 border-emerald-500/50"></div>
         <div className="absolute bottom-10 right-10 w-8 h-8 border-b-2 border-r-2 border-emerald-500/50"></div>
      </div>

      {/* 演示控制台 */}
      {agentState !== 'SETUP' && (
        <div className="absolute bottom-8 z-[100] flex gap-4 p-3 bg-black/60 rounded-full backdrop-blur-md border border-white/10 opacity-30 hover:opacity-100 transition-opacity">
          <button onClick={() => handleDemoTrigger('STANDBY')} className="p-3 rounded-full bg-white/10 hover:bg-white/30 text-white"><RefreshCcw size={20}/></button>
          <button onClick={() => handleDemoTrigger('ACTIVE')} className="p-3 rounded-full bg-blue-500/30 hover:bg-blue-500/60 text-blue-200"><Heart size={20} fill="currentColor"/></button>
          <button onClick={() => handleDemoTrigger('ALERT')} className="p-3 rounded-full bg-red-600/40 hover:bg-red-600/70 text-red-200 animate-pulse"><AlertTriangle size={20} fill="currentColor"/></button>
          <button onClick={clearData} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300" title="重置数据"><Save size={20}/></button>
        </div>
      )}

      <AnimatePresence mode='wait'>
        {/* Setup */}
        {agentState === 'SETUP' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 text-white p-8 backdrop-blur-md">
            <h1 className="text-3xl font-bold mb-8">天算生命哨兵 · 激活</h1>
            <div className="w-full max-w-md bg-white/5 p-6 rounded-2xl border border-white/10 shadow-2xl">
              <label className="block text-sm text-gray-400 mb-2">输入监护人电话 (永久保存)：</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="138..." className="w-full bg-black/50 border border-blue-500/50 rounded-xl px-4 py-4 text-2xl text-white tracking-widest focus:outline-none"/>
              <button onClick={handleSavePhone} disabled={phone.length < 3} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-2">
                <ScanLine size={20} /> 开启 AI 视觉守护
              </button>
            </div>
          </motion.div>
        )}

        {/* Standby */}
        {agentState === 'STANDBY' && (
          <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-black/90 z-0"></div>
            <div className="relative z-10 text-center">
              <h1 className="text-[120px] font-thin text-white/80 leading-none tracking-tighter drop-shadow-2xl">{new Date().getHours()}:{new Date().getMinutes()<10?'0':''}{new Date().getMinutes()}</h1>
              <div className="flex items-center justify-center gap-2 mt-4 text-emerald-400"><Activity size={16} className="animate-pulse"/><p className="text-sm tracking-widest uppercase font-mono">Vision System Online</p></div>
            </div>
          </motion.div>
        )}

        {/* Active */}
        {agentState === 'ACTIVE' && (
          <motion.div key="active" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 backdrop-blur-sm">
            <div className="text-center">
               <div className="w-32 h-32 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-lg"><User size={80} className="text-blue-500"/></div>
               <h2 className="text-4xl font-bold text-slate-800">奶奶，下午好！</h2>
               <p className="text-gray-500 mt-2">（语音播放中...）</p>
            </div>
          </motion.div>
        )}

        {/* Alert */}
        {agentState === 'ALERT' && (
          <motion.div key="alert" initial={{ backgroundColor: "#220000" }} animate={{ backgroundColor: "#dc2626" }} className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white p-4">
             <div className="w-full max-w-sm bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/20 text-center shadow-2xl">
                <AlertTriangle size={80} className="mx-auto mb-6 animate-bounce" />
                <h1 className="text-4xl font-black mb-2">检测到跌倒!</h1>
                <div className="w-full bg-black/30 h-4 rounded-full mb-2 overflow-hidden"><motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, ease: "linear" }} className="h-full bg-white"/></div>
                <p className="text-2xl font-mono font-bold mb-8">{countDown > 0 ? `GPS信号锁定中 (${countDown}s)` : '🚀 求救信号已发出'}</p>
                <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 bg-white text-red-600 w-full py-4 rounded-xl font-bold text-xl shadow-lg active:scale-95 transition">立即通话</a>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-4 text-white/20 text-xs font-mono tracking-[0.5em] pointer-events-none z-50">TIANSUAN AI LABS v2.0 Pro</div>
    </main>
  );
}
