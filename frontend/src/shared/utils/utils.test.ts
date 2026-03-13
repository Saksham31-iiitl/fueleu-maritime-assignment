import { describe, it, expect } from 'vitest';
import { formatNumber, formatCB, cn } from '../shared/utils';

describe('formatNumber', () => {
  it('should format millions', () => {
    expect(formatNumber(1500000)).toBe('1.5M');
  });
  it('should format thousands', () => {
    expect(formatNumber(4500)).toBe('4.5K');
  });
  it('should format small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatCB', () => {
  it('should format positive CB with +', () => {
    expect(formatCB(1500000)).toBe('+1.50M');
  });
  it('should format negative CB with -', () => {
    expect(formatCB(-340000)).toBe('-340.0K');
  });
  it('should format zero', () => {
    expect(formatCB(0)).toBe('+0');
  });
});

describe('cn', () => {
  it('should join class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });
  it('should filter falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});
