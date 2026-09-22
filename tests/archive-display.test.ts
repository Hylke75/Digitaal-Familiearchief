import { describe, expect, it } from 'vitest';
import { formatDuration, stripExtension } from '../apps/web/lib/archive/display';

describe('archive display helpers', () => {
  it('strips a trailing file extension', () => {
    expect(stripExtension('Zomer in de tuin.jpg')).toBe('Zomer in de tuin');
    expect(stripExtension('Reisschema Italië.txt')).toBe('Reisschema Italië');
    expect(stripExtension('001_koopakte.pdf')).toBe('001_koopakte');
  });

  it('leaves names without an extension untouched', () => {
    expect(stripExtension('Gezin op het strand')).toBe('Gezin op het strand');
    expect(stripExtension('recept 2.0')).toBe('recept 2.0'); // ".0" isn't an ext
  });

  it('formats durations as m:ss', () => {
    expect(formatDuration(3000)).toBe('0:03');
    expect(formatDuration(75_000)).toBe('1:15');
    expect(formatDuration(0)).toBe('0:00');
  });
});
