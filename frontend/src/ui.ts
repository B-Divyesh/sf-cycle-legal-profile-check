import type { Analysis, Severity } from './types';

export const verdictCopy = (verdict: Severity) => ({
  prohibited: 'Access conflict found',
  review: 'Manual review needed',
  clear: 'No tagged conflicts found',
}[verdict]);

const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export function checklistCsv(result: Analysis): string {
  const header = ['route', 'region', 'vehicle', 'status', 'from_km', 'to_km', 'check', 'reason', 'osm_evidence'];
  const rows = result.findings.map((finding) => [
    result.route_name, result.region, result.vehicle, finding.severity, finding.start_km,
    finding.end_km, finding.title, finding.explanation, finding.osm_url ?? '',
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

export function downloadChecklist(result: Analysis) {
  const blob = new Blob([checklistCsv(result)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${result.route_name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'route'}-legal-review.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
