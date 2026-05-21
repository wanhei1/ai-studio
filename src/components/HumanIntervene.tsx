/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, Send, Check, ShieldAlert } from 'lucide-react';
import { InterventionConfig } from '../types';

interface HumanInterveneProps {
  intervention: InterventionConfig;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
}

export default function HumanIntervene({ intervention, onSubmit, onSkip }: HumanInterveneProps) {
  const [typedAnswer, setTypedAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAnswer = selectedOption || typedAnswer;
    if (finalAnswer.trim()) {
      onSubmit(finalAnswer);
      setTypedAnswer('');
      setSelectedOption(null);
    }
  };

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    onSubmit(option); // Instant trigger for smooth simulation progression!
  };

  return (
    <div id="intervention-panel" className="mt-4 p-5 bg-white border-2 border-neutral-950 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.03)] relative overflow-hidden animate-fade-in font-sans">
      {/* Visual background ambient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-950" />
      
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-neutral-100 text-neutral-905 shrink-0 mt-0.5">
          <HelpCircle size={18} />
        </div>
        
        <div className="space-y-4 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-white tracking-wider uppercase bg-neutral-900 px-2 py-0.5 rounded">
                人工介入确认 REQUIRED
              </span>
              <span className="text-xs text-neutral-500">PM 方案指导回复洞察</span>
            </div>
            <p className="text-sm font-medium text-neutral-900 leading-relaxed font-serif">
              {intervention.question}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {intervention.options && intervention.options.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-neutral-400 uppercase font-mono block">候选决策选项：(点击立即可触发下一步骤并运行代理)</span>
                <div className="grid grid-cols-1 gap-2">
                  {intervention.options.map((option) => (
                    <button
                      key={option}
                      id={`opt-${option}`}
                      type="button"
                      onClick={() => handleOptionClick(option)}
                      className="text-left w-full p-2.5 rounded-lg text-xs bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-900 text-neutral-800 transition-all shadow-sm flex items-center justify-between cursor-pointer"
                    >
                      <span>{option}</span>
                      <Check size={12} className="text-emerald-600 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[10px] text-neutral-450 uppercase font-mono block">或自定义输入细节补充：</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => {
                    setTypedAnswer(e.target.value);
                    setSelectedOption(null);
                  }}
                  placeholder={intervention.placeholder || '输入细化需求、澄清策略等...'}
                  className="flex-1 px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 focus:border-neutral-905 outline-none rounded-lg text-neutral-900"
                />
                <button
                  type="submit"
                  disabled={!typedAnswer.trim()}
                  className="px-4 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs text-white font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send size={12} />
                  <span>提交决策</span>
                </button>
              </div>
            </div>
          </form>

          {onSkip && (
            <div className="flex justify-end pt-2 border-t border-black/5">
              <button
                type="button"
                onClick={onSkip}
                className="text-xs text-neutral-500 hover:text-neutral-905 transition-colors hover:underline"
              >
                跳过人工确认，采用 AI 默认推荐默认方案 ❯
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
