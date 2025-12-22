import { RepMetrics } from '../types';
import { woltersKluwerReps } from './salesReps';
import { getDealsForRep } from './deals';

// Distribution for team leaderboard scores
const getScoreFromRepId = (repId: string): number => {
  const rank = parseInt(repId.replace('rep', ''), 10);
  if (rank <= 5) return Math.floor(100 - ((rank - 1) * 9 / 4));
  return Math.floor(90 - ((rank - 6) * 40 / 94));
};

export const getRepMetrics = (repId: string): RepMetrics => {
  const rep = woltersKluwerReps.find(r => r.id === repId);
  if (!rep) throw new Error(`Rep with ID ${repId} not found`);

  const deals = getDealsForRep(repId);
  const annualQuota = rep.quota || 400000;
  const isMichael = rep.email === 'michael.thompson@wolterskluwer.com';

  // Specific values requested for Michael Thompson's view
  const dealHealthScore = isMichael ? 84 : getScoreFromRepId(repId);
  const coveragePercent = isMichael ? 95 : 82;
  const coverageMultiple = isMichael ? 0.9 : 2.4;
  const sqlsCount = isMichael ? 26 : 42;
  const adherenceRate = isMichael ? 75 : 88;

  const totalPipelineValue = (annualQuota * coveragePercent) / 100;
  const atRiskCount = deals.filter(d => d.health < 60).length;

  const seed = parseInt(repId.replace('rep', ''), 10);
  const getStaticRand = (min: number, max: number, offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const trend = dealHealthScore > 80 ? 'Improving' : dealHealthScore > 60 ? 'Stable' : 'Declining';
  const missingFields = Math.max(1, Math.min(8, Math.ceil((100 - dealHealthScore) / 8)));
  const potentialGain = Math.round((100 - dealHealthScore) * 0.4);

  return {
    repId,
    dealHealthScore,
    trend,
    missingFields,
    potentialGain,
    territory: {
      coverage: totalPipelineValue,
      accounts: getStaticRand(15, 65, 2),
      opportunities: deals.length,
      quotaTarget: annualQuota,
    },
    pipeline: {
      coverageMultiple,
      avgDealAge: getStaticRand(18, 35, 3),
      atRisk: isMichael ? 3 : atRiskCount,
    },
    leadMaturation: {
      mqls: getStaticRand(150, 350, 4),
      sqls: sqlsCount,
      conversionRate: getStaticRand(18, 35, 5),
    },
    processAdherence: {
      completionRate: adherenceRate,
      automated: getStaticRand(120, 250, 7),
      manual: getStaticRand(15, 45, 8),
      ratio: getStaticRand(75, 92, 9),
    },
    dataQuality: {
      score: getStaticRand(60, 95, 10),
      maxScore: 100,
    },
    onboarding: {
      completePct: getStaticRand(40, 100, 11),
      modulesDone: getStaticRand(5, 12, 12),
      totalModules: 12,
      nextModule: 'Strategic Account Planning',
    }
  };
};