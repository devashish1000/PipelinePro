import React, { useState, useEffect, useMemo } from 'react';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { DealHealthDashboard } from './components/DealHealthDashboard';
import { DealPipeline } from './components/DealPipeline';
import { DealCoach } from './components/DealCoach';
import { SettingsView } from './components/SettingsView';
import { View, SalesRep, Deal } from './types';
import { woltersKluwerReps } from './data/salesReps';
import { getRepMetrics } from './data/repMetrics';
import { getDealsForRep } from './data/deals';

export interface ActionItem {
  id: string;
  label: string;
  dealName: string;
  points: number;
  type: string;
}

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [userRole, setUserRole] = useState<'rep' | 'manager'>('rep');
  
  const defaultUser = woltersKluwerReps.find(rep => rep.email === 'michael.thompson@wolterskluwer.com') || woltersKluwerReps[49];
  const [currentUser, setCurrentUser] = useState<SalesRep>(defaultUser);

  const allActions: ActionItem[] = useMemo(() => {
    const deals = getDealsForRep(currentUser.id);
    const actions: ActionItem[] = [];

    if (currentUser.email === 'michael.thompson@wolterskluwer.com') {
      actions.push({
        id: `act-risk-1`,
        label: 'Verify Regulatory Jurisdiction',
        dealName: deals[0]?.name || 'Primary Deal',
        points: 10,
        type: 'missing_field'
      });
      actions.push({
        id: `act-risk-2`,
        label: 'Confirm Compliance Thresholds',
        dealName: deals[1]?.name || 'Secondary Deal',
        points: 10,
        type: 'missing_field'
      });
      actions.push({
        id: `act-pot-1`,
        label: 'Schedule Legal Tech Review',
        dealName: deals[2]?.name || 'Third Deal',
        points: 15,
        type: 'potential'
      });
    } else {
      deals.forEach((deal, idx) => {
        if (deal.health < 75) {
          actions.push({
            id: `act-risk-${deal.id}`,
            label: idx % 2 === 0 ? 'Verify Regulatory Jurisdiction' : 'Confirm Compliance Thresholds',
            dealName: deal.name,
            points: 10,
            type: 'missing_field'
          });
        }

        if (deal.stage === 'Qualification' || deal.stage === 'Proposal') {
          actions.push({
            id: `act-pot-${deal.id}`,
            label: idx % 3 === 0 ? 'Submit Audit Recovery Plan' : 'Schedule Legal Tech Review',
            dealName: deal.name,
            points: 15,
            type: 'potential'
          });
        }
      });
    }

    return actions.sort((a, b) => b.points - a.points);
  }, [currentUser.id]);

  const [scoreAdjustment, setScoreAdjustment] = useState(0);
  const [completedActionIds, setCompletedActionIds] = useState<string[]>([]);
  const [activeAction, setActiveAction] = useState<ActionItem | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'rank' | 'loading', subtext?: string} | null>(null);
  const [lastCompletionMessage, setLastCompletionMessage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const visibleActions = useMemo(() => 
    allActions.filter(a => !completedActionIds.includes(a.id)), 
    [allActions, completedActionIds]
  );

  const currentTaskInfo = useMemo(() => {
    if (!activeAction) return null;
    return {
      current: (allActions.length - visibleActions.length) + 1,
      total: allActions.length
    };
  }, [activeAction, visibleActions, allActions]);

  const calculateCurrentRank = (userId: string, currentAdj: number) => {
      const scores = woltersKluwerReps.map(rep => {
          const base = getRepMetrics(rep.id).dealHealthScore;
          return { id: rep.id, score: rep.id === userId ? base + currentAdj : base };
      }).sort((a, b) => b.score - a.score);
      return scores.findIndex(s => s.id === userId) + 1;
  };

  const handleLogin = (role: 'rep' | 'manager') => {
    setUserRole(role);
    setIsLoggedIn(true);
    setCurrentView(role === 'manager' ? 'INSIGHTS' : 'DASHBOARD');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('DASHBOARD');
    setScoreAdjustment(0);
    setCompletedActionIds([]);
    setActiveAction(null);
    setNotification(null);
    setLastCompletionMessage(null);
    setCurrentUser(defaultUser);
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'rank' | 'loading' = 'success', subtext?: string) => {
      if (type === 'rank') {
        setNotification({ message, type, subtext });
        setTimeout(() => setNotification(prev => prev?.message === message ? null : prev), 4000);
      } else if (type === 'loading' || type === 'info') {
        setNotification({ message, type, subtext });
        if (type === 'info') {
          setTimeout(() => setNotification(prev => prev?.message === message ? null : prev), 4000);
        }
      }
  };

  const handleFixAction = (action: ActionItem) => {
      setLastCompletionMessage(null);
      setActiveAction(action);
      setCurrentView('DEALS');
      showNotification(`Navigating to ${action.dealName}...`, 'info');
  };

  const handleCompleteAction = async () => {
      if (!activeAction || isValidating) return;
      
      setIsValidating(true);
      showNotification('Validating completion...', 'loading');

      await new Promise(resolve => setTimeout(resolve, 1500));

      const baseScore = getRepMetrics(currentUser.id).dealHealthScore;
      const oldScore = baseScore + scoreAdjustment;
      const prevRank = calculateCurrentRank(currentUser.id, scoreAdjustment);
      
      const points = activeAction.points;
      const newScoreAdj = scoreAdjustment + points;
      const newScore = Math.min(100, baseScore + newScoreAdj);
      const newRank = calculateCurrentRank(currentUser.id, newScoreAdj);
      
      const justCompletedId = activeAction.id;
      setScoreAdjustment(newScoreAdj);
      setCompletedActionIds(prev => [...prev, justCompletedId]);
      
      const currentRemainingCount = visibleActions.length - 1; 
      
      setIsValidating(false);
      setNotification(null);

      const completionMsg = `Action verified. ${currentRemainingCount} items remaining.`;
      setLastCompletionMessage(completionMsg);

      if (newRank < prevRank) {
          showNotification(
              `🎉 NEW RANK: #${newRank}!`, 
              'rank',
              `Score updated from ${oldScore} to ${newScore}`
          );
      }

      const currentIndex = visibleActions.findIndex(a => a.id === justCompletedId);
      const nextActionCandidate = visibleActions[currentIndex + 1] || null;

      if (nextActionCandidate) {
          setTimeout(() => {
              setLastCompletionMessage(null);
              setActiveAction(nextActionCandidate);
          }, 2000);
      } else {
          setTimeout(() => {
              setLastCompletionMessage(null);
              setActiveAction(null);
              setCurrentView('DASHBOARD');
          }, 2500);
      }
  };

  if (!isLoggedIn) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-white relative">
      <Header 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={handleLogout}
        currentUser={currentUser}
        onUserSwitch={(user) => {
            setCurrentUser(user);
            setScoreAdjustment(0);
            setCompletedActionIds([]);
            setActiveAction(null);
            setNotification(null);
            setLastCompletionMessage(null);
        }}
      />
      
      <main className="flex-1 p-3 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {currentView === 'DASHBOARD' && (
            <DealHealthDashboard 
                currentUser={currentUser} 
                onNavigate={setCurrentView}
                onFixAction={handleFixAction}
                completedActionIds={completedActionIds}
                activeActionId={activeAction?.id}
                scoreAdjustment={scoreAdjustment}
                allActions={allActions}
            />
        )}
        {currentView === 'DEALS' && (
            <DealPipeline 
                currentUser={currentUser} 
                activeAction={activeAction}
                onCompleteAction={handleCompleteAction}
                onCancelAction={() => { setActiveAction(null); showNotification('Action deferred', 'info'); }}
                isSubmitting={isValidating}
                progress={currentTaskInfo}
                completionMessage={lastCompletionMessage}
            />
        )}
        {currentView === 'COACH' && <DealCoach currentUser={currentUser} />}
        {currentView === 'SETTINGS' && <SettingsView />}
        {currentView === 'INSIGHTS' && (
            <div className="flex items-center justify-center h-full text-slate-300">
                <div className="text-center glass-card p-12 rounded-[24px]">
                    <h2 className="text-3xl font-black text-slate-900 mb-4">Strategic Insights</h2>
                    <p className="text-slate-600 font-medium">Advanced territory analytics module is being synchronized.</p>
                </div>
            </div>
        )}
      </main>

      <BottomNavigation 
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={currentUser}
      />

      {notification && (
          <div className="fixed top-24 right-6 z-[200] animate-ios-slide pointer-events-none">
              <div className={`flex flex-col px-7 py-5 rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-3xl border border-white/30 min-w-[360px] transition-all duration-400 ${
                  notification.type === 'rank' 
                    ? 'bg-amber-400 text-slate-900 border-amber-300' 
                    : notification.type === 'success' 
                    ? 'bg-emerald-500 text-white border-emerald-400' 
                    : notification.type === 'loading'
                    ? 'bg-[#FF6B35] text-white border-orange-400'
                    : 'bg-white/95 text-slate-900 border-white'
              }`}>
                  <div className="flex items-center space-x-4">
                    {notification.type === 'rank' ? (
                        <span className="text-3xl">🏆</span>
                    ) : notification.type === 'success' ? (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : notification.type === 'loading' ? (
                        <svg className="animate-spin h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    <span className="font-black text-lg tracking-tight">{notification.message}</span>
                  </div>
                  {notification.subtext && (
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.15em] opacity-80 pl-11">{notification.subtext}</p>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
