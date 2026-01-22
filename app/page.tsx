'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, AlertTriangle, User, Activity, RefreshCcw, Save, ScanLine, Loader2, Volume2, SwitchCamera, ScanFace, CheckCircle2 } from 'lucide-react';

type AgentState = 'SETUP' | 'SCANNING' | 'STANDBY' | 'ACTIVE' | 'ALERT';

export default function Home() {
  const [agentState, setAgentState] = useState<AgentState>('SETUP');
  const [phone, setPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [countDown, setCountDown] = useState(3);
  const [cameraReady, setCameraReady] = useState(false);
  const [isMonitorExpanded, setIsMonitorExpanded] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const miniVideoRef = useRef<HTMLVideoElement>(null);
  const scanVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const savedPhone = localStorage.getItem('emergency_phone');
    const savedName = localStorage.getItem('emergency_name');
    if (savedPhone && savedName) {
      setPhone(savedPhone);
      setUserName(savedName);
      setAgentState('STANDBY');
    }
    startCamera();
  }, [facingMode]);

  const startCamera = async () => {
    setCameraReady(false);
    try {
      if (bgVideoRef.current && bgVideoRef.current.srcObject) {
        const tracks = (bgVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } 
      });

      const assignAndPlay = (videoRef: React.RefObject<HTMLVideoElement>) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.play().catch(e => console.log("Play failed", e));
        }
      };

      assignAndPlay(bgVideoRef);
      assignAndPlay(miniVideoRef);
      assignAndPlay(scanVideoRef); // 扫描界面的视频流
      setCameraReady(true);
    } catch (e) { 
      if (facingMode === 'environment') setFacingMode('user');
      else setCameraReady(true);
    }
  };

  const toggleCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (agentState === 'ACTIVE') speak(`${userName}，下午好。`);
    if (agentState === 'ALERT') {
        speak(`警报！检测到${userName}跌倒。`);
        setIsMonitorExpanded(false);
    }
  }, [agentState, userName]);

  // 模拟循环
  useEffect(() => {
    const autoLoop = setInterval(() => {
      if (!isDemoMode && agentState !== 'SETUP' && agentState !== 'SCANNING' && agentState !== 'ALERT') {
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

  // 报警逻辑
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
      new Notification(`🔴 ${userName}跌倒警报`, { body: `点击拨打: ${phone}`, icon: '/icon-192x192.png' });
    }
    setTimeout(() => { window.location.href = `tel:${phone}`; }, 1000);
  };

  const handleDemoTrigger = (mode: AgentState) => {
    setIsDemoMode(true);
    if (mode === 'ALERT') setCountDown(3);
    setAgentState(mode);
    if (mode !== 'ALERT' && mode !== 'SCANNING') setTimeout(() => setIsDemoMode(false), 8000);
  };

  // === 1. 开始扫描 ===
  const startScanProcess = () => {
    setAgentState('SCANNING');
    speak("开始录入人脸信息，请保持正对摄像头。");
    // 3秒后完成扫描
    setTimeout(() => {
       localStorage.setItem('emergency_phone', phone);
       localStorage.setItem('emergency_name', userName);
       speak("录入成功。系统启动。");
       setAgentState('STANDBY');
       if ('Notification' in window) Notification.requestPermission();
    }, 3500);
  };

  const clearData = () => {
    localStorage.removeItem('emergency_phone');
    localStorage.removeItem('emergency_name');
    setPhone('');
    setUserName('');
    setAgentState('SETUP');
  };

  return (
    <main className="h-[100dvh] w-screen bg-black overflow-hidden flex flex-col items-center justify-center relative select-none touch-none font-sans">
      
      {/* 背景层 */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none grayscale contrast-125 overflow-hidden bg-black">
         <video ref={bgVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
         <motion.div animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute left-0 w-full h-1 bg-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,1)] z-10" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40"></div>
      </div>

      {/* 监控功能区 (非设置、非扫描时显示) */}
      {agentState !== 'SETUP' && agentState !== 'SCANNING' && (
        <>
            <motion.div 
                layout 
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                onClick={() => setIsMonitorExpanded(!isMonitorExpanded)}
                className={`fixed z-[80] overflow-hidden bg-gray-900 border border-white/20 shadow-2xl cursor-pointer flex items-center justify-center ${
                    isMonitorExpanded ? "inset-0 w-full h-full rounded-none" : "top-4 right-4 w-32 h-24 rounded-lg"
                }`}
            >
                <video ref={miniVideoRef} autoPlay playsInline muted className="w-full h-full object-cover relative z-10" />
                
                {/* === 2. 核心：AI 分析数据覆盖层 (判别依据) === */}
                <div className="absolute inset-0 z-20 pointer-events-none p-2 font-mono text-[8px] md:text-xs leading-tight flex flex-col justify-between">
                   {/* 顶部数据 */}
                   <div className={`${agentState === 'ALERT' ? 'text-red-500' : 'text-emerald-500'} bg-black/50 p-1 self-start rounded`}>
                      <p>骨骼姿态: {agentState === 'ALERT' ? '异常 (横卧)' : '正常 (直立)'}</p>
                      <p>质心速度: {agentState === 'ALERT' ? '9.8 m/s²' : '0.2 m/s'}</p>
                      <p>识别置信: 98.5%</p>
                   </div>
                   
                   {/* 底部状态 */}
                   <div className="self-end text-white/80">
                      {isMonitorExpanded && <p>CAM-01 | 1280x720 | 30FPS</p>}
                   </div>

                   {/* 锁定框 */}
                   <div className={`absolute top-1/4 left-1/4 w-1/2 h-1/2 border rounded-lg transition-colors duration-300 ${agentState === 'ALERT' ? 'border-red-500 shadow-[0_0_20px_red]' : 'border-emerald-500/50'}`}>
                      {agentState === 'ALERT' && (
                        <div className="absolute inset-0 bg-red-500/20 animate-pulse"></div>
                      )}
                   </div>
                </div>

                <div 
                  onClick={toggleCamera}
                  className={`absolute z-30 bg-black/50 backdrop-blur p-2 rounded-full border border-white/20 hover:bg-white/20 transition active:scale-90 ${isMonitorExpanded ? 'bottom-8 left-8' : 'bottom-1 left-1 p-1'}`}
                >
                  <SwitchCamera size={isMonitorExpanded ? 24 : 14} className="text-white" />
                </div>
            </motion.div>

            {!isMonitorExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-4 right-40 z-[60] flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className={`w-3 h-3 rounded-full ${agentState === 'ALERT' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`} />
                    <span className={`text-xs font-bold tracking-wider ${agentState === 'ALERT' ? 'text-red-400' : 'text-emerald-400'}`}>{agentState === 'ALERT' ? '报警中' : `监护: ${userName}`}</span>
                </motion.div>
            )}
        </>
      )}

      {/* 演示控制台 */}
      {agentState !== 'SETUP' && agentState !== 'SCANNING' && !isMonitorExpanded && (
        <div className="absolute bottom-12 z-[100] flex gap-4 p-3 bg-black/60 rounded-full backdrop-blur-md border border-white/10 opacity-30 hover:opacity-100 transition-opacity">
          <button onClick={() => handleDemoTrigger('STANDBY')} className="p-3 rounded-full bg-white/10 hover:bg-white/30 text-white"><RefreshCcw size={20}/></button>
          <button onClick={() => handleDemoTrigger('ACTIVE')} className="p-3 rounded-full bg-blue-500/30 hover:bg-blue-500/60 text-blue-200"><Heart size={20} fill="currentColor"/></button>
          <button onClick={() => handleDemoTrigger('ALERT')} className="p-3 rounded-full bg-red-600/40 hover:bg-red-600/70 text-red-200 animate-pulse"><AlertTriangle size={20} fill="currentColor"/></button>
          <button onClick={clearData} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300"><Save size={20}/></button>
        </div>
      )}

      <AnimatePresence mode='wait'>
        {/* Setup (输入信息) */}
        {agentState === 'SETUP' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 backdrop-blur-md">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">天算生命哨兵 · 激活</h1>
            <div className="w-full max-w-sm bg-white/5 p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">被监护人姓名：</label><input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="如: 奶奶" className="w-full bg-black/50 border border-blue-500/50 rounded-xl px-4 py-3 text-lg text-white focus:outline-none"/></div>
              <div><label className="block text-sm text-gray-400 mb-1">监护人电话：</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="138..." className="w-full bg-black/50 border border-blue-500/50 rounded-xl px-4 py-3 text-lg text-white tracking-widest focus:outline-none"/></div>
              <button onClick={startScanProcess} disabled={phone.length < 3 || userName.length < 1} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50">
                <ScanFace size={20} /> 录入人脸并启动
              </button>
            </div>
          </motion.div>
        )}

        {/* === 新增：人脸扫描过程 (Scanning) === */}
        {agentState === 'SCANNING' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
             <div className="relative w-full h-full">
                <video ref={scanVideoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-50" />
                {/* 扫描网格 */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,100,0.1)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                
                {/* 扫描线动画 */}
                <motion.div animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute left-0 w-full h-1 bg-green-500 shadow-[0_0_20px_#0f0]" />

                {/* 中心扫描框 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <div className="w-64 h-64 border-2 border-green-500/50 rounded-full relative flex items-center justify-center">
                      <div className="w-60 h-60 border border-green-500/30 rounded-full animate-ping"></div>
                      <ScanFace size={40} className="text-green-500/80 animate-pulse"/>
                   </div>
                   <h2 className="text-2xl font-mono text-green-500 mt-8 animate-pulse">正在提取面部特征...</h2>
                   <p className="text-green-500/50 text-sm mt-2">请保持面部正对屏幕</p>
                </div>
             </div>
          </motion.div>
        )}

        {/* Standby */}
        {agentState === 'STANDBY' && (
          <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-black/90 z-0"></div>
            <div className="relative z-10 text-center px-4">
              <h1 className="text-[80px] md:text-[150px] font-thin text-white/80 leading-none tracking-tighter drop-shadow-2xl">{new Date().getHours()}:{new Date().getMinutes()<10?'0':''}{new Date().getMinutes()}</h1>
              <div className="flex items-center justify-center gap-2 mt-4 text-emerald-400/50"><p className="text-[10px] tracking-[0.3em] uppercase">Target: {userName}</p></div>
            </div>
          </motion.div>
        )}
        {/* Active */}
        {agentState === 'ACTIVE' && (
          <motion.div key="active" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 backdrop-blur-sm p-6">
            <div className="text-center"><div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-lg"><User size={80} className="text-blue-500"/></div><h2 className="text-3xl md:text-4xl font-bold text-slate-800">{userName}，下午好！</h2></div>
          </motion.div>
        )}
        {/* Alert */}
        {agentState === 'ALERT' && (
          <motion.div key="alert" initial={{ backgroundColor: "#220000" }} animate={{ backgroundColor: "#dc2626" }} className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white p-6">
             <div className="w-full max-w-sm bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/20 text-center shadow-2xl">
                <div className="relative"><AlertTriangle size={60} className="mx-auto mb-6 text-red-500 animate-bounce" /><Volume2 size={30} className="absolute top-0 right-10 text-white/50 animate-pulse" /></div>
                <h1 className="text-3xl md:text-4xl font-black mb-2">检测到 {userName} 跌倒!</h1>
                <p className="text-lg opacity-80 mb-6 text-red-200">正在呼叫子女...</p>
                <div className="w-full bg-black/30 h-4 rounded-full mb-4 overflow-hidden"><motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, ease: "linear" }} className="h-full bg-white"/></div>
                <p className="text-xl font-mono font-bold mb-6">{countDown > 0 ? `等待接通 (${countDown}s)` : '📞 正在拨号...'}</p>
                <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 bg-white text-red-600 w-full py-6 rounded-2xl font-black text-2xl shadow-xl active:scale-95 transition animate-pulse">立即通话</a>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-4 text-white/20 text-[10px] font-mono tracking-[0.5em] pointer-events-none z-50">TIANSUAN v2.8</div>
    </main>
  );
}
