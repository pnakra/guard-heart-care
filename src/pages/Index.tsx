import { EthicsReviewPanel } from '@/components/ethics/EthicsReviewPanel';
import { mockReviewResult } from '@/data/mockEthicsData';

const Index = () => {
  const handleRescan = () => {
    // In a real implementation, this would trigger a new scan
    console.log('Rescanning...');
  };

  return (
    <EthicsReviewPanel 
      result={mockReviewResult} 
      onRescan={handleRescan}
    />
  );
};

export default Index;
