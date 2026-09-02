use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy)]
pub struct Point {
    pub lat: f64,
    pub lon: f64,
    pub km: f64,
}

#[derive(Debug, Deserialize)]
pub struct AnalyzeRequest {
    pub gpx: String,
    pub vehicle: String,
    pub region: String,
    pub license: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Prohibited,
    Review,
    Clear,
}

#[derive(Debug, Clone, Serialize)]
pub struct Finding {
    pub id: String,
    pub severity: Severity,
    pub title: String,
    pub explanation: String,
    pub start_km: f64,
    pub end_km: f64,
    pub tags: HashMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub osm_way_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub osm_url: Option<String>,
    pub rule_id: String,
}

#[derive(Debug, Serialize)]
pub struct Source {
    pub label: String,
    pub url: String,
}

#[derive(Debug, Serialize)]
pub struct RulePack {
    pub version: String,
    pub source_date: String,
    pub sources: Vec<Source>,
}

#[derive(Debug, Serialize)]
pub struct Analysis {
    pub route_name: String,
    pub distance_km: f64,
    pub sampled_points: usize,
    pub matched_distance_km: f64,
    pub coverage_percent: f64,
    pub verdict: Severity,
    pub findings: Vec<Finding>,
    pub region: String,
    pub vehicle: String,
    pub rule_pack: RulePack,
    pub caveats: Vec<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct OverpassResponse {
    pub elements: Vec<OverpassWay>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct OverpassWay {
    pub id: i64,
    #[serde(default)]
    pub tags: HashMap<String, String>,
    #[serde(default)]
    pub geometry: Vec<GeoPoint>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct GeoPoint {
    pub lat: f64,
    pub lon: f64,
}
