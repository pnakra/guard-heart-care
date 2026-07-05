import { describe, it, expect } from 'vitest';
import { VERTICAL_PROFILES as SRC_PROFILES } from '@/data/verticalProfiles';
import { CATEGORY_SIGNALS as SRC_SIGNALS } from '@/services/categoryDetector';
import { VERTICAL_PROFILES as SHARED_PROFILES } from '../../supabase/functions/_shared/verticalProfiles';
import { CATEGORY_SIGNALS as SHARED_SIGNALS } from '../../supabase/functions/_shared/categoryDetector';

// The scanner (edge function) imports the _shared modules; the UI reads the src
// mirrors. If they drift, the taxonomy page no longer reflects what the scanner
// actually does. These assertions fail the build the moment that happens — edit
// the _shared canonical files and mirror the change into src to keep them green.

describe('scanner/UI parity', () => {
  it('vertical profiles match the canonical shared source exactly', () => {
    expect(SRC_PROFILES).toEqual(SHARED_PROFILES);
  });

  it('category detection signals match the canonical shared source exactly', () => {
    expect(SRC_SIGNALS).toEqual(SHARED_SIGNALS);
  });

  it('every detectable category has both signals and a vertical profile', () => {
    const signalKeys = Object.keys(SHARED_SIGNALS).sort();
    const profileKeys = Object.keys(SHARED_PROFILES).sort();
    expect(signalKeys).toEqual(profileKeys);
  });
});
