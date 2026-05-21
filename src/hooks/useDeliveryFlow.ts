/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { ChatMessage, StageStatus, StageName, FileChange, TestSuiteResult, PullRequestInfo, RequirementHistory } from '../types';
import { SCENARIOS, Scenario } from '../data/scenarios';

// Initial default blank stages
export const createDefaultStages = (): StageStatus[] => [
  { id: 'clarify', label: '需求澄清', status: 'idle', message: '等待流程启动...' },
  { id: 'decompose', label: '方案拆解', status: 'idle', message: '等待流程启动...' },
  { id: 'locate', label: '模块定位', status: 'idle', message: '等待流程启动...' },
  { id: 'codegen', label: '代码生成', status: 'idle', message: '等待流程启动...' },
  { id: 'testing', label: '自动化测试', status: 'idle', message: '等待流程启动...' },
  { id: 'pr_submit', label: '提交 PR', status: 'idle', message: '等待流程启动...' },
];

export function useDeliveryFlow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeStageId, setActiveStageId] = useState<StageName | null>(null);
  const [activeCodeChanges, setActiveCodeChanges] = useState<FileChange[]>([]);
  const [activeTestSuiteResult, setActiveTestSuiteResult] = useState<TestSuiteResult | undefined>(undefined);
  const [activePR, setActivePR] = useState<PullRequestInfo | undefined>(undefined);
  const [historyList, setHistoryList] = useState<RequirementHistory[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | undefined>(undefined);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionTokensUsed, setSessionTokensUsed] = useState(0);
  const [globalTokensUsed, setGlobalTokensUsed] = useState(0);

  // Active scenario identifier tracking
  const currentScenarioRef = useRef<Scenario | null>(null);
  const currentAIResponseRef = useRef<string | null>(null);

  // Load initial history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('delivery_platform_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistoryList(parsed);
          const totalPastTokens = parsed.reduce((sum, item) => sum + item.totalTokens, 0);
          setGlobalTokensUsed(totalPastTokens);
        }
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  // Save history helper
  const saveHistory = (newHistory: RequirementHistory[]) => {
    setHistoryList(newHistory);
    try {
      localStorage.setItem('delivery_platform_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  // Helper to format timestamps
  const getFormattedTime = () => {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
  };

  /**
   * Reset / Clear state for a new clean requirements session
   */
  const handleNewRequirement = () => {
    const d = new Date();
    const formattedTime = d.toTimeString().split(' ')[0];
    setMessages([
      {
        id: `system-new-${Date.now()}`,
        sender: 'system',
        content: '已开启新会话，请输入需求',
        timestamp: formattedTime
      }
    ]);
    setActiveStageId(null);
    setActiveCodeChanges([]);
    setActiveTestSuiteResult(undefined);
    setActivePR(undefined);
    setActiveHistoryId(undefined);
    setIsProcessing(false);
    currentScenarioRef.current = null;
    currentAIResponseRef.current = null;
  };

  /**
   * Start the delivery flow with a requirement prompt
   */
  const submitRequirement = async (text: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setActiveHistoryId(undefined);

    // 1. Create PM message
    const pmMessageId = `pm-${Date.now()}`;
    const pmMessage: ChatMessage = {
      id: pmMessageId,
      sender: 'pm',
      content: text,
      timestamp: getFormattedTime()
    };

    // 2. Identify best scenario or create dynamic fallback scenario
    let selectedScenario = SCENARIOS.find(s => 
      text.toLowerCase().includes(s.name.toLowerCase()) || 
      text.toLowerCase().includes(s.requirement.toLowerCase()) ||
      s.requirement.toLowerCase().split(' ').some(word => word.length > 2 && text.toLowerCase().includes(word))
    );

    // If no perfect match found, bind to a randomized scenario to guarantee excellent UX!
    if (!selectedScenario) {
      // Find matching index or default to view-count icon
      const matchingTagIndex = text.includes('隐私') || text.includes('GDPR') 
        ? 1 
        : text.includes('CSV') || text.includes('导出') 
          ? 2 
          : 0;
      selectedScenario = SCENARIOS[matchingTagIndex];
    }

    currentScenarioRef.current = selectedScenario;

    // 3. Setup initial stages
    const initialStages = createDefaultStages();
    initialStages[0].status = 'running';
    initialStages[0].message = '正在解析匹配系统模块并推演核心依赖...';

    // 4. Create initial AI response which will stall at 'clarify' stage with intervention
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      sender: 'ai',
      content: `系统已收到需求并分发到交付引擎协作：\n需求文本：「${text}」\n\n我正在进行静态模型依赖审计并在下表启动交付工作...`,
      timestamp: getFormattedTime(),
      stages: initialStages,
      currentStageId: 'clarify',
      intervention: selectedScenario.intervention,
      interventionAnswered: false
    };

    setMessages([pmMessage, aiMessage]);
    setActiveStageId('clarify');
    setActiveCodeChanges([]);
    setActiveTestSuiteResult(undefined);
    setActivePR(undefined);
  };

  /**
   * Process the user's intervention choice & simulate remaining development stages
   */
  const submitInterventionOfAI = async (answerText: string) => {
    const activeAIIndex = messages.findIndex(m => m.sender === 'ai' && m.intervention && !m.interventionAnswered);
    if (activeAIIndex === -1 || !currentScenarioRef.current) return;

    const copyMessages = [...messages];
    const targetAIMsg = { ...copyMessages[activeAIIndex] };

    // Record answered state
    targetAIMsg.interventionAnswered = true;

    // Create a PM clarification response message bubble in thread
    const pmClarification: ChatMessage = {
      id: `pm-clarify-${Date.now()}`,
      sender: 'pm',
      content: `方案决策确认：${answerText}`,
      timestamp: getFormattedTime()
    };

    // Find custom preset corresponding to user choice
    // If user typed custom text, fallback to the first option to ensure functional preview
    const scenario = currentScenarioRef.current;
    const matchedResponse = scenario.interventionResponses[answerText] || Object.values(scenario.interventionResponses)[0];

    // Create next AI Message that triggers progression based on choices
    const nextAIMessageId = `ai-step-${Date.now()}`;
    
    // Set stage status for Stage 1 (Clarify) as Completed
    const currentStages = targetAIMsg.stages ? [...targetAIMsg.stages] : createDefaultStages();
    currentStages[0].status = 'completed';
    currentStages[0].message = matchedResponse.stages.clarify.msg;

    // Build the progressive AI message container structure
    const updatedAIMessage: ChatMessage = {
      id: nextAIMessageId,
      sender: 'ai',
      content: matchedResponse.aiMessage,
      timestamp: getFormattedTime(),
      stages: currentStages,
      currentStageId: 'decompose',
      tokenStats: { prompt: 100, completion: 50, total: 150 } // temporary stats for preview
    };

    // Update messages array
    setMessages([...copyMessages, pmClarification, updatedAIMessage]);
    setActiveStageId('decompose');

    // Begin Simulated Progression of developer stages (SSE simulator mockup)
    // In a real fullstack SSE setup, you would fetch:
    // fetch(`/api/delivery/subscribe/${requestId}`) and stream events which updates these hooks reactively.
    simulateRemainingStages(nextAIMessageId, matchedResponse);
  };

  /**
   * SSE Simulated developmental ticks
   */
  const simulateRemainingStages = async (aiMsgId: string, matchedResponse: any) => {
    const stageSequence: StageName[] = ['decompose', 'locate', 'codegen', 'testing', 'pr_submit'];
    const delays: { [key in StageName]: number } = {
      clarify: 1000,
      decompose: 1500,
      locate: 1500,
      codegen: 2500,
      testing: 2500,
      pr_submit: 1500
    };

    let currentMessages = [...messages];

    for (let i = 0; i < stageSequence.length; i++) {
      const currentStage = stageSequence[i];
      const nextStage = stageSequence[i + 1] || null;

      // Wait delay
      await new Promise(resolve => setTimeout(resolve, delays[currentStage]));

      setMessages(prev => {
        const msgCopy = [...prev];
        const targetAIElemIdx = msgCopy.findIndex(m => m.id === aiMsgId);
        if (targetAIElemIdx === -1) return prev;

        const aiElement = { ...msgCopy[targetAIElemIdx] };
        const stageStatus = aiElement.stages ? [...aiElement.stages] : createDefaultStages();

        // 1. Complete current stage
        const stageIdx = stageStatus.findIndex(s => s.id === currentStage);
        if (stageIdx !== -1) {
          stageStatus[stageIdx].status = 'completed';
          stageStatus[stageIdx].message = matchedResponse.stages[currentStage].msg;
        }

        // 2. Setup next stage status
        if (nextStage) {
          const nextIdx = stageStatus.findIndex(s => s.id === nextStage);
          if (nextIdx !== -1) {
            stageStatus[nextIdx].status = 'running';
            stageStatus[nextIdx].message = getRunningStatusMessage(nextStage);
          }
          aiElement.currentStageId = nextStage;
          setActiveStageId(nextStage);
        } else {
          // Finished the final stage! Create final outcomes.
          aiElement.currentStageId = null;
          setActiveStageId(null);
          setIsProcessing(false);

          // Mount values to core state
          setActiveCodeChanges(matchedResponse.codeChanges);
          setActiveTestSuiteResult(matchedResponse.tests);
          setActivePR(matchedResponse.pr);

          // Generate active mock tokens between 500 and 2000
          const randomTokens = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;

          // Populate completed entities onto AI message for self-contained archive restoration
          aiElement.codeChanges = matchedResponse.codeChanges;
          aiElement.testSuiteResult = matchedResponse.tests;
          aiElement.pr = matchedResponse.pr;
          aiElement.tokenStats = {
            prompt: Math.floor(randomTokens * 0.3),
            completion: Math.floor(randomTokens * 0.7),
            total: randomTokens
          };

          // Adjust tokens metrics (accumulation)
          setSessionTokensUsed(prevSession => prevSession + randomTokens);
          setGlobalTokensUsed(prevGlobal => prevGlobal + randomTokens);

          // Append to persistent History index
          const newHistoryItem: RequirementHistory = {
            id: `hist-${Date.now()}`,
            requirementText: currentScenarioRef.current?.requirement || '新增功能需求',
            status: 'completed',
            timestamp: getFormattedTime(),
            totalTokens: randomTokens,
            messages: [...msgCopy.filter(m => m.id !== aiMsgId), aiElement]
          };

          // Save history list
          const updatedHistoryList = [newHistoryItem, ...historyList].slice(0, 10);
          setHistoryList(updatedHistoryList);
          try {
            localStorage.setItem('delivery_platform_history', JSON.stringify(updatedHistoryList));
          } catch (e) {
            console.error('History save failure', e);
          }
        }

        // Live populate deliverables side panel as the stages tick by
        if (currentStage === 'locate') {
          // File lists start loading
          setActiveCodeChanges(matchedResponse.codeChanges.map((c: any) => ({ ...c, diffContent: '...正在定位匹配内容...' })));
        } else if (currentStage === 'codegen') {
          // Diff codes load!
          setActiveCodeChanges(matchedResponse.codeChanges);
        } else if (currentStage === 'testing') {
          // Testing gets populated
          setActiveTestSuiteResult({
            passedCount: 0,
            failedCount: 0,
            totalCount: matchedResponse.tests.totalCount,
            status: 'running',
            details: ['[INIT] Running node runners...', matchedResponse.tests.details[0]]
          });
        }

        if (currentStage === 'testing') {
          setActiveTestSuiteResult(matchedResponse.tests);
        }

        if (currentStage === 'pr_submit') {
          setActivePR(matchedResponse.pr);
        }

        aiElement.stages = stageStatus;
        msgCopy[targetAIElemIdx] = aiElement;
        return msgCopy;
      });
    }
  };

  /**
   * Restore previous completed requirements directly from History metrics
   */
  const handleRestoreHistory = (historyId: string) => {
    const historicalRun = historyList.find(h => h.id === historyId);
    if (!historicalRun) return;

    setActiveHistoryId(historyId);
    setMessages(historicalRun.messages);
    
    // Find the final assistant message containing deliverable metrics
    const finalAssistantMsg = [...historicalRun.messages].reverse().find(m => m.sender === 'ai' && m.codeChanges);
    if (finalAssistantMsg) {
      setActiveStageId(null);
      setActiveCodeChanges(finalAssistantMsg.codeChanges || []);
      setActiveTestSuiteResult(finalAssistantMsg.testSuiteResult);
      setActivePR(finalAssistantMsg.pr);
      if (finalAssistantMsg.tokenStats) {
        setSessionTokensUsed(finalAssistantMsg.tokenStats.total);
      }
    }
  };

  // Status helper mapping
  const getRunningStatusMessage = (stage: StageName): string => {
    switch (stage) {
      case 'decompose': return '正在拆解修改方案，梳理组件依赖并重组代码结构...';
      case 'locate': return '正在静态匹配搜寻最佳修改文件节点...';
      case 'codegen': return '正在调用交付模型并注入最佳代码 diff 属性...';
      case 'testing': return '正在启动测试沙盒并拉起 Jest 自动化覆盖率验证...';
      case 'pr_submit': return '所有断言均全部通过！正在进行 Git 分支合并并提交 PR 单...';
      default: return '正在全力处理流程状态...';
    }
  };

  return {
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
  };
}
