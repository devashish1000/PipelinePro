import { RepMetrics } from '../types';
import { woltersKluwerReps } from './salesReps';
import { getDealsForRep } from './deals';

// Map rank back to the requested score distribution
const getScoreFromRepId = (repId: string): number => {
  const rank = parseInt(repId.replace('rep', ''), 10);
  
  if (rank === 50) return 65; // Michael Thompson
  
  if (rank <= 18) return Math.floor(100 - ((rank - 1) * (10 / 17))); // 90-100 (18 reps)
  if (rank <= 35) return Math.floor(89 - ((rank - 19) * (10 / 16))); // 80-89 (17 reps)
  if (rank <= 80) {
    const posInGroup = rank - 36;
    return Math.floor(79 - (posInGroup * (19 / 44))); 
  }
  if (rank <= 95) return Math.floor(59 - ((rank - 81) * (19 / 14))); // 40-59 (15 reps)
  return Math.floor(39 - ((rank - 96) * (19 / 4))); // 20-39 (5 reps)
};

export const getRepMetrics = (repId: string): RepMetrics => {
  const rep = woltersKluwerReps.find(r => r.id === repId);
  if (!rep) throw new Error(`Rep with ID ${repId} not found`);

  const dealHealthScore = getScoreFromRepId(repId);
  const deals = getDealsForRep(repId);
  
  const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const annualQuota = rep.quota || 400000;
  
  const coverageMultiple = parseFloat((totalPipelineValue / annualQuota).toFixed(1));
  const atRiskCount = deals.filter(d => d.health < 60).length;

  // Use the ID as a seed for other metrics to keep them static
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
      atRisk: atRiskCount,
    },
    leadMaturation: {
      mqls: getStaticRand(150, 350, 4),
      sqls: getStaticRand(20, 75, 4),
      conversionRate: getStaticRand(18, 35, 5),
    },
    processAdherence: {
      completionRate: getStaticRand(55, 95, 6),
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
