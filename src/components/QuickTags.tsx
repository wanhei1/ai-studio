/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlusCircle, FileCode, SlidersHorizontal, Bug } from 'lucide-react';

interface QuickTagsProps {
  onSelectTag: (text: string) => void;
}

const CONSTANT_TAGS = [
  {
    label: '新增字段',
    description: '在首页文章卡片上增加阅读量 icon + 数字展示',
    icon: PlusCircle,
    text: '在首页文章卡片上增加阅读量 icon + 数字展示'
  },
  {
    label: '新增页面',
    description: '新增用户注册时隐私协议勾选框',
    icon: FileCode,
    text: '在注册表单页面添加 GDPR 隐私政策必选勾选框'
  },
  {
    label: '新增筛选',
    description: '在交易列表页面添加【导出为CSV】按钮',
    icon: SlidersHorizontal,
    text: '在交易列表页面添加【导出为CSV】按钮并实现文件下载'
  },
  {
    label: '修复 Bug',
    description: '修复登录密码校验及溢出重叠样式报错',
    icon: Bug,
    text: '修复登录页在移动端宽度不足导致密码框按钮重叠以及缺少防抖提交导致多次调用的 Bug'
  }
];

export default function QuickTags({ onSelectTag }: QuickTagsProps) {
  return (
    <div className="flex flex-wrap gap-2.5 mb-3">
      {CONSTANT_TAGS.map((tag) => {
        const Icon = tag.icon;
        return (
          <button
            key={tag.label}
            id={`tag-${tag.label}`}
            type="button"
            onClick={() => onSelectTag(tag.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-neutral-50 border border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:bg-neutral-100/50 hover:text-neutral-905 transition-all cursor-pointer"
            title={tag.description}
          >
            <Icon size={12} className="text-neutral-500" />
            <span className="font-semibold">{tag.label}</span>
          </button>
        );
      })}
    </div>
  );
}
