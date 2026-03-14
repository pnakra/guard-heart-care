import { useState } from 'react';
import { ProjectUpload, CustomRulesConfig, PopulationModifier } from '@/components/ethics/ProjectUpload';
import { ScanningScreen } from '@/components/ethics/ScanningScreen';
import { EthicsReviewPanel } from '@/components/ethics/EthicsReviewPanel';
import { PublishGate } from '@/components/ethics/PublishGate';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';
import { EthicsReviewResult } from '@/types/ethics';
import { DetectedCapability, MisuseScenario } from '@/data/mockMisuseData';
import { IssueStatusProvider } from '@/contexts/IssueStatusContext';
import { toast } from 'sonner';

type AppState = 'upload' | 'scanning' | 'results' | 'publish-gate';

interface UploadedFile {
  name: string;
  content: string;
  size: number;
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>('upload');
  const [analysisResult, setAnalysisResult] = useState<EthicsReviewResult | null>(null);
  const [capabilities, setCapabilities] = useState<DetectedCapability[]>([]);
  const [misuseScenarios, setMisuseScenarios] = useState<MisuseScenario[]>([]);
  const [projectName, setProjectName] = useState('');
  const [activePopulations, setActivePopulations] = useState<PopulationModifier[]>([]);
  
  const { analyzeCode, isAnalyzing } = useCodeAnalysis();

  const handleAnalyze = async (files: UploadedFile[], name: string, customRules?: CustomRulesConfig, populationModifiers?: PopulationModifier[]) => {
    setProjectName(name);
    setActivePopulations(populationModifiers || []);
    setAppState('scanning');

    const result = await analyzeCode(files, name, customRules, populationModifiers);
    
    if (result) {
      setAnalysisResult(result.result);
      setCapabilities(result.capabilities);
      setMisuseScenarios(result.misuseScenarios);
      setAppState('results');
    } else {
      setAppState('upload');
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

  if (appState === 'upload') {
    return (
      <ProjectUpload 
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
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
    <IssueStatusProvider>
      <EthicsReviewPanel 
        result={analysisResult}
        capabilities={capabilities}
        misuseScenarios={misuseScenarios}
        activePopulations={activePopulations}
        onRescan={handleRescan}
        onPublish={handlePublishClick}
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
  );
};

export default Index;
