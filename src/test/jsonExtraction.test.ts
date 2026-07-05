import { describe, it, expect } from 'vitest';
import { extractJsonObject, isLikelyTruncated } from '../../supabase/functions/_shared/jsonExtraction';

describe('extractJsonObject', () => {
  it('parses a plain JSON object', () => {
    expect(extractJsonObject('{"a":1,"b":"x"}')).toEqual({ a: 1, b: 'x' });
  });

  it('strips markdown code fences', () => {
    expect(extractJsonObject('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it('ignores prose before and after the object', () => {
    expect(extractJsonObject('Sure, here it is:\n{"n":2}\nHope that helps!')).toEqual({ n: 2 });
  });

  it('tolerates trailing commas', () => {
    expect(extractJsonObject('{"a":1,"b":[1,2,],}')).toEqual({ a: 1, b: [1, 2] });
  });

  it('does not treat braces inside strings as structural', () => {
    expect(extractJsonObject('{"text":"a } b { c"}')).toEqual({ text: 'a } b { c' });
  });

  it('strips a leading UTF-8 BOM', () => {
    expect(extractJsonObject(String.fromCharCode(0xfeff) + '{"a":1}')).toEqual({ a: 1 });
  });

  it('throws when no object is present', () => {
    expect(() => extractJsonObject('no json here')).toThrow(/No JSON object/);
  });

  it('throws when the object is truncated (never closes)', () => {
    expect(() => extractJsonObject('{"a":1,"b":')).toThrow(/ended before/);
  });
});

describe('isLikelyTruncated', () => {
  it('returns false for a complete, balanced object', () => {
    expect(isLikelyTruncated('{"a":1}')).toBe(false);
  });

  it('returns true for empty input', () => {
    expect(isLikelyTruncated('   ')).toBe(true);
  });

  it('returns true when braces are unbalanced', () => {
    expect(isLikelyTruncated('{"a":{"b":1}')).toBe(true);
  });

  it('returns true on an ellipsis marker', () => {
    expect(isLikelyTruncated('{"a":1} ...')).toBe(true);
  });

  it('returns true on a [truncated] marker', () => {
    expect(isLikelyTruncated('{"a":1} [truncated]')).toBe(true);
  });

  it('is not fooled by braces inside strings', () => {
    expect(isLikelyTruncated('{"text":"unclosed { brace"}')).toBe(false);
  });
});
