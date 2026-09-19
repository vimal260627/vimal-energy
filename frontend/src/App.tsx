import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SimulationDrawer } from './components/SimulationDrawer';
import { ApplianceDetailModal } from './components/ApplianceDetailModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { AppliancesPage } from './pages/AppliancesPage';
import { MonthComparisonPage } from './pages/MonthComparisonPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { WastagePage } from './pages/WastagePage';
import { ForecastPage } from './pages/ForecastPage';
import { WhatIfSimulatorPage } from './pages/WhatIfSimulatorPage';
import { SavingsVerificationPage } from './pages/SavingsVerificationPage';
import { BillTariffPage } from './pages/BillTariffPage';
import { EnvironmentalPage } from './pages/EnvironmentalPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

import { api } from './api/client';
import { Sparkles, ChevronRight, X, Play, CheckCircle } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedApplianceId, setSelectedApplianceId] = useState<string | null>(null);
  const [isSimDrawerOpen, setIsSimDrawerOpen] = useState(false);
  const [currentScenario, setCurrentScenario] = useState('normal');
  const [anomaliesCount, setAnomaliesCount] = useState(1);
  const [wastageCount, setWastageCount] = useState(1);

  // Demo Tour State (Requirement 63 & 66)
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  const tourSteps = [
    {
      step: 1,
      tab: 'dashboard',
      title: 'Step 1: Executive Dashboard',
      description: 'Review real-time electrical telemetry: Today\'s Energy (8.42 kWh), This Month (267.4 kWh), Estimated Cost, and Verified Energy Saved.',
    },
    {
      step: 2,
      tab: 'appliances',
      title: 'Step 2: Appliance-Level Monitoring',
      description: 'Observe individual loads: Living AC, Inverter Refrigerator, TV, Fans, and Lights with virtual relay states.',
    },
    {
      step: 3,
      tab: 'comparison',
      title: 'Step 3: Multi-Month Comparative Analytics',
      description: 'Inspect August (238 kWh) vs September (267 kWh). Notice the dynamic AI natural language summary explaining AC surge and lighting deltas.',
    },
    {
      step: 4,
      tab: 'appliances',
      action: () => setSelectedApplianceId('living_ac'),
      title: 'Step 4: AC Telemetry Deep Dive',
      description: 'Examine AC 24-hour load curve, rated vs baseline power (1200W), and operational hours.',
    },
    {
      step: 5,
      tab: 'dashboard',
      action: async () => {
        setSelectedApplianceId(null);
        await api.triggerScenario('empty_room');
        setCurrentScenario('empty_room');
      },
      title: 'Step 5: Trigger Empty Room Scenario',
      description: 'Simulated occupancy drops to 0 in Living Room while lights and ceiling fan remain actively drawing electricity.',
    },
    {
      step: 6,
      tab: 'wastage',
      title: 'Step 6: Wastage Engine Alarm',
      description: 'AI Wastage Engine flags empty-room leakage (>15 min delay). Wasted kWh and avoidable cost computed.',
    },
    {
      step: 7,
      tab: 'savings',
      action: async () => {
        await api.triggerScenario('auto_saving');
        setCurrentScenario('auto_saving');
      },
      title: 'Step 7: Smart Auto-Relay & Savings Verification',
      description: 'System changes Virtual Relays to OFF. Energy consumption drops. Before/After power delta logged into Savings Verification Ledger.',
    },
    {
      step: 8,
      tab: 'ai-insights',
      title: 'Step 8: AI Insights & Isolation Forest',
      description: 'Unsupervised Isolation Forest highlights baseline deviations and machine learning equipment recommendations.',
    },
    {
      step: 9,
      tab: 'what-if',
      title: 'Step 9: Interactive What-If Simulator',
      description: 'Adjust AC runtime reduction and thermostat sliders. Instantly review projected monthly and annual savings in kWh and Rupees.',
    },
  ];

  const handleStartTour = () => {
    setIsTourActive(true);
    setTourStep(1);
    setCurrentTab('dashboard');
  };

  const handleNextTourStep = async () => {
    if (tourStep < tourSteps.length) {
      const nextStepIndex = tourStep; // 1-indexed to next
      const nextStepObj = tourSteps[nextStepIndex];
      setTourStep(tourStep + 1);
      setCurrentTab(nextStepObj.tab);
      if (nextStepObj.action) {
        await nextStepObj.action();
      }
    } else {
      setIsTourActive(false);
    }
  };

  const handleTriggerScenario = async (sc: string) => {
    try {
      await api.triggerScenario(sc);
      setCurrentScenario(sc);
      setIsSimDrawerOpen(false);
      // If scenario is empty_room, navigate to wastage
      if (sc === 'empty_room') {
        setCurrentTab('wastage');
      } else if (sc === 'high_ac_anomaly') {
        setCurrentTab('ai-insights');
      } else if (sc === 'auto_saving') {
        setCurrentTab('savings');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetSimulation();
      setCurrentScenario('normal');
      setSelectedApplianceId(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        anomaliesCount={anomaliesCount}
        wastageCount={wastageCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onOpenSimControls={() => setIsSimDrawerOpen(true)}
          onStartDemoTour={handleStartTour}
          currentScenario={currentScenario}
          onReset={handleReset}
          activeNotificationsCount={anomaliesCount + wastageCount}
        />

        {/* Guided Demo Tour Banner Bar */}
        {isTourActive && (
          <div className="bg-gradient-to-r from-emerald-900/90 via-slate-900 to-teal-900/90 border-b border-emerald-500/40 px-6 py-3 flex items-center justify-between shadow-xl z-20">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {tourSteps[tourStep - 1].title} ({tourStep}/{tourSteps.length})
                </span>
                <p className="text-xs text-white font-medium mt-0.5">
                  {tourSteps[tourStep - 1].description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleNextTourStep}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold shadow-md transition-all"
              >
                <span>{tourStep === tourSteps.length ? 'Finish Tour' : 'Next Step'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsTourActive(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Views */}
        <main className="flex-1 p-6 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onSelectAppliance={(id) => setSelectedApplianceId(id)}
              onNavigateTab={setCurrentTab}
            />
          )}
          {currentTab === 'appliances' && (
            <AppliancesPage onSelectAppliance={(id) => setSelectedApplianceId(id)} />
          )}
          {currentTab === 'comparison' && <MonthComparisonPage />}
          {currentTab === 'ai-insights' && <AIInsightsPage />}
          {currentTab === 'wastage' && <WastagePage />}
          {currentTab === 'forecast' && <ForecastPage />}
          {currentTab === 'what-if' && <WhatIfSimulatorPage />}
          {currentTab === 'savings' && <SavingsVerificationPage />}
          {currentTab === 'billing' && <BillTariffPage />}
          {currentTab === 'environmental' && <EnvironmentalPage />}
          {currentTab === 'reports' && <ReportsPage />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Floating/Drawer Simulation Controller */}
      <SimulationDrawer
        isOpen={isSimDrawerOpen}
        onClose={() => setIsSimDrawerOpen(false)}
        onTriggerScenario={handleTriggerScenario}
        onReset={handleReset}
        currentScenario={currentScenario}
      />

      {/* Deep-Dive Appliance Telemetry Modal */}
      <ApplianceDetailModal
        applianceId={selectedApplianceId}
        onClose={() => setSelectedApplianceId(null)}
        onApplianceUpdated={() => {}}
      />
    </div>
  );
}

export default App;
