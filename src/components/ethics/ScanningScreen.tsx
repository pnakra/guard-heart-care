import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Shield, FileSearch, Brain, Eye, Loader2 } from 'lucide-react';

interface ScanningScreenProps {
  onComplete: () => void;
  projectName: string;
}

const scanSteps = [
  { id: 'files', label: 'Analyzing codebase structure', icon: FileSearch },
  { id: 'capabilities', label: 'Detecting capabilities & APIs', icon: Eye },
  { id: 'patterns', label: 'Scanning for dark patterns', icon: Brain },
  { id: 'adversarial', label: 'Running adversarial analysis', icon: Shield },
];

export function ScanningScreen({ projectName }: ScanningScreenProps) {
  const [activeStep, setActiveStep] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Cycle through steps continuously while analysis runs
    intervalRef.current = window.setInterval(() => {
      setActiveStep(prev => (prev + 1) % scanSteps.length);
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
            Ethical Framework Review
          </h1>
          <p className="text-muted-foreground">
            Analyzing <span className="font-medium text-foreground">{projectName}</span>
          </p>
        </div>

        {/* Indeterminate progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-secondary rounded-full overflow-hidden relative">
            <div 
              className="absolute h-full w-1/3 bg-primary rounded-full animate-[slide_1.5s_ease-in-out_infinite]"
              style={{
                animation: 'slide 1.5s ease-in-out infinite',
              }}
            />
          </div>
          <style>{`
            @keyframes slide {
              0% { left: -33%; }
              100% { left: 100%; }
            }
          `}</style>
          <p className="text-xs text-muted-foreground text-center mt-2">
            AI analysis in progress...
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {scanSteps.map((step, index) => {
            const isActive = index === activeStep;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border transition-all duration-500',
                  isActive && 'bg-primary/5 border-primary/30 scale-[1.02]',
                  !isActive && 'bg-card border-border/50 opacity-50'
                )}
              >
                <div className={cn(
                  'shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500',
                  isActive && 'bg-primary',
                  !isActive && 'bg-muted'
                )}>
                  <Icon className={cn(
                    'w-5 h-5 transition-colors duration-500',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium text-sm transition-colors duration-500',
                    isActive && 'text-foreground',
                    !isActive && 'text-muted-foreground'
                  )}>
                    {step.label}
                    {isActive && '...'}
                  </p>
                </div>
                {isActive && (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                )}
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            This usually takes 10-30 seconds depending on codebase size
          </p>
        </div>
      </div>
    </div>
  );
}
