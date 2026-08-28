import { describe, expect, it } from 'vitest';
import { checklistCsv, verdictCopy } from './ui';

describe('result helpers', () => {
  it('escapes checklist cells', () => {
    const csv = checklistCsv({ route_name: 'A, B', region: 'BE', vehicle: 'speed_pedelec', findings: [{ severity: 'review', title: 'Check "gate"', start_km: 1.2, end_km: 1.3, explanation: 'Inspect', osm_url: 'https://www.openstreetmap.org/way/1' }] } as never);
    expect(csv).toContain('"A, B"');
    expect(csv).toContain('"Check ""gate"""');
  });

  it('writes verdicts without relying on color', () => {
    expect(verdictCopy('prohibited')).toMatch(/conflict/i);
    expect(verdictCopy('review')).toMatch(/review/i);
    expect(verdictCopy('clear')).toMatch(/No tagged conflicts/i);
  });
});
