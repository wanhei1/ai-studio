/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  onRecreate?: () => void;
}

// Hand-coded SVG Icons (no external icon library for actions)
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const RegenerateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M23 4v6h-6" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const ThumbsUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const ThumbsDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm12-3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-600 shrink-0">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function ChatMessage({ message, onRecreate }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [thumbsUp, setThumbsUp] = useState<boolean | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // 2 seconds toast alert window
  };

  const handleThumb = (up: boolean) => {
    setThumbsUp(thumbsUp === up ? null : up);
  };

  // Helper to parse `inline_code` and **bold**
  const parseInlineStyles = (segment: string): React.ReactNode[] => {
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const tokens = segment.split(regex);

    return tokens.map((token, index) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={index} className="text-white font-bold px-0.5 font-sans">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code key={index} className="px-1.5 py-0.5 rounded bg-[#2a2b2d] text-amber-200 border border-white/5 font-mono text-[10px] break-all">
            {token.slice(1, -1)}
          </code>
        );
      }
      return token;
    });
  };

  // Block-level parse analyzer using regex sequence detectors
  const parseProseText = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Empty line check
      if (line.trim() === '') {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
        i++;
        continue;
      }

      // 1. Headers detection
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-base font-sans font-bold my-2 pt-1 text-white">
            {parseInlineStyles(line.slice(2))}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-sm font-sans font-bold my-1.5 pt-1 text-white border-b border-white/5 pb-0.5">
            {parseInlineStyles(line.slice(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-xs font-sans font-semibold my-1 pt-1 text-neutral-200">
            {parseInlineStyles(line.slice(4))}
          </h3>
        );
        i++;
        continue;
      }

      // 2. Blockquote detection
      if (line.startsWith('> ')) {
        const quoteLines: string[] = [];
        while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
          const l = lines[i];
          quoteLines.push(l.startsWith('> ') ? l.slice(2) : '');
          i++;
        }
        elements.push(
          <blockquote key={`quote-${i}`} className="border-l-4 border-blue-500/60 pl-3 italic my-2 bg-[#1e1f20] pr-2 py-1.5 text-neutral-300 text-xs rounded-r block leading-relaxed">
            {quoteLines.map((ql, qidx) => (
              <p key={qidx} className="my-0.5">{parseInlineStyles(ql)}</p>
            ))}
          </blockquote>
        );
        continue;
      }

      // 3. Bullet list detection (consecutive)
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletLines: string[] = [];
        while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
          const rawLine = lines[i].trim();
          bulletLines.push(rawLine.slice(2));
          i++;
        }
        elements.push(
          <ul key={`ul-${i}`} className="list-disc pl-5 my-2 space-y-1">
            {bulletLines.map((item, bidx) => (
              <li key={bidx} className="text-xs text-neutral-300 leading-relaxed font-sans">
                {parseInlineStyles(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 4. Ordered list detection (consecutive)
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)$/);
      if (numMatch) {
        const orderedLines: { num: string; content: string }[] = [];
        while (i < lines.length) {
          const currentLine = lines[i].trim();
          const match = currentLine.match(/^(\d+)\.\s(.*)$/);
          if (!match) break;
          orderedLines.push({ num: match[1], content: match[2] });
          i++;
        }
        elements.push(
          <ol key={`ol-${i}`} className="list-decimal pl-5 my-2 space-y-1">
            {orderedLines.map((item, oidx) => (
              <li key={oidx} className="text-xs text-neutral-300 leading-relaxed font-sans">
                {parseInlineStyles(item.content)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Default normal paragraph prose elements
      elements.push(
        <p key={`p-${i}`} className="text-xs leading-relaxed text-neutral-300 my-1.5 font-sans">
          {parseInlineStyles(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  // Pre-process codeblocks and dispatch intermediate segments to the prose model
  const renderMarkdownBlocks = (rawContent: string) => {
    const blocks: React.ReactNode[] = [];
    const codeBlockSplitter = /```(\w+)?\n([\s\S]*?)```/g;
    
    let lastIndex = 0;
    let match;

    while ((match = codeBlockSplitter.exec(rawContent)) !== null) {
      const prose = rawContent.substring(lastIndex, match.index);
      if (prose.trim()) {
        blocks.push(<div key={`prose-${lastIndex}`} className="space-y-1">{parseProseText(prose)}</div>);
      }

      const lang = match[1] || 'typescript';
      const code = match[2];
      blocks.push(
        <div key={`code-${match.index}`} className="my-3 rounded-md overflow-hidden border border-white/5 shadow-sm font-mono text-xs">
          <div className="flex bg-[#2a2b2d] px-3.5 py-1.5 justify-between items-center border-b border-white/5">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{lang}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-neutral-400 hover:text-white transition-colors text-[9px] font-bold tracking-wider cursor-pointer"
            >
              {copied ? '已复制 ✔' : '复制代码 📋'}
            </button>
          </div>
          <pre className="p-3 bg-[#0f0f10] overflow-x-auto text-[11px] text-[#D4D4D4] scrollbar-hide text-left whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = codeBlockSplitter.lastIndex;
    }

    const remainingProse = rawContent.substring(lastIndex);
    if (remainingProse) {
      blocks.push(<div key={`prose-${lastIndex}`} className="space-y-1">{parseProseText(remainingProse)}</div>);
    }

    return blocks;
  };

  // Render dedicated system notifications with elegant full width ribbon
  if (message.sender === 'system') {
    return (
      <div id={`msg-${message.id}`} className="flex justify-center my-4 animate-fade-in text-center w-full px-2 font-sans">
        <div className="bg-[#1e1f20] border border-white/5 px-4 py-2 rounded-lg text-xs text-[#a8c7fa] select-all flex items-center gap-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  const isAI = message.sender === 'ai';

  return (
    <div className={`flex w-full items-start gap-3 my-4 ${isAI ? 'justify-start' : 'justify-end'} animate-fade-in font-sans`}>
      {/* Sender Avatar badge */}
      {isAI && (
        <div className="p-1 px-1.5 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 text-white shadow-sm shrink-0 uppercase tracking-widest">
          <Sparkles size={14} />
        </div>
      )}

      {/* Main Message Bubble */}
      <div className="max-w-[85%] flex flex-col space-y-1">
        {/* Name Header and Time stamp */}
        <div className={`flex items-center gap-2 ${isAI ? 'justify-start' : 'justify-end'} text-[10px] text-neutral-400 font-mono px-1`}>
          <span className="font-semibold text-neutral-300">{isAI ? '● AI交付助手' : 'PM (您)'}</span>
          <span>{message.timestamp}</span>
        </div>

        {/* Bubble container style */}
        <div
          id={`msg-${message.id}`}
          className={`p-4 rounded-xl shadow-sm border text-left ${
            isAI
              ? 'bg-[#1e1f20] border-white/5 text-[#e3e3e3] rounded-tl-sm'
              : 'bg-[#2a2b2d] border-white/5 text-[#f5f5f5] rounded-tr-sm'
          }`}
        >
          {isAI ? (
            <div className="space-y-1 text-left">
              {renderMarkdownBlocks(message.content)}
            </div>
          ) : (
            <p className="text-xs leading-relaxed break-words font-medium text-white whitespace-pre-wrap text-left select-all">
              {message.content}
            </p>
          )}
        </div>

        {/* Footer controls for Assistant msg (with manual hand-coded SVGs and precise transparent classes) */}
        {isAI && (
          <div className="flex items-center gap-3.5 text-[10px] pt-1 px-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 cursor-pointer transition-all text-neutral-400 hover:text-white font-semibold tracking-wider"
              title="复制消息文本"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              <span>{copied ? '已复制' : '复制'}</span>
            </button>

            {onRecreate && (
              <button
                onClick={onRecreate}
                className="flex items-center gap-1 cursor-pointer transition-all text-neutral-400 hover:text-white font-semibold tracking-wider"
                title="重新生成并重置"
              >
                <RegenerateIcon />
                <span>重新生成</span>
              </button>
            )}

            <button
              onClick={() => handleThumb(true)}
              className={`flex items-center gap-1 cursor-pointer transition-all font-semibold tracking-wider ${
                thumbsUp === true 
                  ? 'text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20' 
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="赞"
            >
              <ThumbsUpIcon />
              <span>赞</span>
            </button>

            <button
              onClick={() => handleThumb(false)}
              className={`flex items-center gap-1 cursor-pointer transition-all font-semibold tracking-wider ${
                thumbsUp === false 
                  ? 'text-rose-400 bg-rose-505/10 px-1.5 py-0.5 rounded border border-rose-500/20' 
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="踩"
            >
              <ThumbsDownIcon />
              <span>踩</span>
            </button>
          </div>
        )}
      </div>

      {!isAI && (
        <div className="p-1 px-1.5 rounded-lg bg-neutral-800 border border-white/5 text-[#e3e3e3] shadow-sm shrink-0">
          <User size={14} />
        </div>
      )}
    </div>
  );
}
