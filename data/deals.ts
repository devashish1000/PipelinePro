import { Deal } from '../types';
import { woltersKluwerReps } from './salesReps';

const accountNames = [
  'Baker McKenzie', 'DLA Piper', 'Latham & Watkins', 'Kirkland & Ellis', 'Skadden Arps', 'Sidley Austin', 'White & Case', 'Jones Day',
  'Cleveland Clinic', 'Kaiser Permanente', 'HCA Healthcare', 'Mayo Clinic', 'UnitedHealth Group', 'Pfizer', 'Johns Hopkins Medicine',
  'JPMorgan Chase', 'Goldman Sachs', 'Bank of America', 'Wells Fargo', 'Citigroup', 'Morgan Stanley', 'Barclays', 'HSBC Holdings',
  'Microsoft', 'Apple', 'Amazon', 'Walmart', 'ExxonMobil', 'Alphabet Inc.', 'Johnson & Johnson', 'General Electric',
  'Deloitte', 'PwC', 'EY', 'KPMG', 'Grant Thornton', 'BDO Global', 'RSM International',
  'Internal Revenue Service (IRS)', 'Department of Justice (DOJ)', 'Securities and Exchange Commission (SEC)', 'Federal Trade Commission (FTC)', 'FINRA'
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
  if (rank === 50) return 65; // Michael Thompson
  if (rank <= 18) return Math.floor(100 - ((rank - 1) * (10 / 17)));
  if (rank <= 35) return Math.floor(89 - ((rank - 19) * (10 / 16)));
  if (rank <= 80) return Math.floor(79 - ((rank - 36) * (19 / 44)));
  if (rank <= 95) return Math.floor(59 - ((rank - 81) * (19 / 14)));
  return Math.floor(39 - ((rank - 96) * (19 / 4)));
};

export const getDealsForRep = (repId: string): Deal[] => {
  const rep = woltersKluwerReps.find(r => r.id === repId);
  if (!rep) return [];

  const baseScore = getScoreFromRepId(repId);
  const rank = parseInt(repId.replace('rep', ''), 10);

  const getSeededRandom = (offset: number) => {
    const x = Math.sin(rank + offset) * 10000;
    return x - Math.floor(x);
  };

  // Quota coverage linked to score for logic
  const targetCoveragePercent = baseScore + 20; // 65 score -> 85% coverage
  const quota = rep.quota || 400000;
  const targetPipelineValue = (quota * targetCoveragePercent) / 100;
  
  const dealCount = 6;
  const avgDealValue = targetPipelineValue / dealCount;

  const deals: Deal[] = [];

  for (let i = 0; i < dealCount; i++) {
    const accountIndex = Math.floor(getSeededRandom(i + 1) * accountNames.length);
    const suffixIndex = Math.floor(getSeededRandom(i + 2) * dealSuffixes.length);
    const stageIndex = Math.floor(getSeededRandom(i + 3) * (stages.length - 1)); // Don't default to closed
    
    // Health is driven by the rep's base score
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
