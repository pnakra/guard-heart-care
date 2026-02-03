import { useState } from 'react';
import { ScanningScreen } from '@/components/ethics/ScanningScreen';
import { EthicsReviewPanel } from '@/components/ethics/EthicsReviewPanel';
import { PublishGate } from '@/components/ethics/PublishGate';
import { mockReviewResult } from '@/data/mockEthicsData';
import { mockCapabilities, mockMisuseScenarios } from '@/data/mockMisuseData';
import { toast } from 'sonner';

type DemoState = 'scanning' | 'results' | 'publish-gate' | 'published';

const Index = () => {
  const [demoState, setDemoState] = useState<DemoState>('scanning');
  const projectName = 'Social Connect App';

  const handleScanComplete = () => {
    setDemoState('results');
  };

  const handleRescan = () => {
    setDemoState('scanning');
  };

  const handlePublishClick = () => {
    setDemoState('publish-gate');
  };

  const handlePublishConfirm = () => {
    setDemoState('published');
    toast.success('Project published!', {
      description: 'Your app is now live with acknowledged ethical considerations.',
    });
    // Reset to results view after a moment
    setTimeout(() => setDemoState('results'), 2000);
  };

  const handlePublishCancel = () => {
    setDemoState('results');
  };

  if (demoState === 'scanning') {
    return (
      <ScanningScreen 
        projectName={projectName}
        onComplete={handleScanComplete}
      />
    );
  }

  return (
    <>
      <EthicsReviewPanel 
        result={{ ...mockReviewResult, projectName }}
        capabilities={mockCapabilities}
        misuseScenarios={mockMisuseScenarios}
        onRescan={handleRescan}
        onPublish={handlePublishClick}
      />
      
      {demoState === 'publish-gate' && (
        <PublishGate
          issues={mockReviewResult.issues}
          misuseScenarios={mockMisuseScenarios}
          projectName={projectName}
          onPublish={handlePublishConfirm}
          onCancel={handlePublishCancel}
        />
      )}
    </>
  );
};

export default Index;
