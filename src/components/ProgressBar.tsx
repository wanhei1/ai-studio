/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2, CheckCircle, XCircle, Play, Sparkles } from 'lucide-react';
import { StageStatus } from '../types';

interface ProgressBarProps {
  stages: StageStatus[];
  currentStageId?: string | null;
}

export default function ProgressBar({ stages, currentStageId }: ProgressBarProps) {
  return (
    <div className="bg-neutral-50 p-4 border border-neutral-200/80 rounded-lg space-y-4">
      {/* Stage Flow Chart */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {stages.map((stage, idx) => {
          const isActive = stage.id === currentStageId;
          const isCompleted = stage.status === 'completed';
          const isRunning = stage.status === 'running';
          const isFailed = stage.status === 'failed';
          
          let statusColor = 'border-neutral-200 text-neutral-400';
          let bgColor = 'bg-white';
          let textColor = 'text-neutral-400';
          
          if (isActive || isRunning) {
            statusColor = 'border-neutral-950 text-white';
            bgColor = 'bg-neutral-900';
            textColor = 'text-white font-semibold';
          } else if (isCompleted) {
            statusColor = 'border-emerald-200 text-emerald-600';
            bgColor = 'bg-emerald-50';
            textColor = 'text-emerald-800';
          } else if (isFailed) {
            statusColor = 'border-rose-200 text-rose-600';
            bgColor = 'bg-rose-50';
            textColor = 'text-rose-850';
          }

          return (
            <div
              key={stage.id}
              id={`stage-${stage.id}`}
              className={`relative flex flex-col items-center justify-between p-3 rounded-lg border ${statusColor} ${bgColor} transition-all duration-300`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className={`text-[10px] font-mono ${isActive ? 'text-neutral-400' : 'text-neutral-400'}`}>0{idx + 1}</span>
                {isRunning && <Loader2 size={13} className={`animate-spin ${isActive ? 'text-white' : 'text-neutral-900'}`} />}
                {isCompleted && <CheckCircle size={13} className="text-emerald-600" />}
                {isFailed && <XCircle size={13} className="text-rose-600" />}
                {!isRunning && !isCompleted && !isFailed && <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />}
              </div>
              <div className="text-center">
                <p className={`text-[10px] sm:text-xs ${textColor} break-keep font-medium`}>{stage.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail message banner */}
      {currentStageId && (
        <div id="stage-message-banner" className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-neutral-200 border-l-2 border-l-neutral-900">
          <Sparkles size={16} className="text-neutral-700 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-neutral-900 uppercase tracking-widest font-mono">
              {stages.find(s => s.id === currentStageId)?.label}
            </span>
            <p className="text-xs text-neutral-600">
              {stages.find(s => s.id === currentStageId)?.message || 'Agent 正在全力推进步骤流程，请稍候...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
