'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, AlertTriangle, User, Activity, RefreshCcw, Save, ScanLine, Loader2, Volume2, SwitchCamera, ScanFace, CheckCircle2, Play } from 'lucide-react';

type AgentState = 'SETUP' | 'SCANNING' | 'STANDBY' | 'ACTIVE' | 'ALERT';
type ScanStep = 'IDLE' | 'FRONT' | 'SIDE' | 'MOUTH' | 'BLINK' | 'SUCCESS';

export default function Home() {
  const [agentState, setAgentState] = useState<AgentState>('SETUP');
  const [scanStep, setScanStep] = useState<ScanStep>('IDLE');
  
  const [phone, setPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [countDown, setCountDown] = useState(3);
  const [cameraReady, setCameraReady] = useState(false);
  const [isMonitorExpanded, setIsMonitorExpanded] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  // 保持视频流的引用，以便在不同界面间传递
  const activeStreamRef = useRef<MediaStream | null>(null);
  
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

  // === 关键修复：当进入扫描模式时，重新绑定视频流 ===
  useEffect(() => {
    if (agentState === 'SCANNING' && scanVideoRef.current && activeStreamRef.current) {
      console.log("正在绑定扫描视频流...");
      scanVideoRef.current.srcObject = activeStreamRef.current;
      scanVideoRef.current.play().catch(e => console.log("扫描视频播放失败", e));
    }
  }, [agentState]); // 监听状态变化

  const startCamera = async () => {
    setCameraReady(false);
    try {
      // 停止旧流
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // 移动端优化：使用 640x480 以保证流畅度
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode, 
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        } 
      });

      activeStreamRef.current = stream; // 保存流

      const assignAndPlay = (videoRef: React.RefObject<HTMLVideoElement>) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.play().catch(e => console.log("Play failed", e));
        }
      };

      assignAndPlay(bgVideoRef);
      assignAndPlay(miniVideoRef);
      // 注意：这里不赋值 scanVideoRef，因为它还没渲染出来
      
      setCameraReady(true);
    } catch (e) { 
      console.log("Camera Error", e);
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

  const startLivenessCheck = () => {
    setAgentState('SCANNING');
    setScanStep('FRONT');
  };

  useEffect(() => {
    if (agentState !== 'SCANNING') return;

    let timer: NodeJS.Timeout;
    // 移动端优化：每步 2000ms，更快更流畅
    const STEP_DELAY = 2000; 

    const nextStep = (step: ScanStep, text: string) => {
        speak(text);
        timer = setTimeout(() => {
            setScanStep(step);
        }, STEP_DELAY);
    };

    switch (scanStep) {
        case 'FRONT':
            // 刚进入时给一点缓冲时间加载视频
            timer = setTimeout(() => {
                 nextStep('SIDE', "请缓慢向右转头");
            }, 2500); 
            speak("请正对屏幕，保持不动");
            break;
        case 'SIDE':
            nextStep('MOUTH', "检测成功。请张张嘴");
            break;
        case 'MOUTH':
            nextStep('BLINK', "特征已提取。请眨眨眼");
            break;
        case 'BLINK':
            nextStep('SUCCESS', "很好。认证通过");
            break;
        case 'SUCCESS':
            speak("系统启动中...");
            timer = setTimeout(() => {
                localStorage.setItem('emergency_phone', phone);
                localStorage.setItem('emergency_name', userName);
                setAgentState('STANDBY');
                if ('Notification' in window) Notification.requestPermission();
            }, 2000);
            break;
    }

    return () => clearTimeout(timer);
  }, [scanStep, agentState]);

  const clearData = () => {
    localStorage.removeItem('emergency_phone');
    localStorage.removeItem('emergency_name');
    setPhone('');
    setUserName('');
    setAgentState('SETUP');
    setScanStep('IDLE');
  };

  return (
    <main className="h-[100dvh] w-screen bg-black overflow-hidden flex flex-col items-center justify-center relative select-none touch-none font-sans">
      
      {/* 背景层 */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none grayscale contrast-125 overflow-hidden bg-black">
         <video ref={bgVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
         <motion.div animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute left-0 w-full h-1 bg-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,1)] z-10" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40"></div>
      </div>

      {/* 监控窗口 + 数据层 */}
      {agentState !== 'SETUP' && agentState !== 'SCANNING' && (
        <>
            <motion.div 
                layout 
                onClick={() => setIsMonitorExpanded(!isMonitorExpanded)}
                className={`fixed z-[80] overflow-hidden bg-gray-900 border border-white/20 shadow-2xl cursor-pointer flex items-center justify-center ${
                    isMonitorExpanded ? "inset-0 w-full h-full rounded-none" : "top-4 right-4 w-32 h-24 rounded-lg"
                }`}
            >
                <video ref={miniVideoRef} autoPlay playsInline muted className="w-full h-full object-cover relative z-10" />
                
                <div className="absolute inset-0 z-20 pointer-events-none p-2 font-mono text-[8px] md:text-xs leading-tight flex flex-col justify-between">
                   <div className={`${agentState === 'ALERT' ? 'text-red-500' : 'text-emerald-500'} bg-black/50 p-1 self-start rounded`}>
                      <p>姿态: {agentState === 'ALERT' ? '异常' : '正常'}</p>
                      <p>置信: 98.5%</p>
                   </div>
                   <div className={`absolute top-1/4 left-1/4 w-1/2 h-1/2 border rounded-lg transition-colors duration-300 ${agentState === 'ALERT' ? 'border-red-500 shadow-[0_0_20px_red]' : 'border-emerald-500/50'}`}></div>
                </div>

                <div onClick={toggleCamera} className={`absolute z-30 bg-black/50 backdrop-blur p-2 rounded-full border border-white/20 ${isMonitorExpanded ? 'bottom-8 left-8' : 'bottom-1 left-1 p-1'}`}>
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
        {/* Setup */}
        {agentState === 'SETUP' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 backdrop-blur-md">
            <h1 className="text-2xl md:text-3xl font-bold mb-8">天算生命哨兵 · 激活</h1>
            <div className="w-full max-w-sm bg-white/5 p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">被监护人姓名：</label><input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="如: 奶奶" className="w-full bg-black/50 border border-blue-500/50 rounded-xl px-4 py-3 text-lg text-white focus:outline-none"/></div>
              <div><label className="block text-sm text-gray-400 mb-1">监护人电话：</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="138..." className="w-full bg-black/50 border border-blue-500/50 rounded-xl px-4 py-3 text-lg text-white tracking-widest focus:outline-none"/></div>
              <button onClick={startLivenessCheck} disabled={phone.length < 3 || userName.length < 1} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50">
                <Play size={20} /> 开始活体认证
              </button>
            </div>
          </motion.div>
        )}

        {/* === 活体检测流程 (Mobile Optimized) === */}
        {agentState === 'SCANNING' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
             
             {/* 视频层：强制最高层级，防止被遮挡 */}
             <video ref={scanVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-80" />
             
             {/* UI层 */}
             <div className="absolute inset-0 bg-black/20 z-10 flex flex-col items-center justify-center">
                <div className="relative w-64 h-64 rounded-full border-4 border-white/30 flex items-center justify-center overflow-hidden backdrop-blur-none">
                   <motion.div className="absolute inset-0 border-4 border-green-500 rounded-full" initial={{ scale: 0.8, opacity: 0 }} animate={scanStep === 'SUCCESS' ? { scale: 1, opacity: 1 } : { opacity: 0 }} />
                   
                   <div className="z-20 text-white drop-shadow-md">
                      {scanStep === 'FRONT' && <ScanFace size={80} className="animate-pulse opacity-90"/>}
                      {scanStep === 'SIDE' && <RefreshCcw size={80} className="animate-spin opacity-90" style={{animationDuration: '3s'}}/>}
                      {scanStep === 'MOUTH' && <div className="text-6xl font-bold">O</div>}
                      {scanStep === 'BLINK' && <div className="text-6xl font-bold">-_-</div>}
                      {scanStep === 'SUCCESS' && <CheckCircle2 size={100} className="text-green-500"/>}
                   </div>
                </div>

                <div className="mt-8 text-center z-20 px-4">
                   <h2 className="text-3xl font-bold text-white mb-2 shadow-black drop-shadow-md">
                      {scanStep === 'FRONT' && "正对屏幕"}
                      {scanStep === 'SIDE' && "向右转头"}
                      {scanStep === 'MOUTH' && "张张嘴"}
                      {scanStep === 'BLINK' && "眨眨眼"}
                      {scanStep === 'SUCCESS' && "认证通过"}
                   </h2>
                   <p className="text-white text-lg font-medium drop-shadow-md">
                      {scanStep === 'FRONT' && "保持面部在圆圈内"}
                      {scanStep === 'SIDE' && "检测侧脸..."}
                      {scanStep === 'MOUTH' && "检测下颚..."}
                      {scanStep === 'BLINK' && "活体防伪..."}
                      {scanStep === 'SUCCESS' && "生成模型中..."}
                   </p>
                </div>

                {/* 进度条 */}
                <div className="absolute bottom-10 flex gap-2 z-20">
                   {['FRONT', 'SIDE', 'MOUTH', 'BLINK'].map((step, i) => (
                      <div key={step} className={`h-2 w-12 rounded-full transition-colors ${
                        ['FRONT', 'SIDE', 'MOUTH', 'BLINK', 'SUCCESS'].indexOf(scanStep) > i 
                        ? 'bg-green-500' 
                        : 'bg-white/30'
                      }`} />
                   ))}
                </div>
             </div>
          </motion.div>
        )}

        {/* Standby/Active/Alert States... */}
        {agentState === 'STANDBY' && (
          <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-black/90 z-0"></div>
            <div className="relative z-10 text-center px-4">
              <h1 className="text-[80px] md:text-[150px] font-thin text-white/80 leading-none tracking-tighter drop-shadow-2xl">{new Date().getHours()}:{new Date().getMinutes()<10?'0':''}{new Date().getMinutes()}</h1>
              <div className="flex items-center justify-center gap-2 mt-4 text-emerald-400/50"><p className="text-[10px] tracking-[0.3em] uppercase">Target: {userName}</p></div>
            </div>
          </motion.div>
        )}
        {agentState === 'ACTIVE' && (
          <motion.div key="active" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 backdrop-blur-sm p-6">
            <div className="text-center"><div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-lg"><User size={80} className="text-blue-500"/></div><h2 className="text-3xl md:text-4xl font-bold text-slate-800">{userName}，下午好！</h2></div>
          </motion.div>
        )}
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
      <div className="absolute bottom-4 text-white/20 text-[10px] font-mono tracking-[0.5em] pointer-events-none z-50">TIANSUAN v3.0</div>
    </main>
  );
}
