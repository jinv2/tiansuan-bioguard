'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, AlertTriangle, User, Activity, RefreshCcw, Save, Send } from 'lucide-react';

type AgentState = 'SETUP' | 'STANDBY' | 'ACTIVE' | 'ALERT';

export default function Home() {
  const [agentState, setAgentState] = useState<AgentState>('SETUP');
  const [phone, setPhone] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [countDown, setCountDown] = useState(3); // 倒计时发送

  // 模拟循环
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

  // 报警倒计时逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (agentState === 'ALERT' && countDown > 0) {
      timer = setTimeout(() => setCountDown(countDown - 1), 1000);
    } else if (agentState === 'ALERT' && countDown === 0) {
      // 倒计时结束，执行“物理发送”
      triggerNativeSMS();
    }
    return () => clearTimeout(timer);
  }, [agentState, countDown]);

  // 调用手机原生短信接口 (最快、最稳、不要钱)
  const triggerNativeSMS = () => {
    const message = `【天算紧急求救】检测到跌倒！位置：家中客厅。请立即联系！`;
    // 使用 sms: 协议直接拉起短信APP
    window.location.href = `sms:${phone}?&body=${encodeURIComponent(message)}`;
  };

  const handleDemoTrigger = (mode: AgentState) => {
    setIsDemoMode(true);
    if (mode === 'ALERT') {
      setCountDown(3); // 重置倒计时
    }
    setAgentState(mode);
    if (mode !== 'ALERT') {
       setTimeout(() => setIsDemoMode(false), 8000);
    }
  };

  // 保存号码
  const handleSavePhone = () => {
    if (phone.length > 5) {
      setAgentState('STANDBY');
    }
  };

  return (
    <main className="h-screen w-screen bg-black overflow-hidden flex flex-col items-center justify-center relative select-none touch-none font-sans">
      
      {/* === 演示控制台 (仅在非设置模式显示) === */}
      {agentState !== 'SETUP' && (
        <div className="absolute bottom-8 z-[100] flex gap-4 p-3 bg-black/40 rounded-full backdrop-blur-md border border-white/10 opacity-30 hover:opacity-100 transition-opacity">
          <button onClick={() => handleDemoTrigger('STANDBY')} className="p-3 rounded-full bg-white/10 hover:bg-white/30 text-white"><RefreshCcw size={20}/></button>
          <button onClick={() => handleDemoTrigger('ACTIVE')} className="p-3 rounded-full bg-blue-500/30 hover:bg-blue-500/60 text-blue-200"><Heart size={20} fill="currentColor"/></button>
          <button onClick={() => handleDemoTrigger('ALERT')} className="p-3 rounded-full bg-red-600/40 hover:bg-red-600/70 text-red-200 animate-pulse"><AlertTriangle size={20} fill="currentColor"/></button>
        </div>
      )}

      <AnimatePresence mode='wait'>
        
        {/* 状态 0: 首次配置 (输入号码) */}
        {agentState === 'SETUP' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-8">天算生命哨兵 · 配置</h1>
            <div className="w-full max-w-md bg-white/5 p-6 rounded-2xl border border-white/10">
              <label className="block text-sm text-gray-400 mb-2">请输入子女/监护人手机号：</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="例如: 13800000000"
                className="w-full bg-black/50 border border-blue-500/50 rounded-xl px-4 py-4 text-2xl text-white tracking-widest focus:outline-none focus:border-blue-400 transition"
              />
              <button 
                onClick={handleSavePhone}
                disabled={phone.length < 3}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-2 transition"
              >
                <Save size={20} />
                保存并启动守护
              </button>
            </div>
          </motion.div>
        )}

        {/* 状态 1: 待机 */}
        {agentState === 'STANDBY' && (
          <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black">
            <h1 className="text-[120px] font-thin text-white/60 leading-none">{new Date().getHours()}:{new Date().getMinutes()<10?'0':''}{new Date().getMinutes()}</h1>
            <div className="flex items-center gap-2 mt-4 text-emerald-400/80"><Activity size={16} className="animate-pulse"/><p className="text-sm tracking-widest uppercase">Bio-Guard Scanning</p></div>
          </motion.div>
        )}

        {/* 状态 2: 问候 */}
        {agentState === 'ACTIVE' && (
          <motion.div key="active" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-white">
            <div className="text-center">
               <div className="w-32 h-32 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6"><User size={80} className="text-blue-500"/></div>
               <h2 className="text-4xl font-bold text-slate-800">奶奶，下午好！</h2>
            </div>
          </motion.div>
        )}

        {/* 状态 3: 红色暴击 (自动发短信) */}
        {agentState === 'ALERT' && (
          <motion.div key="alert" initial={{ backgroundColor: "#220000" }} animate={{ backgroundColor: "#dc2626" }} className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white p-4">
             <div className="w-full max-w-sm bg-black/20 backdrop-blur-lg p-8 rounded-3xl border border-white/20 text-center">
                <AlertTriangle size={80} className="mx-auto mb-6 animate-bounce" />
                <h1 className="text-4xl font-black mb-2">检测到跌倒!</h1>
                <p className="text-lg opacity-80 mb-6">正在启动一级响应...</p>
                
                {/* 倒计时进度条 */}
                <div className="w-full bg-black/30 h-4 rounded-full mb-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }} 
                    animate={{ width: "100%" }} 
                    transition={{ duration: 3, ease: "linear" }}
                    className="h-full bg-white"
                  />
                </div>
                <p className="text-2xl font-mono font-bold mb-8">
                  {countDown > 0 ? `GPS短信发送中 (${countDown}s)` : '已发送至子女手机'}
                </p>

                {/* 紧急按钮 */}
                <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 bg-white text-red-600 w-full py-4 rounded-xl font-bold text-xl shadow-lg active:scale-95 transition">
                   立即通话
                </a>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-4 text-white/10 text-xs font-mono tracking-[0.5em] pointer-events-none">TIANSUAN AI LABS</div>
    </main>
  );
}
