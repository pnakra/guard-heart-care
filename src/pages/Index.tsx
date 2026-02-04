import { useState } from 'react';
import { ProjectUpload } from '@/components/ethics/ProjectUpload';
import { ScanningScreen } from '@/components/ethics/ScanningScreen';
import { EthicsReviewPanel } from '@/components/ethics/EthicsReviewPanel';
import { PublishGate } from '@/components/ethics/PublishGate';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';
import { EthicsReviewResult } from '@/types/ethics';
import { DetectedCapability, MisuseScenario } from '@/data/mockMisuseData';
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
  
  const { analyzeCode, isAnalyzing } = useCodeAnalysis();

  const handleAnalyze = async (files: UploadedFile[], name: string) => {
    setProjectName(name);
    setAppState('scanning');

    const result = await analyzeCode(files, name);
    
    if (result) {
      setAnalysisResult(result.result);
      setCapabilities(result.capabilities);
      setMisuseScenarios(result.misuseScenarios);
      setAppState('results');
    } else {
      // Analysis failed, go back to upload
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
        onComplete={() => {}} // Will transition via analyzeCode callback
      />
    );
  }

  if (!analysisResult) {
    return null;
  }

  return (
    <>
      <EthicsReviewPanel 
        result={analysisResult}
        capabilities={capabilities}
        misuseScenarios={misuseScenarios}
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
    </>
  );
};

export default Index;
