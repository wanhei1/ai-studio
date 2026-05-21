/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { History, CheckCircle2, AlertTriangle, Play, Flame } from 'lucide-react';
import { RequirementHistory } from '../types';

interface HistoryPanelProps {
  historyList: RequirementHistory[];
  activeHistoryId?: string;
  onRestoreHistory: (historyId: string) => void;
}

export default function HistoryPanel({ historyList, activeHistoryId, onRestoreHistory }: HistoryPanelProps) {
  if (historyList.length === 0) {
    return (
      <div className="p-4 text-center bg-[#131114] border border-white/5 rounded-xl font-sans">
        <History size={18} className="mx-auto text-neutral-600 mb-1.5" />
        <span className="text-[11px] text-neutral-500">暂无历史提交记录</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 font-sans">
      <div className="flex items-center gap-1.5 px-0.5">
        <History size={13} className="text-blue-400" />
        <span className="text-[10px] text-neutral-400 font-bold tracking-wider font-sans uppercase">
          交付历史归档 (最近 {historyList.length} 条)
        </span>
      </div>

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {historyList.map((item) => {
          const isActive = item.id === activeHistoryId;
          const statusConfig = {
            completed: {
              icon: CheckCircle2,
              color: 'text-emerald-400 bg-emerald-500/10',
              borderColor: 'border-emerald-500/15'
            },
            running: {
              icon: Flame,
              color: 'text-orange-400 bg-orange-500/10 animate-pulse',
              borderColor: 'border-orange-500/20'
            },
            failed: {
              icon: AlertTriangle,
              color: 'text-rose-400 bg-rose-500/10',
              borderColor: 'border-rose-500/15'
            },
            interrupted: {
              icon: AlertTriangle,
              color: 'text-neutral-400 bg-neutral-500/10',
              borderColor: 'border-white/5'
            }
          };

          const config = statusConfig[item.status] || statusConfig.interrupted;
          const StatusIcon = config.icon;

          return (
            <div
              key={item.id}
              id={`history-item-${item.id}`}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                isActive 
                  ? 'bg-[#2d2f31] border-blue-500/40 shadow-sm' 
                  : 'bg-[#131114] border-white/5 hover:border-white/10'
              }`}
              onClick={() => onRestoreHistory(item.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5 overflow-hidden flex-1">
                  <p className="text-xs font-semibold text-neutral-200 truncate pr-1" title={item.requirementText}>
                    {item.requirementText}
                  </p>
                  <div className="flex items-center gap-2 font-mono text-[9px] text-neutral-500">
                    <span>{item.timestamp}</span>
                    <span className="h-1 w-1 rounded-full bg-neutral-700" />
                    <span>Tokens: <strong className="text-blue-400">{item.totalTokens.toLocaleString()}</strong></span>
                  </div>
                </div>

                <div className={`p-1 rounded-md ${config.color} border ${config.borderColor} shrink-0`}>
                  <StatusIcon size={11} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
