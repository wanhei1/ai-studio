/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  PlusCircle, 
  Layers, 
  FileDiff, 
  ShieldCheck, 
  GitPullRequest, 
  RefreshCw, 
  Coins, 
  HelpCircle,
  Database,
  ChevronDown,
  ChevronUp,
  Sliders,
  Settings,
  Info,
  Key,
  Flame,
  User,
  ExternalLink,
  Lock,
  Home,
  FolderOpen,
  Workflow,
  SlidersHorizontal,
  History,
  Plus,
  Search,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  BookOpen,
  Heart,
  Eye,
  Download,
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react';
import { useDeliveryFlow } from './hooks/useDeliveryFlow';
import ChatMessage from './components/ChatMessage';
import ProgressBar from './components/ProgressBar';
import HumanIntervene from './components/HumanIntervene';
import CodeDiff from './components/CodeDiff';
import TestResult from './components/TestResult';
import PRInfo from './components/PRInfo';
import HistoryPanel from './components/HistoryPanel';
import QuickTags from './components/QuickTags';
import { SCENARIOS } from './data/scenarios';

export default function App() {
  const {
    messages,
    activeStageId,
    activeCodeChanges,
    activeTestSuiteResult,
    activePR,
    historyList,
    activeHistoryId,
    isProcessing,
    sessionTokensUsed,
    globalTokensUsed,
    submitRequirement,
    submitInterventionOfAI,
    handleNewRequirement,
    handleRestoreHistory
  } = useDeliveryFlow();

  // Core visual navigation state modeled after https://aistudio.google.com/
  const [currentView, setCurrentView] = useState<'home' | 'playground' | 'library' | 'tuning' | 'gallery'>('home');
  const [playgroundMode, setPlaygroundMode] = useState<'chat' | 'freeform' | 'structured'>('chat');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  
  // Custom Playground state
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'diff' | 'test' | 'pr'>('diff');
  const [mobileTab, setMobileTab] = useState<'chat' | 'diff' | 'history' | 'settings'>('chat');
  const [isSysExpanded, setIsSysExpanded] = useState<boolean>(true);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [temperature, setTemperature] = useState<number>(1.0);
  const [systemInstructions, setSystemInstructions] = useState<string>(
    '你是一个敏捷高能的全链路软件开发微服务交付专家。在获得产品需求后，开始分析系统边界，找出修改点，并高保真地注入和修改相应代码、运行回归断言链并发起自动化合并PR。'
  );

  // Safety settings sliders (High-fidelity custom Google safety filter slider simulation)
  const [safetyHarassment, setSafetyHarassment] = useState<number>(0); // 0=Block None, 1=Block Few, 2=Some, 3=All
  const [safetyHate, setSafetyHate] = useState<number>(0);
  const [safetySexually, setSafetySexually] = useState<number>(0);
  const [safetyDangerous, setSafetyDangerous] = useState<number>(0);

  // Library state
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Tuning state
  const [tuningModelName, setTuningModelName] = useState<string>('my-custom-delivery-model-v1');
  const [tuningEpochs, setTuningEpochs] = useState<number>(5);
  const [tuningLearningRate, setTuningLearningRate] = useState<number>(0.001);
  const [tuningStatus, setTuningStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [tuningProgress, setTuningProgress] = useState<number>(0);
  const [tuningLoss, setTuningLoss] = useState<number[]>([]);
  const [tuningBatchSize, setTuningBatchSize] = useState<number>(16);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeStageId]);

  // Dynamically shift visual tabs inside deliverables outcomes panel based on ongoing stage transitions
  useEffect(() => {
    if (activeStageId === 'locate' || activeStageId === 'codegen') {
      setActiveTab('diff');
      if (mobileTab !== 'chat') setMobileTab('diff');
    } else if (activeStageId === 'testing') {
      setActiveTab('test');
      if (mobileTab !== 'chat') setMobileTab('diff');
    } else if (activeStageId === 'pr_submit') {
      setActiveTab('pr');
      if (mobileTab !== 'chat') setMobileTab('diff');
    } else if (activeStageId === 'clarify') {
      setMobileTab('chat');
    }
  }, [activeStageId]);

  // Handle preset clicks in start home portal
  const handleLaunchPreset = (reqText: string) => {
    handleNewRequirement();
    setCurrentView('playground');
    setPlaygroundMode('chat');
    setInputText(reqText);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const handleLaunchScenarioDirectly = (scenarioId: string) => {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      handleNewRequirement();
      setCurrentView('playground');
      setPlaygroundMode('chat');
      // Submits the requirement dynamically
      submitRequirement(scenario.requirement);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    submitRequirement(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSelectTag = (text: string) => {
    setInputText(text);
    inputRef.current?.focus();
  };

  const handlePresetModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  // Safe percentage calculator
  const sessionTokenLimit = 1048576;
  const tokenPercent = Math.min(100, Math.max(0.2, (sessionTokensUsed / sessionTokenLimit) * 100));

  // Run tuning simulation
  const startTuningSimulation = () => {
    if (tuningStatus === 'running') return;
    setTuningStatus('running');
    setTuningProgress(0);
    setTuningLoss([]);
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      const progressRatio = Math.min(100, (currentStep / (tuningEpochs * 10)) * 100);
      setTuningProgress(progressRatio);
      
      // Loss simulation
      const calculatedLoss = Math.max(0.04, 0.8 / (1 + currentStep * 0.1) + (Math.random() * 0.05));
      setTuningLoss(prev => [...prev, calculatedLoss]);

      if (progressRatio >= 100) {
        clearInterval(interval);
        setTuningStatus('completed');
      }
    }, 300);
  };

  // Convert safety integer to readable text
  const getSafetyLevelText = (level: number) => {
    switch(level) {
      case 0: return 'Block None (不屏蔽)';
      case 1: return 'Block Few (低频屏蔽)';
      case 2: return 'Block Some (中频屏蔽)';
      case 3: return 'Block All (高安全屏蔽)';
      default: return 'Block None';
    }
  };

  const filteredHistory = historyList.filter(item => 
    item.requirementText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="app-root" className="min-h-screen bg-[#131114] text-[#e3e3e3] font-sans flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. Global Header Navigation Bar (AI Studio Clean Line Layout) */}
      <header id="main-header" className="bg-[#1e1f20] border-b border-white/5 sticky top-0 z-40 px-4 md:px-6 py-2 flex items-center justify-between">
        {/* Left top brand */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} 
            className="p-1 px-1.5 hover:bg-[#2d2f31]/80 rounded transition-colors hidden lg:block"
            title="切换侧边栏"
          >
            <span className="text-neutral-400 font-bold text-sm">☰</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 text-white shrink-0 flex items-center justify-center shadow">
              <Sparkles size={12} className="text-white animate-pulse" />
            </div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
              <span className="text-sm font-bold tracking-tight text-[#ffffff] font-sans">超级个体 AI Studio</span>
              <span className="text-[9px] bg-[#2d2f31] text-[#a8c7fa] border border-blue-500/20 px-1.5 py-0.2 rounded font-mono font-bold tracking-wider uppercase">
                V2.5 STABLE
              </span>
            </div>
          </div>
        </div>

        {/* Global info and actions */}
        <div className="flex items-center gap-3 md:gap-4 justify-end">
          <div className="hidden sm:flex items-center gap-1.5 bg-[#131314] px-2.5 py-1 rounded-full border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>沙盒就绪</span>
          </div>

          <a 
            href="https://ai.google.dev/pricing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/5 hover:bg-blue-500/10 text-[11px] font-semibold rounded border border-blue-500/20 text-[#8ab4f8] transition-all cursor-pointer"
          >
            <Key size={10} />
            <span className="hidden xs:inline">获取 API Key</span>
            <ExternalLink size={8} />
          </a>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase" title={process.env.USER_EMAIL || 'user'}>
              {process.env.USER_EMAIL ? process.env.USER_EMAIL[0] : 'U'}
            </div>
            <span className="text-[11px] text-neutral-400 hidden md:inline font-mono">{process.env.USER_EMAIL || 'twhhae123@gmail.com'}</span>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout holding Sidebar & Center Area */}
      <div className="flex-1 w-full flex overflow-hidden">
        
        {/* ======================================================== */}
        {/* SIDEBAR: Custom high-fidelity Google AI Studio navigation */}
        {/* ======================================================== */}
        <aside 
          className={`bg-[#1e1f20] border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 z-30 ease-in-out
            ${isSidebarExpanded ? 'w-[250px]' : 'w-[56px]'} 
            hidden lg:flex`}
        >
          {/* Side menu Top - Blue Create prompt Button component */}
          <div className="p-3 border-b border-white/5 space-y-2">
            {isSidebarExpanded ? (
              <div className="relative group">
                <button
                  onClick={() => {
                    setCurrentView('playground');
                    setPlaygroundMode('chat');
                    handleNewRequirement();
                  }}
                  className="w-full py-2.5 px-4 rounded-full bg-[#1a73e8] hover:bg-blue-600 hover:shadow-lg text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                >
                  <Plus size={14} className="stroke-[3]" />
                  <span>新建提示词</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setCurrentView('playground');
                  setPlaygroundMode('chat');
                  handleNewRequirement();
                }}
                className="w-10 h-10 mx-auto rounded-full bg-[#1a73e8] hover:bg-blue-600 text-white flex items-center justify-center cursor-pointer transition-all shadow-sm"
                title="新建提示词"
              >
                <Plus size={16} className="stroke-[3]" />
              </button>
            )}
          </div>

          {/* Navigation Links List */}
          <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
            {/* Home Portal */}
            <button
              onClick={() => setCurrentView('home')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all text-left cursor-pointer
                ${currentView === 'home' 
                  ? 'bg-blue-500/10 text-[#8ab4f8]' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
            >
              <Home size={15} />
              {isSidebarExpanded && <span>主页 (AI Studio Portal)</span>}
            </button>

            {/* Playground editor */}
            <button
              onClick={() => setCurrentView('playground')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all text-left cursor-pointer
                ${currentView === 'playground' 
                  ? 'bg-blue-500/10 text-[#8ab4f8]' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
            >
              <Workflow size={15} />
              {isSidebarExpanded && <span>交付工作台 (Playground)</span>}
            </button>

            {/* Library list */}
            <button
              onClick={() => setCurrentView('library')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all text-left cursor-pointer
                ${currentView === 'library' 
                  ? 'bg-blue-500/10 text-[#8ab4f8]' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
            >
              <FolderOpen size={15} />
              {isSidebarExpanded && (
                <div className="flex justify-between items-center w-full">
                  <span>我的提示库 (Library)</span>
                  {historyList.length > 0 && (
                    <span className="bg-[#131314] text-neutral-400 text-[10px] px-1.5 py-0.2 rounded-full font-mono">{historyList.length}</span>
                  )}
                </div>
              )}
            </button>

            {/* Model tuning sandbox */}
            <button
              onClick={() => setCurrentView('tuning')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all text-left cursor-pointer
                ${currentView === 'tuning' 
                  ? 'bg-blue-500/10 text-[#8ab4f8]' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
            >
              <SlidersHorizontal size={15} />
              {isSidebarExpanded && <span>模型微调 (Tuning Sandbox)</span>}
            </button>

            {/* Preset Gallery */}
            <button
              onClick={() => setCurrentView('gallery')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all text-left cursor-pointer
                ${currentView === 'gallery' 
                  ? 'bg-blue-500/10 text-[#8ab4f8]' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutGrid size={15} />
              {isSidebarExpanded && <span>提示词廊 (Prompt Gallery)</span>}
            </button>
          </nav>

          {/* Sidebar bottom info metrics */}
          <div className="p-3 border-t border-white/5 space-y-3 shrink-0">
            {isSidebarExpanded ? (
              <div className="space-y-2">
                <div className="bg-[#131114] p-2.5 rounded-lg border border-white/5 space-y-1">
                  <div className="flex justify-between text-[9px] text-neutral-400 font-bold uppercase font-sans">
                    <span>会话 Tokens 额度限制</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${tokenPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-neutral-500 font-mono">
                    <span>{sessionTokensUsed.toLocaleString()}</span>
                    <span>1,048,576</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 justify-center">
                  <Lock size={10} name="secure" />
                  <span>沙盒数据采用隔离级安全脱敏</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-neutral-500" title="API Status: OK">
                ●
              </div>
            )}
          </div>
        </aside>

        {/* ======================================================== */}
        {/* CENTER VIEWPORT: Home vs Playground Workstation vs Tuning */}
        {/* ======================================================== */}
        <main className="flex-1 bg-[#131314] overflow-hidden flex flex-col relative">
          
          {/* ==================== SCREEN 1: PORTAL HOME ==================== */}
          {currentView === 'home' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-6xl mx-auto w-full animate-fade-in font-sans">
              
              {/* Giant elegant Hero Banner matching Google AI Studio Home portal */}
              <div className="relative rounded-2xl overflow-hidden p-6 md:p-10 border border-white/5 bg-gradient-to-br from-[#1b1f35] via-[#15131a] to-[#121214] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
                <div className="space-y-3 z-10 max-w-xl text-left">
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                    Google AI Studio Enterprise Version Replica
                  </span>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    欢迎来到 超级个体 AI Studio 工作控制台
                  </h1>
                  <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
                    在沙盒级高防微服务架构中自动化重构、校验、迭代和并轨任何产品经理需求。由 Gemini 1.5 &amp; 2.0 提供深度逻辑编排支持。
                  </p>
                  
                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <button
                      onClick={() => {
                        setCurrentView('playground');
                        setPlaygroundMode('chat');
                        handleNewRequirement();
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
                    >
                      开始构建多回合提示词
                    </button>
                    <button
                      onClick={() => setCurrentView('gallery')}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-neutral-200 font-bold text-xs rounded-lg border border-white/10 transition-all cursor-pointer"
                    >
                      探索优秀交付模版 ➔
                    </button>
                  </div>
                </div>

                <div className="relative hidden md:block shrink-0">
                  <div className="w-28 h-28 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 animate-pulse">
                    <Sparkles size={48} className="text-indigo-400 animate-spin-slow" />
                  </div>
                </div>
              </div>

              {/* Grid section: Get Started with 3 Interactive Prompts cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-widest text-left">
                  新建交付提示词类型 (Create New Prompt)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Chat Prompt Card */}
                  <div 
                    onClick={() => {
                      setCurrentView('playground');
                      setPlaygroundMode('chat');
                      handleNewRequirement();
                    }}
                    className="p-5 rounded-xl border border-white/5 bg-[#1e1f20] hover:border-blue-500/30 hover:bg-[#2d2f31]/50 cursor-pointer transition-all duration-300 group flex flex-col justify-between text-left space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                        <User size={18} />
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        Chat prompt (对话式提示词并轨)
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        最适合多轮、有条件的对话反馈迭代。自动化微服务架构审计、产品边界交互反馈以及带有决策质询 (Human in the loop) 的交付工作。
                      </p>
                    </div>
                    <span className="text-[11px] text-blue-400 uppercase font-bold tracking-wider pt-2 flex items-center gap-1">
                      创建会话 ➔
                    </span>
                  </div>

                  {/* Freeform Prompt Card */}
                  <div 
                    onClick={() => {
                      setCurrentView('playground');
                      setPlaygroundMode('freeform');
                      handleNewRequirement();
                    }}
                    className="p-5 rounded-xl border border-white/5 bg-[#1e1f20] hover:border-[#8ab4f8]/30 hover:bg-[#2d2f31]/50 cursor-pointer transition-all duration-300 group flex flex-col justify-between text-left space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                        <FileDiff size={18} />
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                        Freeform prompt (自由插入提示词)
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        适用于直接注入指令内容或粘贴特定系统源文件片段的多维重构。排除对话干扰，提供更精细的模型边界参数、上下文装载与代码比对。
                      </p>
                    </div>
                    <span className="text-[11px] text-[#a8c7fa] uppercase font-bold tracking-wider pt-2 flex items-center gap-1">
                      创建自由编辑器 ➔
                    </span>
                  </div>

                  {/* Structured Prompt Card */}
                  <div 
                    onClick={() => {
                      setCurrentView('playground');
                      setPlaygroundMode('structured');
                      handleNewRequirement();
                    }}
                    className="p-5 rounded-xl border border-white/5 bg-[#1e1f20] hover:border-emerald-500/30 hover:bg-[#2d2f31]/50 cursor-pointer transition-all duration-300 group flex flex-col justify-between text-left space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <ShieldCheck size={18} />
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                        Structured prompt (结构化用例并轨)
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        向大模型提供典型的单元测试 Input / Output 重构样本。高精度对齐契约，生成测试驱动回归，保证在注入核心微服务时零故障。
                      </p>
                    </div>
                    <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider pt-2 flex items-center gap-1">
                      创建回归契约 ➔
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Active Delivery files and star prompt templates */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                
                {/* Left side column: Recents list */}
                <div className="lg:col-span-2 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-widest">
                      最近的交付提示词记录 (Recent Prompts history)
                    </h3>
                    <button 
                      onClick={() => setCurrentView('library')} 
                      className="text-xs text-blue-400 hover:underline font-bold"
                    >
                      查看全部 ➔
                    </button>
                  </div>

                  <div className="bg-[#1e1f20] border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                    {historyList.length === 0 ? (
                      // If no real history, show mock awesome presets to let user easily experience the system
                      <div className="p-4 space-y-0.5">
                        <p className="text-xs text-neutral-400 py-3 text-center font-mono">
                          暂无激活交付历史。点击下方推荐提示模版一键进行沙盒编译交付：
                        </p>
                        <div className="space-y-2">
                          <div 
                            onClick={() => handleLaunchPreset("在首页文章卡片上增加阅读量 icon + 数字展示")}
                            className="p-3 bg-[#131314] hover:bg-[#2d2f31] border border-white/5 hover:border-blue-500/30 rounded-lg cursor-pointer transition-all flex justify-between items-center group"
                          >
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                                Demo: 首页文章卡片增加阅读量Eye显示图标
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                                <span>TYPE: CHAT</span>
                                <span>●</span>
                                <span>MODEL: gemini-2.0-flash</span>
                              </div>
                            </div>
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                              PASS MOCK
                            </span>
                          </div>

                          <div 
                            onClick={() => handleLaunchPreset("在注册表单页面添加 GDPR 隐私政策必选勾选框")}
                            className="p-3 bg-[#131314] hover:bg-[#2d2f31] border border-white/5 hover:border-purple-500/30 rounded-lg cursor-pointer transition-all flex justify-between items-center group"
                          >
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-white group-hover:text-purple-400 transition-colors">
                                Demo: 注册表单页面 GDPR 隐私政策勾选框
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                                <span>TYPE: STRUCTURED</span>
                                <span>●</span>
                                <span>MODEL: gemini-1.5-pro</span>
                              </div>
                            </div>
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                              PASS MOCK
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      filteredHistory.slice(0, 5).map(item => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            handleRestoreHistory(item.id);
                            setCurrentView('playground');
                          }}
                          className="p-3 bg-transparent hover:bg-white/5 cursor-pointer transition-all flex items-center justify-between gap-4 font-sans text-left group"
                        >
                          <div className="space-y-1 overflow-hidden">
                            <h4 className="text-xs font-semibold text-neutral-200 group-hover:text-blue-400 transition-colors truncate">
                              {item.requirementText}
                            </h4>
                            <div className="flex items-center gap-2 text-[9px] text-neutral-500 font-mono">
                              <span>{item.timestamp}</span>
                              <span className="w-1 h-1 rounded-full bg-neutral-700" />
                              <span>Spent Tokens: <strong className="text-blue-400">{item.totalTokens.toLocaleString()}</strong></span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase
                              ${item.status === 'completed' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : item.status === 'running' 
                                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right side column: Featured templates list */}
                <div className="space-y-3 text-left">
                  <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-widest text-left">
                    热门极速开发微服务场景模板
                  </h3>

                  <div className="bg-[#1e1f20] border border-white/5 p-4 rounded-xl space-y-4">
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      系统预装了三个高精度微服务集成用例，涵盖全链路代码改动定位、状态双向澄清决策、跑通测试回归用例、以及生成自动化合并 PR。
                    </p>

                    <div className="space-y-2.5">
                      {SCENARIOS.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => handleLaunchScenarioDirectly(item.id)}
                          className="p-3 bg-[#131314] hover:bg-[#2d2f31]/90 cursor-pointer border border-white/5 hover:border-blue-500/40 rounded-lg group transition-all flex items-center justify-between gap-2"
                        >
                          <div className="text-left space-y-0.5">
                            <span className="text-[10px] text-neutral-500 font-mono block">SCENARIO TEMPLATE</span>
                            <span className="text-xs font-bold text-white group-hover:text-[#8ab4f8] transition-colors">{item.name}</span>
                          </div>
                          <span className="text-[10px] text-blue-400 font-bold shrink-0">一键导入 ➔</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <div className="p-3 rounded-lg bg-blue-500/5 border border-indigo-500/10 flex items-start gap-2.5">
                        <Database size={13} className="text-blue-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-[10px] text-neutral-400 leading-relaxed">
                          <span className="font-bold text-[#8ab4f8]">数据存储说明</span>
                          <p>所有会话数据、生成的 diff 修正项、测试跑跑状态和 PR 的版本标记，默认由 React LocalStorage 隔离存储运行区。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==================== SCREEN 2: ACTIVE EDITOR PLAYGROUND ==================== */}
          {currentView === 'playground' && (
            <div className="flex-1 flex overflow-hidden">
              
              {/* Center workspace content containing playground header, instructions and prompt conversational lists */}
              <div className="flex-1 flex flex-col bg-[#131314] overflow-hidden border-r border-[#131314]/50 lg:border-white/5">
                
                {/* Visual Playground Toolbar for switching Prompt Modes on the Fly */}
                <div className="bg-[#1e1f20] border-b border-white/5 px-4 py-2.5 flex items-center justify-between gap-4 font-sans z-10 shrink-0">
                  <div className="flex items-center gap-1 bg-[#131314] p-1 rounded-lg border border-white/5">
                    <button
                      onClick={() => setPlaygroundMode('chat')}
                      className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                        playgroundMode === 'chat' ? 'bg-[#2d2f31] text-blue-400' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Chat prompt
                    </button>
                    <button
                      onClick={() => setPlaygroundMode('freeform')}
                      className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                        playgroundMode === 'freeform' ? 'bg-[#2d2f31] text-[#a8c7fa]' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Freeform
                    </button>
                    <button
                      onClick={() => setPlaygroundMode('structured')}
                      className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                        playgroundMode === 'structured' ? 'bg-[#2d2f31] text-emerald-400' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Structured
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNewRequirement}
                      className="p-1 px-3 bg-neutral-800 hover:bg-neutral-700 rounded text-[11px] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="重置并重开新会话"
                    >
                      <RotateCcw size={11} />
                      <span>重设输入</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible System instructions layout box */}
                <div className="bg-[#1e1f20]/90 border-b border-white/5 px-4 py-2 flex flex-col transition-all duration-300 select-none">
                  <div 
                    className="flex items-center justify-between cursor-pointer py-1 group"
                    onClick={() => setIsSysExpanded(!isSysExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      <Settings size={13} className="text-blue-400 group-hover:rotate-45 transition-transform duration-300" />
                      <span className="text-xs font-semibold text-neutral-200 font-sans">System instructions (微服务大模型全局指令)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 bg-[#131314] px-1.5 py-0.5 rounded font-mono">DEFAULT ACTIVE</span>
                      {isSysExpanded ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                    </div>
                  </div>

                  {isSysExpanded && (
                    <div className="mt-2 pt-2 border-t border-white/5 animate-fade-in">
                      <textarea
                        value={systemInstructions}
                        onChange={(e) => setSystemInstructions(e.target.value)}
                        className="w-full bg-[#131314] text-xs text-neutral-300 font-mono p-2.5 rounded-lg border border-white/5 focus:outline-none focus:border-blue-500 resize-none h-[64px] leading-relaxed scrollbar-hide"
                        placeholder="请输入系统交付预设指令内容..."
                        spellCheck="false"
                      />
                    </div>
                  )}
                </div>

                {/* Main Prompts Stream Area */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
                  
                  {playgroundMode === 'structured' && messages.length === 0 && (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-3 font-sans text-left max-w-2xl mx-auto my-6 animate-fade-in">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <ShieldCheck size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Structured Few-Shot Samples Mode</span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-normal">
                        结构化提示词能通过为模型提供精确的需求变动和执行规范示例，极力减少微服务中生成边缘逻辑 bug 的概率。
                      </p>
                      
                      <div className="p-3 bg-neutral-900 rounded-lg space-y-2 border border-white/5">
                        <p className="text-[10px] font-bold text-neutral-200 uppercase font-mono border-b border-white/5 pb-1">Sample 示例样本</p>
                        <div className="text-[11px] font-mono text-neutral-400 space-y-1">
                          <div><strong className="text-indigo-400">Input (需求):</strong> "交易列表加上导出按钮"</div>
                          <div><strong className="text-emerald-400">Code Mod:</strong> TransactionList.tsx - write client download file as CSV blob</div>
                          <div><strong className="text-blue-400">Assert Suite:</strong> 单元测试头部验证通过, 文件大小符合规范</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {playgroundMode === 'freeform' && messages.length === 0 && (
                    <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-3 font-sans text-left max-w-2xl mx-auto my-6 animate-fade-in">
                      <div className="flex items-center gap-2 text-purple-400">
                        <FileDiff size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Freeform Prompts Mode</span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-normal">
                        自由模式将系统上下文以高强度嵌入，最适合输入针对一到两个源文件的直接修整指令。此模式不需要连续的问答澄清，而倾向于快速在右侧 outcomes 变更面板查收并轨产物。
                      </p>
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto my-auto space-y-6 animate-fade-in">
                      {/* Glowing center indicator space */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-125 animate-pulse" />
                        <div className="relative w-14 h-14 rounded-2xl bg-[#1e1f20] border border-white/5 flex items-center justify-center text-white shadow-xl">
                          <Sparkles size={28} className="text-[#a8c7fa] animate-spin-slow" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-sm font-bold text-[#ffffff] font-sans">
                          {playgroundMode === 'chat' && '写下您的首个多轮交付对话'}
                          {playgroundMode === 'freeform' && '写下无约束系统合并重构指令'}
                          {playgroundMode === 'structured' && '在此运行单元与契约级质量校验并轨'}
                        </h2>
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          在底部文本框向大模型下发生态指令。“超级个体” 将协助定位微服务内部组件源码、自动应用 diff、执行回归测试套并提供自动化 PR 合并。
                        </p>
                      </div>

                      <QuickTags onSelectTag={handleSelectTag} />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {messages.map((msg, index) => {
                        const isLatestAI = msg.sender === 'ai' && index === messages.length - 1;
                        
                        return (
                          <div key={msg.id} className="space-y-4">
                            <ChatMessage 
                              message={msg} 
                              onRecreate={msg.sender === 'ai' ? () => submitRequirement(messages[0].content) : undefined} 
                            />
       
                            {msg.stages && (msg.currentStageId || msg.stages.some(s => s.status === 'completed')) && (
                              <div className="pl-0 md:pl-10 animate-fade-in">
                                <ProgressBar stages={msg.stages} currentStageId={msg.currentStageId} />
                              </div>
                            )}
       
                            {msg.intervention && !msg.interventionAnswered && isLatestAI && (
                              <div className="pl-0 md:pl-10 animate-fade-in-up">
                                <HumanIntervene 
                                  intervention={msg.intervention} 
                                  onSubmit={submitInterventionOfAI}
                                  onSkip={() => submitInterventionOfAI(msg.intervention?.options?.[0] || '确认无误，下一步')}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
       
                {/* Center Workspace Bottom bar for writing inputs */}
                <div id="chat-input-area" className="p-4 bg-[#131314] border-t border-white/5 space-y-3 shrink-0">
                  <form onSubmit={handleSubmit} className="flex gap-3 items-end bg-[#1e1f20] p-2 rounded-2xl border border-white/5 focus-within:border-blue-500/80 transition-all shadow-md">
                    <textarea
                      ref={inputRef}
                      rows={2}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`在此输入您的产品功能交付需求...\n例如："为注册表单添加 GDPR 隐私政策勾选并关联校验"`}
                      disabled={isProcessing}
                      className="flex-1 bg-transparent border-none outline-none resize-none px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:ring-0 leading-relaxed font-sans"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
       
                    <button
                      type="submit"
                      id="submit-requirement-btn"
                      disabled={!inputText.trim() || isProcessing}
                      className="p-3 rounded-xl bg-[#c2e7ff] hover:bg-[#b5dbf7] text-[#001d35] font-bold shadow transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                      title="运行并交付"
                    >
                      <Send size={14} />
                      <span className="text-xs font-bold font-sans">运行</span>
                    </button>
                  </form>
                  <div className="text-[10px] text-neutral-500 flex justify-between px-2 font-mono">
                    <span>↩ 键直接运行 / ⇧+↩ 换行动作</span>
                    <span>AUTOMATED SANDBOX DELIVERY ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Playground side panel: Parameters right-bar settings & outcomes tabs */}
              <section className="w-full md:w-[320px] lg:w-[360px] bg-[#1e1f20] border-l border-white/5 flex flex-col p-4 shrink-0 overflow-y-auto">
                <div className="space-y-4 mb-4 pb-4 border-b border-white/5 text-left">
                  <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Sliders size={13} className="text-[#8ab4f8]" />
                    <span className="text-xs font-bold text-neutral-300 tracking-wide uppercase font-sans">
                      调参参数 (Parameters)
                    </span>
                  </div>

                  {/* Model configuration list dropdown selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400 font-bold font-sans flex items-center gap-1">
                      <span>Model 预设微服务大模型</span>
                      <Info size={10} className="text-neutral-500" />
                    </label>
                    <select
                      value={selectedModel}
                      onChange={(e) => handlePresetModelChange(e.target.value)}
                      className="w-full bg-[#131114] text-xs text-neutral-300 border border-white/10 rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono"
                    >
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (轻量合并交付)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (深度架构重构)</option>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash (高速断言校验)</option>
                      <option value="gemini-2.0-pro">Gemini 2.0 Pro (企业用例回归)</option>
                    </select>
                  </div>

                  {/* Temperature Settings */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-sans">
                      <span className="text-neutral-400 font-bold">Temperature (代码发散度)</span>
                      <span className="text-[#8ab4f8] font-mono font-extrabold">{temperature.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* HIGH FIDELITY SAFETY SETTINGS (Google safety thresholds simulation sliders) */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block font-sans">
                      Google 安全校验过滤器 (Safety settings)
                    </span>

                    <div className="space-y-2 text-[10px]">
                      {/* Harassment */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-neutral-400 font-mono">
                          <span>骚扰内容 (Harassment)</span>
                          <span className="text-blue-400 font-bold">{getSafetyLevelText(safetyHarassment)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="1"
                          value={safetyHarassment}
                          onChange={(e) => setSafetyHarassment(parseInt(e.target.value))}
                          className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-400"
                        />
                      </div>

                      {/* Hate Speech */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-neutral-400 font-mono">
                          <span>仇恨言论 (Hate Speech)</span>
                          <span className="text-blue-400 font-bold">{getSafetyLevelText(safetyHate)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="1"
                          value={safetyHate}
                          onChange={(e) => setSafetyHate(parseInt(e.target.value))}
                          className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-400"
                        />
                      </div>

                      {/* Sexually Explicit */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-neutral-400 font-mono">
                          <span>色情暴露 (Sexually Explicit)</span>
                          <span className="text-blue-400 font-bold">{getSafetyLevelText(safetySexually)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="1"
                          value={safetySexually}
                          onChange={(e) => setSafetySexually(parseInt(e.target.value))}
                          className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-400"
                        />
                      </div>

                      {/* Dangerous Content */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-neutral-400 font-mono">
                          <span>危险倾向 (Dangerous Content)</span>
                          <span className="text-blue-400 font-bold">{getSafetyLevelText(safetyDangerous)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="1"
                          value={safetyDangerous}
                          onChange={(e) => setSafetyDangerous(parseInt(e.target.value))}
                          className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Microservice output workspace deliverables panels */}
                <div id="tabs-container" className="flex-1 bg-[#131314] rounded-xl flex flex-col overflow-hidden border border-white/5 shadow-sm min-h-[350px]">
                  <div className="bg-[#1e1f20] border-b border-white/5 p-1.5 flex gap-1 shrink-0 font-sans">
                    <button
                      type="button"
                      onClick={() => setActiveTab('diff')}
                      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        activeTab === 'diff' 
                          ? 'bg-[#2d2f31] text-blue-400 border border-white/5 shadow-inner' 
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <FileDiff size={12} className={activeTab === 'diff' ? 'text-blue-400' : 'text-neutral-500'} />
                      <span>代码变更</span>
                      {activeCodeChanges.length > 0 && (
                        <span className="text-[8px] bg-blue-500 text-white px-1.5 ml-0.5 rounded font-mono">{activeCodeChanges.length}</span>
                      )}
                    </button>
       
                    <button
                      type="button"
                      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        activeTab === 'test' 
                          ? 'bg-[#2d2f31] text-emerald-400 border border-white/5 shadow-inner' 
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      onClick={() => setActiveTab('test')}
                    >
                      <ShieldCheck size={12} className={activeTab === 'test' ? 'text-emerald-400' : 'text-neutral-500'} />
                      <span>自动化测试</span>
                      {activeTestSuiteResult && activeTestSuiteResult.status !== 'idle' && (
                        <span className={`w-1.5 h-1.5 rounded-full ${activeTestSuiteResult.status === 'passed' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                      )}
                    </button>
       
                    <button
                      type="button"
                      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        activeTab === 'pr' 
                          ? 'bg-[#2d2f31] text-[#a8c7fa] border border-white/5 shadow-inner' 
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      onClick={() => setActiveTab('pr')}
                    >
                      <GitPullRequest size={12} className={activeTab === 'pr' ? 'text-[#a8c7fa]' : 'text-neutral-500'} />
                      <span>PR 提交单</span>
                    </button>
                  </div>
       
                  {/* Content for the tabs */}
                  <div className="flex-1 p-3.5 overflow-y-auto">
                    {activeTab === 'diff' && <CodeDiff files={activeCodeChanges} />}
                    {activeTab === 'test' && <TestResult testSuite={activeTestSuiteResult} />}
                    {activeTab === 'pr' && <PRInfo pr={activePR} />}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ==================== SCREEN 3: LIBRARY CATALOG ==================== */}
          {currentView === 'library' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full animate-fade-in font-sans text-left">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FolderOpen size={20} className="text-[#8ab4f8]" />
                    <span>我的提示库 (Library)</span>
                  </h2>
                  <p className="text-xs text-neutral-400">
                    管理、排序并回溯此前在本地沙盒微服务端运行成功的所有需求交付记录。
                  </p>
                </div>

                <div className="relative w-full sm:w-64 shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜寻历史逻辑需求..."
                    className="w-full bg-[#1e1f20] text-xs text-white pl-9 pr-4 py-2 rounded-lg border border-white/5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="p-12 text-center bg-[#1e1f20] rounded-xl border border-white/5 max-w-md mx-auto space-y-4">
                  <BookOpen size={36} className="mx-auto text-neutral-600 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">库内空空如也</h4>
                    <p className="text-xs text-neutral-400">您目前尚未在沙盒中进行自主运行提报。一键回到主页探寻经典场景！</p>
                  </div>
                  <button
                    onClick={() => setCurrentView('home')}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all"
                  >
                    返回主页门户
                  </button>
                </div>
              ) : (
                <div className="bg-[#1e1f20] border border-white/5 rounded-xl overflow-hidden divide-y divide-white/10 shadow">
                  <div className="grid grid-cols-12 gap-2 text-[10px] text-neutral-400 font-bold uppercase tracking-wider p-3 px-4 bg-white/5">
                    <div className="col-span-6 font-semibold">需求及说明</div>
                    <div className="col-span-2 font-semibold">耗用 Token</div>
                    <div className="col-span-2 font-semibold">跑测结果</div>
                    <div className="col-span-2 font-semibold text-right">交付时间</div>
                  </div>

                  {filteredHistory.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        handleRestoreHistory(item.id);
                        setCurrentView('playground');
                      }}
                      className="grid grid-cols-12 gap-2 p-3.5 px-4 bg-transparent hover:bg-white/5 cursor-pointer text-xs items-center transition-all text-neutral-200"
                    >
                      <div className="col-span-6 font-semibold text-white truncate pr-4" title={item.requirementText}>
                        {item.requirementText}
                      </div>
                      <div className="col-span-2 font-mono text-blue-400 font-bold">
                        {item.totalTokens.toLocaleString()}
                      </div>
                      <div className="col-span-2">
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase
                          ${item.status === 'completed' 
                            ? 'bg-emerald-500/10 text-[#63e2b7] border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/10'}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="col-span-2 font-mono text-neutral-500 text-right">
                        {item.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== SCREEN 4: MODEL TUNING WORKROOM ==================== */}
          {currentView === 'tuning' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full animate-fade-in font-sans text-left">
              <div className="border-b border-white/5 pb-4 space-y-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-purple-400" />
                  <span>大微服务大模型增量微调 (Model Tuning Sandbox)</span>
                </h2>
                <p className="text-xs text-neutral-400">
                  使用您团队在本地提交和成功合并的历史PR和交付代码，针对大模型进行微调增量蒸馏，训练出独属于您微服务业务线专属的模型。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Configuration side panel */}
                <div className="bg-[#1e1f20] border border-white/5 rounded-xl p-4 md:p-5 space-y-4">
                  <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-widest">
                    微调参数配置 (Tuning Hyperparams)
                  </h3>

                  {/* Tuning model alias name */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400 font-bold">微调输出模型别名</label>
                    <input
                      type="text"
                      value={tuningModelName}
                      onChange={(e) => setTuningModelName(e.target.value)}
                      disabled={tuningStatus === 'running'}
                      className="w-full bg-[#131314] text-xs font-mono text-white p-2.5 rounded-lg border border-white/5 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Base model select */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400 font-bold">基础骨架大模型 (Base Model)</label>
                    <select
                      disabled={tuningStatus === 'running'}
                      className="w-full bg-[#131314] text-xs font-mono text-neutral-300 p-2.5 rounded-lg border border-white/5"
                    >
                      <option>gemini-1.5-pro (Recommended)</option>
                      <option>gemini-1.5-flash</option>
                      <option>gemini-2.0-flash</option>
                    </select>
                  </div>

                  {/* Epochs slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-neutral-400 font-bold">训练周期 epochs</span>
                      <span className="text-purple-400 font-mono font-bold">{tuningEpochs}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      disabled={tuningStatus === 'running'}
                      value={tuningEpochs}
                      onChange={(e) => setTuningEpochs(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-700 accent-purple-500 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Learning rate select */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400 font-bold">学习率 multiplier (Learning Rate)</label>
                    <select
                      value={tuningLearningRate}
                      disabled={tuningStatus === 'running'}
                      onChange={(e) => setTuningLearningRate(parseFloat(e.target.value))}
                      className="w-full bg-[#131114] text-xs font-mono text-neutral-300 p-2.5 rounded-lg border border-white/5"
                    >
                      <option value={0.0001}>0.0001</option>
                      <option value={0.001}>0.001 (默认)</option>
                      <option value={0.01}>0.01</option>
                    </select>
                  </div>

                  <button
                    onClick={startTuningSimulation}
                    disabled={tuningStatus === 'running'}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs disabled:opacity-40 transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play size={12} />
                    <span>{tuningStatus === 'running' ? '微调训练中...' : '提交增量并启动微调'}</span>
                  </button>
                </div>

                {/* Training status workspace monitors */}
                <div className="md:col-span-2 bg-[#1e1f20] border border-white/5 rounded-xl p-4 md:p-6 space-y-6 flex flex-col justify-between">
                  {/* Status header dashboard */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-neutral-500 font-mono block">MONITORING CONSOLE</span>
                      <h4 className="text-sm font-bold text-white">微调控制舱 (Tuning Status Room)</h4>
                    </div>

                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border
                      ${tuningStatus === 'idle' 
                        ? 'bg-neutral-800 text-neutral-400 border-white/5' 
                        : tuningStatus === 'running'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {tuningStatus === 'idle' && '● 未启动 (IDLE)'}
                      {tuningStatus === 'running' && '● 核心计算蒸馏中 (TRAINING)'}
                      {tuningStatus === 'completed' && '✓ 微调完成已交付 (COMPLETED)'}
                    </span>
                  </div>

                  <div className="flex-1 py-4 flex flex-col justify-center space-y-6">
                    {tuningStatus === 'idle' ? (
                      <div className="text-center p-8 space-y-3">
                        <Sliders size={32} className="mx-auto text-neutral-600" />
                        <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                          调整左侧配置项并点击启动。本微调机制在 Google AI Studio 经典闭环微调逻辑之上的模拟运行，能够协助研发更好的理解特定交付业务大模型背后的蒸馏逻辑。
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Dynamic Progress indicator */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-neutral-400 font-mono">
                            <span>计算 Epoch 迭代进度</span>
                            <span className="text-purple-400 font-bold">{tuningProgress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-purple-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${tuningProgress}%` }}
                            />
                          </div>
                        </div>

                        {/* Interactive Loss Chart graph drawing via standard clean custom SVG */}
                        <div className="space-y-2">
                          <span className="text-[11px] text-neutral-400 block font-semibold">Tuning Loss 收敛折线图 (损失度越低性能越优)</span>
                          <div className="h-44 bg-[#131114] border border-white/5 rounded-xl relative p-3 flex flex-col justify-between">
                            
                            {/* SVG chart line */}
                            <svg className="w-full h-full text-purple-500">
                              {tuningLoss.length > 1 && (
                                <path
                                  d={tuningLoss.map((val, idx) => {
                                    const x = (idx / (tuningLoss.length - 1)) * 100; // percent width
                                    // Val is ~ 0.04 to 0.8. Map to height. Y needs spacing reversed.
                                    const y = 100 - ((val / 0.9) * 90);
                                    return `${idx === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                                  }).join(' ')}
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  className="transition-all duration-200"
                                />
                              )}
                            </svg>

                            {/* Chart Labels overlays */}
                            <div className="absolute top-2 left-3 text-[8px] font-mono text-neutral-500 flex flex-col">
                              <span>Max Loss: 0.8 (初始化推导)</span>
                            </div>
                            <div className="absolute bottom-2 right-3 text-[8px] font-mono text-neutral-500 flex flex-col text-right">
                              <span>Min Loss: {tuningLoss.length > 0 ? tuningLoss[tuningLoss.length - 1].toFixed(4) : '0.000'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary card bottom */}
                  {tuningStatus === 'completed' && (
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-[#63e2b7] font-semibold leading-relaxed animate-fade-in text-left flex gap-2">
                      <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
                      <div>
                        <span>微调成功！专属大微服务适配器 {tuningModelName} 已编译并成功注入超级个体 AI 架构中。</span>
                        <p className="text-neutral-500 font-mono text-[9px] mt-0.5">适配模型训练总汇耗用 45,120 枚沙盒代币，可用于下次进行无偏回归开发。</p>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

          {/* ==================== SCREEN 5: PROMPT GALLERIES ==================== */}
          {currentView === 'gallery' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full animate-fade-in font-sans text-left">
              <div className="border-b border-white/5 pb-4 space-y-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <LayoutGrid size={20} className="text-[#a8c7fa]" />
                  <span>内置优秀提示词模版 (Prompt Gallery)</span>
                </h2>
                <p className="text-xs text-neutral-400">
                  点击以下微服务典型交付模版以查看系统澄清演化、高保真 diff 注入及自动化断言校验。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SCENARIOS.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleLaunchScenarioDirectly(item.id)}
                    className="p-5 rounded-xl border border-white/5 bg-[#1e1f20] hover:border-blue-500/40 hover:scale-[1.01] cursor-pointer transition-all duration-300 flex flex-col justify-between text-left space-y-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[9px] text-[#a8c7fa] font-mono font-bold tracking-wider">
                        <span>MODEL SCENARIO</span>
                        <span>DEFAULT PRESET</span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        需求文本：「{item.requirement}」
                      </p>
                    </div>
                    
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Supports select clear options
                      </span>
                      <span className="text-xs text-blue-400 font-bold group-hover:underline">
                        导入交付 ➔
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
