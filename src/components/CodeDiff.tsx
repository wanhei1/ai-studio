/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileCode, Play, ChevronDown, ChevronRight, PlusCircle, MinusCircle } from 'lucide-react';
import { FileChange } from '../types';

interface CodeDiffProps {
  files: FileChange[];
}

export default function CodeDiff({ files }: CodeDiffProps) {
  const [expandedFileIdx, setExpandedFileIdx] = useState<number | null>(0); // Expand first file by default

  const toggleExpand = (idx: number) => {
    setExpandedFileIdx(expandedFileIdx === idx ? null : idx);
  };

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50/50">
        <FileCode size={36} className="text-neutral-400 mb-3" />
        <p className="text-xs text-neutral-600 font-medium font-sans">暂无代码变更数据展示</p>
        <p className="text-[10px] text-neutral-500 mt-1 max-w-xs leading-normal">在左侧提出需求并在 AI 进行到“代码生成”阶段时，变更文件将实时呈现在此处</p>
      </div>
    );
  }

  // Calculate stats
  const totalFiles = files.length;
  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <div className="space-y-4">
      {/* Overview Stat Pill */}
      <div className="flex items-center justify-between p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 font-mono text-xs text-neutral-600">
        <span>变更文件：<strong className="text-neutral-900 font-bold">{totalFiles}</strong> 个</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-700">
            <PlusCircle size={12} />
            <span className="font-semibold">+{totalAdditions} 行</span>
          </span>
          <span className="flex items-center gap-1 text-rose-700">
            <MinusCircle size={12} />
            <span className="font-semibold">-{totalDeletions} 行</span>
          </span>
        </div>
      </div>

      {/* File List Accumulator Accordion */}
      <div className="space-y-2.5">
        {files.map((file, idx) => {
          const isExpanded = expandedFileIdx === idx;
          const actionColors = {
            create: 'text-emerald-700 bg-emerald-50 border-emerald-200',
            modify: 'text-blue-700 bg-blue-50 border-blue-200',
            delete: 'text-rose-700 bg-rose-50 border-rose-200'
          };
          
          return (
            <div
              key={file.path}
              id={`file-change-${file.path.replace(/\//g, '_')}`}
              className="border border-neutral-200 bg-white rounded-lg overflow-hidden transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => toggleExpand(idx)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {isExpanded ? <ChevronDown size={14} className="text-neutral-800" /> : <ChevronRight size={14} className="text-neutral-405" />}
                  <FileCode size={15} className="text-neutral-800 shrink-0" />
                  <span className="text-xs font-mono font-bold truncate text-neutral-900" title={file.path}>
                    {file.path}
                  </span>
                </div>
                
                <div className="flex items-center gap-2.5 font-mono text-[10px] shrink-0">
                  <span className={`px-2 py-0.5 rounded border text-[9px] uppercase font-bold tracking-wider ${actionColors[file.action]}`}>
                    {file.action === 'create' ? '新增' : file.action === 'modify' ? '修改' : '删除'}
                  </span>
                  <div className="flex items-center gap-1.5 text-neutral-500 font-semibold bg-neutral-100 px-2 py-0.5 rounded">
                    <span className="text-emerald-600">+{file.additions}</span>
                    <span className="text-neutral-300">/</span>
                    <span className="text-rose-600">-{file.deletions}</span>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-neutral-200">
                  <div className="bg-neutral-950 p-3 overflow-x-auto font-mono text-[11px] leading-relaxed max-h-[350px] overflow-y-auto">
                    {file.diffContent.split('\n').map((line, lineIdx) => {
                      const isAddition = line.startsWith('+') && !line.startsWith('+++');
                      const isDeletion = line.startsWith('-') && !line.startsWith('---');
                      const isMeta = line.startsWith('@@') || line.startsWith('diff') || line.startsWith('---') || line.startsWith('+++');
                      
                      let lineClass = 'text-[#A0A0A0]';
                      let lineBg = 'hover:bg-neutral-900/60';
                      
                      if (isAddition) {
                        lineClass = 'text-emerald-300 font-medium';
                        lineBg = 'bg-emerald-950/40 hover:bg-emerald-950/60 border-l-[3px] border-emerald-500';
                      } else if (isDeletion) {
                        lineClass = 'text-rose-300 line-through';
                        lineBg = 'bg-rose-950/30 hover:bg-rose-950/50 border-l-[3px] border-rose-500';
                      } else if (isMeta) {
                        lineClass = 'text-cyan-400 font-semibold';
                        lineBg = 'bg-neutral-900';
                      }

                      return (
                        <div key={lineIdx} className={`whitespace-pre px-2.5 py-0.5 ${lineBg} ${lineClass}`}>
                          {line}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
