export type Severity = 'prohibited' | 'review' | 'clear';

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  explanation: string;
  start_km: number;
  end_km: number;
  tags: Record<string, string>;
  osm_way_id?: number;
  osm_url?: string;
  rule_id: string;
}

export interface Analysis {
  route_name: string;
  distance_km: number;
  sampled_points: number;
  matched_distance_km: number;
  coverage_percent: number;
  verdict: Severity;
  findings: Finding[];
  region: string;
  vehicle: string;
  rule_pack: { version: string; source_date: string; sources: { label: string; url: string }[] };
  caveats: string[];
}
