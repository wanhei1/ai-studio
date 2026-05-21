/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GitPullRequest, ExternalLink, CheckCircle, Clock, Copy, GitBranch, Terminal } from 'lucide-react';
import { PullRequestInfo } from '../types';

interface PRInfoProps {
  pr?: PullRequestInfo;
}

export default function PRInfo({ pr }: PRInfoProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyBranch = () => {
    if (pr?.branch) {
      navigator.clipboard.writeText(pr.branch);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!pr) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50/50">
        <GitPullRequest size={36} className="text-neutral-400 mb-3" />
        <p className="text-xs text-neutral-600 font-medium">暂无 GitHub / GitLab 合并请求数据</p>
        <p className="text-[10px] text-neutral-550 mt-1 max-w-xs leading-normal">当最后一步“提交 PR”完成时，这里将会展现真实的自动化代码拉取单号</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* GitHub Card Theme and styling */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] relative overflow-hidden">
        {/* Branch Tags bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/80 pb-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-neutral-600">
            <GitBranch size={13} className="text-neutral-700" />
            <span className="bg-white px-2 py-0.5 rounded border border-neutral-200 text-neutral-800 font-medium max-w-[150px] truncate" title={pr.branch}>
              {pr.branch}
            </span>
            <span className="text-neutral-400">to</span>
            <span className="bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 text-neutral-700 font-medium">main</span>
          </div>

          <button
            key="copy-branch-btn"
            type="button"
            onClick={handleCopyBranch}
            className="flex items-center gap-1 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <Copy size={11} />
            <span>{copied ? '已复制' : '复制分支'}</span>
          </button>
        </div>

        {/* PR Main Title Body */}
        <div className="space-y-2 font-sans">
          <div className="flex items-start gap-2.5">
            <div className="p-1 px-2 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{pr.status}</span>
            </div>
            <h4 id={`pr-title-${pr.number}`} className="text-xs font-bold text-neutral-900 leading-relaxed font-sans select-all">
              #{pr.number} {pr.title}
            </h4>
          </div>
          
          <p className="text-[11px] text-neutral-600 leading-relaxed pl-1">
            由 <span className="text-neutral-900 font-semibold font-serif">超级个体 AI Agent</span> 自动发起。包含全自动覆盖率验证、无侵入重组方案以及高保真样式修改。审核通过后将自动并轨发布。
          </p>
        </div>

        {/* Terminal Sandbox copy layout */}
        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-900 space-y-1.5 font-mono text-[10px]">
          <div className="flex items-center gap-1.5 text-neutral-500 pb-1 border-b border-neutral-800">
            <Terminal size={11} />
            <strong>LOCAL MERGE SHORTCUT</strong>
          </div>
          <div className="text-neutral-300 whitespace-pre scrollbar-hide overflow-x-auto">
            <span className="text-neutral-500"># 本地拉取和检出该分支</span>{'\n'}
            git fetch origin {pr.branch}{'\n'}
            git checkout {pr.branch}
          </div>
        </div>

        {/* Action Link to PR */}
        <a
          href={pr.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-all shadow-sm group cursor-pointer"
        >
          <span>查看 Git 审核详情栏</span>
          <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}
