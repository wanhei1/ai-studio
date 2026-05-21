/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StageName = 
  | 'clarify' 
  | 'decompose' 
  | 'locate' 
  | 'codegen' 
  | 'testing' 
  | 'pr_submit';

export interface StageStatus {
  id: StageName;
  label: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  message: string;
}

export interface FileChange {
  path: string;
  action: 'create' | 'modify' | 'delete';
  additions: number;
  deletions: number;
  diffContent: string; // Unified diff representation
}

export interface TestSuiteResult {
  passedCount: number;
  failedCount: number;
  totalCount: number;
  status: 'idle' | 'running' | 'passed' | 'failed';
  details: string[]; // Console logs or specific test cases
}

export interface PullRequestInfo {
  url: string;
  title: string;
  number: number;
  branch: string;
  status: 'draft' | 'open' | 'merged';
}

export interface InterventionConfig {
  question: string;
  options?: string[];
  placeholder?: string;
  type: 'text' | 'select' | 'confirm';
}

export interface ChatMessage {
  id: string;
  sender: 'pm' | 'ai' | 'system';
  content: string;
  timestamp: string;
  stages?: StageStatus[];
  currentStageId?: StageName | null;
  intervention?: InterventionConfig | null;
  interventionAnswered?: boolean;
  codeChanges?: FileChange[];
  testSuiteResult?: TestSuiteResult;
  pr?: PullRequestInfo;
  tokenStats?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface RequirementHistory {
  id: string;
  requirementText: string;
  status: 'completed' | 'running' | 'interrupted' | 'failed';
  timestamp: string;
  totalTokens: number;
  messages: ChatMessage[];
}
