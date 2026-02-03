import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Shield, FileSearch, Brain, Eye, CheckCircle2 } from 'lucide-react';

interface ScanningScreenProps {
  onComplete: () => void;
  projectName: string;
}

const scanSteps = [
  { id: 'files', label: 'Analyzing codebase structure...', icon: FileSearch, duration: 1200 },
  { id: 'capabilities', label: 'Detecting capabilities & APIs...', icon: Eye, duration: 1500 },
  { id: 'patterns', label: 'Scanning for dark patterns...', icon: Brain, duration: 1800 },
  { id: 'adversarial', label: 'Running adversarial analysis...', icon: Shield, duration: 2000 },
];

export function ScanningScreen({ onComplete, projectName }: ScanningScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    if (currentStep >= scanSteps.length) {
      const timeout = setTimeout(onComplete, 600);
      return () => clearTimeout(timeout);
    }

    const step = scanSteps[currentStep];
    const timeout = setTimeout(() => {
      setCompletedSteps(prev => [...prev, step.id]);
      setCurrentStep(prev => prev + 1);
    }, step.duration);

    return () => clearTimeout(timeout);
  }, [currentStep, onComplete]);

  const progress = ((currentStep) / scanSteps.length) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 animate-pulse">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
            Ethical Framework Review
          </h1>
          <p className="text-muted-foreground">
            Analyzing <span className="font-medium text-foreground">{projectName}</span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {scanSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index === currentStep;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border transition-all duration-300',
                  isCompleted && 'bg-[hsl(var(--ethics-safe-bg))] border-[hsl(var(--ethics-safe)/0.3)]',
                  isCurrent && 'bg-primary/5 border-primary/30',
                  !isCompleted && !isCurrent && 'bg-card border-border/50 opacity-50'
                )}
              >
                <div className={cn(
                  'shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                  isCompleted && 'bg-[hsl(var(--ethics-safe))]',
                  isCurrent && 'bg-primary animate-pulse',
                  !isCompleted && !isCurrent && 'bg-muted'
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className={cn(
                      'w-5 h-5',
                      isCurrent ? 'text-primary-foreground' : 'text-muted-foreground'
                    )} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium text-sm',
                    isCompleted && 'text-[hsl(var(--ethics-safe))]',
                    isCurrent && 'text-foreground',
                    !isCompleted && !isCurrent && 'text-muted-foreground'
                  )}>
                    {isCompleted ? step.label.replace('...', '') : step.label}
                    {isCompleted && ' ✓'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Analyzing indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm">This usually takes a few seconds</span>
        </div>
      </div>
    </div>
  );
}
