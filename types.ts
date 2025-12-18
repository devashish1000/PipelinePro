
export enum AppState {
  SETUP = 'SETUP',
  LIVE = 'LIVE',
  ANALYZING = 'ANALYZING',
  REPORT = 'REPORT',
  HISTORY = 'HISTORY'
}

export type View = 'DASHBOARD' | 'DEALS' | 'COACH' | 'SETTINGS' | 'INSIGHTS';

export interface Scenario {
  product: string;
  prospectRole: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Impossible';
  duration: '5 MIN' | '10 MIN' | '15 MIN' | 'NONE';
  context: string;
}

export interface TranscriptionItem {
  speaker: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AnalysisResult {
  scores: {
    overall: number;
    breakdown: { label: string; score: number; fill?: string }[];
  };
  feedback: {
    strengths: { point: string; quote?: string }[];
    improvements: { point: string; quote?: string }[];
    summary: string;
  };
}

export interface SessionRecord {
  id: string;
  date: string;
  prospectRole: string;
  product: string;
  score: number;
  transcripts: TranscriptionItem[];
  analysis: AnalysisResult;
}

export interface SalesRep {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Sales Rep' | 'Manager | Sales Ops Analyst';
  profilePicUrl: string;
  territory?: string;
  quota?: number;
}

export interface Deal {
  id: number;
  name: string;
  account: string;
  value: number;
  stage: 'Discovery' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  health: number;
  closeDate: string;
  ownerId: string;
  ownerName: string;
  status: 'Healthy' | 'Watch' | 'Risk' | 'Critical';
}

export interface RepMetrics {
  repId: string;
  dealHealthScore: number;
  trend: 'Improving' | 'Declining' | 'Stable';
  missingFields: number;
  potentialGain: number;
  territory: {
    coverage: number;
    accounts: number;
    opportunities: number;
    quotaTarget: number;
  };
  pipeline: {
    coverageMultiple: number;
    avgDealAge: number;
    atRisk: number;
  };
  leadMaturation: {
    mqls: number;
    sqls: number;
    conversionRate: number;
  };
  processAdherence: {
    completionRate: number;
    automated: number;
    manual: number;
    ratio: number;
  };
  dataQuality: {
    score: number;
    maxScore: number;
  };
  onboarding: {
    completePct: number;
    modulesDone: number;
    totalModules: number;
    nextModule: string;
  };
}
