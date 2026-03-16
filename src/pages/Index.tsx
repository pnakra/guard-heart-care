import { useState } from 'react';
import { ProjectUpload, CustomRulesConfig, PopulationModifier } from '@/components/ethics/ProjectUpload';
import { ScanningScreen } from '@/components/ethics/ScanningScreen';
import { EthicsReviewPanel } from '@/components/ethics/EthicsReviewPanel';
import { PublishGate } from '@/components/ethics/PublishGate';
import { OnboardingFlow } from '@/components/ethics/OnboardingFlow';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';
import { EthicsReviewResult } from '@/types/ethics';
import { DetectedCapability, MisuseScenario } from '@/data/mockMisuseData';
import { IssueStatusProvider } from '@/contexts/IssueStatusContext';
import { ModeProvider } from '@/contexts/ModeContext';
import { AppCategory } from '@/services/categoryDetector';
import { toast } from 'sonner';

type AppState = 'onboarding' | 'upload' | 'scanning' | 'results' | 'publish-gate';

interface UploadedFile {
  name: string;
  content: string;
  size: number;
}

const CATEGORY_OVERRIDE_SESSION_KEY = 'gfc-category-override';

const Index = () => {
  const hasCompletedOnboarding = localStorage.getItem('gfc_onboarding_complete') === 'true';
  const [appState, setAppState] = useState<AppState>(hasCompletedOnboarding ? 'upload' : 'onboarding');
  const [analysisResult, setAnalysisResult] = useState<EthicsReviewResult | null>(null);
  const [capabilities, setCapabilities] = useState<DetectedCapability[]>([]);
  const [misuseScenarios, setMisuseScenarios] = useState<MisuseScenario[]>([]);
  const [projectName, setProjectName] = useState('');
  const [activePopulations, setActivePopulations] = useState<PopulationModifier[]>([]);
  const [lastScanFiles, setLastScanFiles] = useState<UploadedFile[]>([]);
  const [lastScanCategory, setLastScanCategory] = useState<AppCategory | undefined>();
  
  const { analyzeCode, isAnalyzing } = useCodeAnalysis();

  const handleAnalyze = async (files: UploadedFile[], name: string, customRules?: CustomRulesConfig, populationModifiers?: PopulationModifier[], forkData?: any, categoryOverride?: AppCategory) => {
    setProjectName(name);
    setActivePopulations(populationModifiers || []);
    setLastScanFiles(files);
    setLastScanCategory(categoryOverride);
    setAppState('scanning');

    // Persist category override
    if (categoryOverride) {
      try { sessionStorage.setItem(CATEGORY_OVERRIDE_SESSION_KEY, categoryOverride); } catch {}
    } else {
      try { sessionStorage.removeItem(CATEGORY_OVERRIDE_SESSION_KEY); } catch {}
    }

    const result = await analyzeCode(files, name, customRules, populationModifiers, forkData, categoryOverride);
    
    if (result) {
      setAnalysisResult(result.result);
      setCapabilities(result.capabilities);
      setMisuseScenarios(result.misuseScenarios);
      setAppState('results');
    } else {
      setAppState('upload');
    }
  };

  const handleRescanWithCategory = async (newCategory: AppCategory) => {
    if (lastScanFiles.length === 0) {
      toast.error('No files available for rescan');
      return;
    }

    setLastScanCategory(newCategory);
    setAppState('scanning');

    // Persist override
    try { sessionStorage.setItem(CATEGORY_OVERRIDE_SESSION_KEY, newCategory); } catch {}

    const result = await analyzeCode(lastScanFiles, projectName, undefined, activePopulations.length > 0 ? activePopulations : undefined, undefined, newCategory);
    
    if (result) {
      setAnalysisResult(result.result);
      setCapabilities(result.capabilities);
      setMisuseScenarios(result.misuseScenarios);
      setAppState('results');
    } else {
      setAppState('results'); // Keep previous results on failure
    }
  };

  const handleRescan = () => {
    setAppState('upload');
    setAnalysisResult(null);
    setCapabilities([]);
    setMisuseScenarios([]);
  };

  const handlePublishClick = () => {
    setAppState('publish-gate');
  };

  const handlePublishConfirm = () => {
    toast.success('Project approved!', {
      description: 'All ethical considerations have been acknowledged.',
    });
    setAppState('results');
  };

  const handlePublishCancel = () => {
    setAppState('results');
  };

  if (appState === 'onboarding') {
    return <OnboardingFlow onComplete={() => setAppState('upload')} />;
  }

  if (appState === 'upload') {
    return (
      <ProjectUpload 
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        onShowOnboarding={() => setAppState('onboarding')}
      />
    );
  }

  if (appState === 'scanning') {
    return (
      <ScanningScreen 
        projectName={projectName}
        onComplete={() => {}}
      />
    );
  }

  if (!analysisResult) {
    return null;
  }

  return (
    <ModeProvider>
      <IssueStatusProvider>
        <EthicsReviewPanel 
          result={analysisResult}
          capabilities={capabilities}
          misuseScenarios={misuseScenarios}
          activePopulations={activePopulations}
          onRescan={handleRescan}
          onPublish={handlePublishClick}
          onRescanWithCategory={handleRescanWithCategory}
          isRescanning={isAnalyzing}
          activeCategory={lastScanCategory}
        />
        
        {appState === 'publish-gate' && (
          <PublishGate
            issues={analysisResult.issues}
            misuseScenarios={misuseScenarios}
            projectName={projectName}
            onPublish={handlePublishConfirm}
            onCancel={handlePublishCancel}
          />
        )}
      </IssueStatusProvider>
    </ModeProvider>
  );
};

export default Index;
