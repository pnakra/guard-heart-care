import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ShieldOff, Bug, Code2, Brain, Eye, ShieldAlert, Scale, Sparkles, AlertTriangle,
  ArrowRight, ArrowLeft, X, Gauge, BarChart3, ListChecks
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const HARM_CATEGORIES = [
  { icon: Brain, label: 'False Authority', example: 'An AI chatbot that presents itself as a licensed therapist or legal advisor.' },
  { icon: AlertTriangle, label: 'Manipulation', example: 'A "craft response" feature that helps someone pressure a person who already said no.' },
  { icon: Eye, label: 'Surveillance', example: 'A family app that lets one member silently track another\'s location.' },
  { icon: ShieldAlert, label: 'Admin Abuse', example: 'An admin panel that can delete user data with no audit trail or notification.' },
  { icon: Sparkles, label: 'AI Hallucination', example: 'A medical Q&A bot that invents citations to support its answers.' },
  { icon: Scale, label: 'Dark Patterns', example: 'A cancellation flow that requires 7 clicks and a phone call to complete.' },
];

const NOT_ITEMS = [
  { icon: ShieldOff, label: 'Not a security scanner' },
  { icon: Bug, label: 'Not a bug finder' },
  { icon: Code2, label: 'Not a linter' },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);

  const handleComplete = () => {
    localStorage.setItem('gfc_onboarding_complete', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/50' : 'w-4 bg-muted'
              )}
            />
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {/* Skip button */}
          <div className="flex justify-end mb-4">
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground text-xs gap-1">
              <X size={14} /> Skip intro
            </Button>
          </div>

          {/* Step 1 */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-xl font-bold font-mono text-foreground">
                  Ground Floor Check scans for misuse-by-design
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your AI coding assistant helps you build fast. It won't tell you when your features could be weaponized. That's what this does.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                {NOT_ITEMS.map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 border border-border">
                    <item.icon size={24} className="text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground text-center">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold font-mono text-foreground">What we look for</h2>
                <p className="text-sm text-muted-foreground">Six categories of harm-by-design.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HARM_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="flex gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                    <cat.icon size={18} className="text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-mono font-medium text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cat.example}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold font-mono text-foreground">How to read results</h2>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
                  <Gauge size={20} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-mono font-medium text-foreground">Ground Floor Score (0–100)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Higher is safer. Below 50 means serious design-level risks were found.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
                  <BarChart3 size={20} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-mono font-medium text-foreground">Severity levels</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Critical and High need action before shipping. Medium and Low are worth reviewing.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
                  <ListChecks size={20} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-mono font-medium text-foreground">Triage workflow</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Mark issues as accepted, disputed, or fixed. Apply suggested code changes directly.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className="gap-1"
            >
              <ArrowLeft size={14} /> Back
            </Button>
            
            {step < 2 ? (
              <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1">
                Next <ArrowRight size={14} />
              </Button>
            ) : (
              <Button size="sm" onClick={handleComplete} className="gap-1">
                Start scanning <ArrowRight size={14} />
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Step {step + 1} of 3
        </p>
      </div>
    </div>
  );
}
