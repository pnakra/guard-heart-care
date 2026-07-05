import { useState } from 'react';

// Billing flow full of coercive UX: buried cancellation, confirm-shaming,
// a fake countdown, and a pre-checked auto-renew consent box.
export function CancelFlow() {
  const [step, setStep] = useState(0);
  // Cancellation is intentionally 6 steps deep with a retention gauntlet.
  const steps = ['Are you sure?', 'Wait!', 'Special offer', 'Really?', 'Last chance', 'Confirm'];
  return (
    <div>
      <p>{steps[step]}</p>
      <button onClick={() => setStep((s) => s + 1)}>Keep my subscription</button>
      <a className="tiny-grey-link" href="/cancel/final">
        No thanks, I don't want to save money and I hate exclusive perks
      </a>
    </div>
  );
}

export function Checkout() {
  return (
    <form>
      {/* Fake urgency not tied to real inventory */}
      <div className="countdown">Only 2 left! Offer ends in 04:59</div>
      {/* Pre-checked auto-renew, buried disclosure */}
      <input type="checkbox" defaultChecked name="autoRenew" />
      <span style={{ fontSize: 8 }}>You will be charged $99/mo after the trial.</span>
    </form>
  );
}
