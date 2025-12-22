
import { Deal } from '../types';
import { woltersKluwerReps } from './salesReps';

const accountNames = [
  'UnitedHealth Group', 'Mayo Clinic', 'HCA Healthcare', 'Skadden Arps', 'CVS', 'Baker McKenzie',
  'JPMorgan Chase', 'Goldman Sachs', 'Deloitte', 'PwC', 'EY', 'KPMG', 'White & Case', 'Latham & Watkins',
  'Cravath Swaine', 'DLA Piper', 'Kaiser Permanente', 'Anthem', 'Kirkland & Ellis', 'Sidley Austin',
  'Jones Day', 'Pfizer', 'Microsoft', 'Apple', 'Amazon', 'Citigroup', 'Bank of America', 'Cleveland Clinic',
  'Federal Trade Commission (FTC)', 'Wells Fargo', 'Morgan Stanley', 'Alphabet Inc.', 'Walmart'
];

const dealSuffixes = [
  'Global Tax Solution',
  'Regulatory Compliance Suite',
  'Legal Research Intelligence',
  'Healthcare Risk Manager',
  'Audit & Assurance Platform',
  'Financial Reporting Upgrade',
  'ESG Compliance Audit',
  'Corporate Governance Portal',
  'Internal Audit Cloud',
  'TeamMate+ Implementation',
  'CT Corporation Compliance',
  'CCH Axcess Migration'
];

const stages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;

const getScoreFromRepId = (repId: string): number => {
  const rank = parseInt(repId.replace('rep', ''), 10);
  
  // Top 5% (5 reps): Scores 100 down to 91
  if (rank <= 5) {
    return Math.floor(100 - ((rank - 1) * 9 / 4));
  }
  
  // Bottom 95% (95 reps): Scores 90 down to 50
  return Math.floor(90 - ((rank - 6) * 40 / 94));
};

export const getDealsForRep = (repId: string): Deal[] => {
  const rep = woltersKluwerReps.find(r => r.id === repId);
  if (!rep) return [];

  const baseScore = getScoreFromRepId(repId);
  const rank = parseInt(repId.replace('rep', ''), 10);
  const isMichael = rep.email === 'michael.thompson@wolterskluwer.com';

  const getSeededRandom = (offset: number) => {
    const x = Math.sin(rank + offset) * 10000;
    return x - Math.floor(x);
  };

  // Quota coverage linked to score for logic
  const targetCoveragePercent = baseScore + 20; // e.g. 70 score -> 90% coverage
  const quota = rep.quota || 400000;
  const targetPipelineValue = (quota * targetCoveragePercent) / 100;
  
  // Show 35 deals for Michael to ensure broad client representation
  const dealCount = isMichael ? 35 : 8;
  const avgDealValue = targetPipelineValue / dealCount;

  const deals: Deal[] = [];

  for (let i = 0; i < dealCount; i++) {
    // Pick unique accounts sequentially first to show variety for top reps
    const accountIndex = isMichael ? (i % accountNames.length) : Math.floor(getSeededRandom(i + 1) * accountNames.length);
    const suffixIndex = Math.floor(getSeededRandom(i + 2) * dealSuffixes.length);
    const stageIndex = Math.floor(getSeededRandom(i + 3) * (stages.length - 1));
    
    // Health variance
    const healthVariance = (getSeededRandom(i + 4) * 10) - 5; 
    let health = Math.floor(baseScore + healthVariance);
    health = Math.max(20, Math.min(100, health)); 

    let status: Deal['status'] = 'Healthy';
    if (health < 40) status = 'Critical';
    else if (health < 60) status = 'Risk';
    else if (health < 80) status = 'Watch';

    const valVariance = (getSeededRandom(i + 5) * 0.4) + 0.8; 
    const value = Math.floor(avgDealValue * valVariance);

    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + Math.floor(getSeededRandom(i + 6) * 60));

    deals.push({
      id: parseInt(`${rank}${i}`),
      name: `${accountNames[accountIndex]} - ${dealSuffixes[suffixIndex]}`,
      account: accountNames[accountIndex],
      value,
      stage: stages[stageIndex],
      health,
      closeDate: closeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ownerId: rep.id,
      ownerName: `${rep.firstName} ${rep.lastName}`,
      status
    });
  }

  return deals;
};

export const getAllDeals = (): Deal[] => {
    return woltersKluwerReps.flatMap(rep => getDealsForRep(rep.id));
}
