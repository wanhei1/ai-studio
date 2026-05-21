/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, ShieldAlert, Loader2, PlayCircle, Layers } from 'lucide-react';
import { TestSuiteResult } from '../types';

interface TestResultProps {
  testSuite?: TestSuiteResult;
}

export default function TestResult({ testSuite }: TestResultProps) {
  if (!testSuite || testSuite.status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50/50">
        <PlayCircle size={36} className="text-neutral-400 mb-3" />
        <p className="text-xs text-neutral-600 font-medium">暂无测试用例运行状态</p>
        <p className="text-[10px] text-neutral-550 mt-1 max-w-xs leading-normal">代码合并后，AI 将自动调起 Jest & Cypress 核心验证套件并在此处输出覆盖率</p>
      </div>
    );
  }

  const isRunning = testSuite.status === 'running';
  const isPassed = testSuite.status === 'passed';
  const isFailed = testSuite.status === 'failed';

  return (
    <div className="space-y-4 font-sans">
      {/* Test Execution Title Banner */}
      <div className={`p-4 rounded-lg border flex items-center justify-between transition-all duration-300 ${
        isRunning 
          ? 'bg-blue-50 border-blue-200' 
          : isPassed 
            ? 'bg-emerald-50 border-emerald-200/80 shadow-[0_1px_3px_rgba(16,185,129,0.02)]' 
            : 'bg-rose-50 border-rose-200/80 shadow-[0_1px_3px_rgba(239,68,68,0.02)]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isRunning 
              ? 'bg-blue-100 text-blue-700' 
              : isPassed 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-rose-100 text-rose-700'
          }`}>
            {isRunning && <Loader2 size={16} className="animate-spin" />}
            {isPassed && <ShieldCheck size={16} />}
            {isFailed && <ShieldAlert size={16} />}
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-neutral-900 uppercase font-mono tracking-wider">
              {isRunning ? '自动化回归测试中...' : isPassed ? '核心测试覆盖完全通过' : '测试报告阻断警告'}
            </h4>
            <p className="text-[10px] text-neutral-500 font-medium">
              {isRunning 
                ? '正在扫描边界注入与状态响应，请稍候...' 
                : isPassed 
                  ? '所有单元与端到端回归用例完成率 100%' 
                  : '用例执行遭遇断言未包含的情况'
              }
            </p>
          </div>
        </div>
        
        <div className="text-right font-mono">
          <span className={`text-sm font-bold ${isPassed ? 'text-emerald-700' : isFailed ? 'text-rose-700' : 'text-blue-700'}`}>
            {testSuite.passedCount}
          </span>
          <span className="text-[10px] text-neutral-500 font-semibold"> / {testSuite.totalCount} Passed</span>
        </div>
      </div>

      {/* Console/Assertions log */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <Layers size={11} className="text-neutral-700" />
          <span className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider">Jest & Vitest 执行日志流</span>
        </div>
        
        <div className="bg-[#0F0F0F] border border-neutral-200 rounded-lg p-3.5 font-mono text-xs text-[#E0E0E0] max-h-[220px] overflow-y-auto space-y-1.5">
          {testSuite.details.map((log, index) => {
            const isSucceed = log.includes('✓') || log.includes('Passed') || log.includes('passed');
            return (
              <div 
                key={index} 
                className={`py-0.5 px-1.5 rounded text-[11px] ${
                  isSucceed 
                    ? 'text-emerald-400 bg-emerald-950/20' 
                    : log.includes('✕') || log.includes('failed') || log.includes('Failed')
                      ? 'text-rose-400 bg-rose-950/40 font-semibold'
                      : 'text-neutral-400'
                }`}
              >
                {log}
              </div>
            );
          })}
          {isRunning && (
            <div className="flex items-center gap-2 text-[11px] text-blue-400 animate-pulse py-1 pl-1">
              <Loader2 size={12} className="animate-spin" />
              <span>[RUNNING] Spawning virtual nodes, parsing test files...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
