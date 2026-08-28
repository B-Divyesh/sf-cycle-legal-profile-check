use crate::model::*;
use roxmltree::Document;
use std::collections::{HashMap, HashSet};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AnalyzeError {
    #[error("The GPX is not valid XML.")]
    Xml,
    #[error("The GPX needs at least two valid track or route points.")]
    TooFewPoints,
    #[error("The GPX has more than 20,000 points. Simplify the track and try again.")]
    TooManyPoints,
    #[error("That vehicle class is not supported.")]
    Vehicle,
    #[error("That regional rule pack is not supported.")]
    Region,
}

pub fn parse_gpx(xml: &str) -> Result<(String, Vec<Point>), AnalyzeError> {
    let document = Document::parse(xml).map_err(|_| AnalyzeError::Xml)?;
    let mut points = Vec::new();
    let mut km = 0.0;
    for node in document
        .descendants()
        .filter(|n| matches!(n.tag_name().name(), "trkpt" | "rtept"))
    {
        let lat = node.attribute("lat").and_then(|v| v.parse::<f64>().ok());
        let lon = node.attribute("lon").and_then(|v| v.parse::<f64>().ok());
        if let (Some(lat), Some(lon)) = (lat, lon) {
            if !((-90.0..=90.0).contains(&lat) && (-180.0..=180.0).contains(&lon)) {
                continue;
            }
            if let Some(previous) = points.last() {
                km += haversine(*previous, Point { lat, lon, km: 0.0 });
            }
            points.push(Point { lat, lon, km });
            if points.len() > 20_000 {
                return Err(AnalyzeError::TooManyPoints);
            }
        }
    }
    if points.len() < 2 {
        return Err(AnalyzeError::TooFewPoints);
    }
    let name = document
        .descendants()
        .find(|n| n.tag_name().name() == "name")
        .and_then(|n| n.text())
        .unwrap_or("Unnamed route")
        .trim()
        .chars()
        .take(120)
        .collect();
    Ok((name, points))
}

pub fn sample_points(points: &[Point]) -> Vec<Point> {
    let total = points.last().map(|p| p.km).unwrap_or(0.0);
    let interval = (total / 60.0).max(0.08);
    let mut next = 0.0;
    let mut sampled = Vec::new();
    for point in points {
        if point.km >= next || sampled.is_empty() {
            sampled.push(*point);
            next = point.km + interval;
        }
    }
    if sampled.last().map(|p| p.km) != points.last().map(|p| p.km) {
        sampled.push(*points.last().unwrap());
    }
    sampled
}

pub fn overpass_query(points: &[Point]) -> String {
    let points = sample_points(points);
    let clauses = points
        .iter()
        .map(|point| format!("way(around:35,{:.6},{:.6})[highway];", point.lat, point.lon))
        .collect::<String>();
    format!("[out:json][timeout:20];({clauses});out tags geom;")
}

pub fn analyze(
    name: String,
    points: &[Point],
    ways: &[OverpassWay],
    vehicle: &str,
    region: &str,
    map_available: bool,
) -> Result<Analysis, AnalyzeError> {
    if !matches!(vehicle, "bicycle" | "ebike_25" | "speed_pedelec") {
        return Err(AnalyzeError::Vehicle);
    }
    if !matches!(region, "BE" | "NL" | "DE") {
        return Err(AnalyzeError::Region);
    }
    let samples = sample_points(points);
    let mut matches: Vec<Option<&OverpassWay>> = Vec::with_capacity(samples.len());
    for sample in &samples {
        matches.push(
            ways.iter()
                .filter_map(|way| {
                    let distance = distance_to_way(*sample, way);
                    (distance <= 0.035).then_some((way, distance))
                })
                .min_by(|a, b| a.1.total_cmp(&b.1))
                .map(|pair| pair.0),
        );
    }
    let matched = matches.iter().filter(|item| item.is_some()).count();
    let coverage = if samples.is_empty() {
        0.0
    } else {
        matched as f64 / samples.len() as f64 * 100.0
    };
    let total = points.last().map(|p| p.km).unwrap_or(0.0);
    let mut findings = Vec::new();
    let mut seen = HashSet::new();
    for (index, way) in matches.iter().enumerate() {
        let Some(way) = way else { continue };
        let assessment = assess_tags(&way.tags, vehicle, region);
        if assessment.0 == Severity::Clear || !seen.insert((way.id, assessment.2)) {
            continue;
        }
        findings.push(Finding {
            id: format!("way-{}", way.id),
            severity: assessment.0,
            title: assessment.1.into(),
            explanation: assessment.3.into(),
            start_km: round1(samples[index].km),
            end_km: round1(
                (samples[index].km + (total / samples.len() as f64).max(0.1)).min(total),
            ),
            tags: relevant_tags(&way.tags),
            osm_way_id: Some(way.id),
            osm_url: Some(format!("https://www.openstreetmap.org/way/{}", way.id)),
            rule_id: assessment.2.into(),
        });
    }
    if matched < samples.len() {
        let unmatched_indices: Vec<_> = matches
            .iter()
            .enumerate()
            .filter(|(_, item)| item.is_none())
            .map(|(index, _)| index)
            .collect();
        let first = *unmatched_indices.first().unwrap();
        let last = *unmatched_indices.last().unwrap();
        findings.push(Finding { id: "unmatched".into(), severity: Severity::Review, title: "Map evidence is missing".into(),
            explanation: if map_available { "Some route samples did not match a nearby mapped highway. Check signs, recent map changes, and the route line before riding." } else { "The map evidence service did not respond, so access tags could not be checked. Retry before departure or review the route manually." }.into(),
            start_km: round1(samples[first].km), end_km: round1(samples[last].km), tags: HashMap::new(), osm_way_id: None, osm_url: None, rule_id: "COVERAGE-UNKNOWN".into() });
    }
    if findings.is_empty() {
        findings.push(Finding { id: "passed".into(), severity: Severity::Clear, title: "Tagged sections passed this rule pack".into(),
            explanation: "No prohibited or vehicle-mismatched tags were found on matched ways. Recheck signs and any route changes before riding.".into(),
            start_km: 0.0, end_km: round1(total), tags: HashMap::new(), osm_way_id: None, osm_url: None, rule_id: "PACK-PASS".into() });
    }
    findings.sort_by(|a, b| {
        severity_rank(&a.severity)
            .cmp(&severity_rank(&b.severity))
            .then(a.start_km.total_cmp(&b.start_km))
    });
    let verdict = if findings.iter().any(|f| f.severity == Severity::Prohibited) {
        Severity::Prohibited
    } else if findings.iter().any(|f| f.severity == Severity::Review) {
        Severity::Review
    } else {
        Severity::Clear
    };
    Ok(Analysis { route_name: name, distance_km: round1(total), sampled_points: samples.len(), matched_distance_km: round1(total * coverage / 100.0), coverage_percent: coverage,
        verdict, findings, region: region.into(), vehicle: vehicle.into(), rule_pack: rule_pack(region), caveats: vec![
            "OpenStreetMap tags may be incomplete, stale, or interpreted differently by local authorities.".into(),
            "Temporary closures, signs, time restrictions, and turn-specific rules may not be represented.".into(),
            "Matching is approximate within 35 metres and can select the wrong way on parallel paths.".into(),
        ] })
}

pub fn assess_tags(
    tags: &HashMap<String, String>,
    vehicle: &str,
    region: &str,
) -> (Severity, &'static str, &'static str, &'static str) {
    let value = |key: &str| tags.get(key).map(String::as_str).unwrap_or("");
    let forbidden = |v: &str| matches!(v, "no" | "private");
    if forbidden(value("bicycle")) {
        return (Severity::Prohibited, "Bicycle access is tagged as prohibited", "OSM-BICYCLE-NO", "The matched way carries bicycle=no/private. Treat this section as closed to the selected cycle unless current signs explicitly say otherwise.");
    }
    if forbidden(value("access"))
        && !matches!(value("bicycle"), "yes" | "designated" | "permissive")
    {
        return (Severity::Prohibited, "General access is restricted", "OSM-ACCESS-RESTRICTED", "The way has access=no/private without an explicit bicycle exception. Confirm an exemption before using it.");
    }
    if vehicle == "speed_pedelec" {
        if forbidden(value("speed_pedelec")) {
            return (
                Severity::Prohibited,
                "Speed pedelec access is prohibited",
                "SP-EXPLICIT-NO",
                "An explicit speed_pedelec=no/private tag conflicts with the selected vehicle.",
            );
        }
        if matches!(value("speed_pedelec"), "yes" | "designated" | "permissive") {
            return (
                Severity::Clear,
                "Explicit speed pedelec access",
                "SP-EXPLICIT-YES",
                "The way explicitly allows speed pedelecs in current OSM data.",
            );
        }
        if forbidden(value("moped")) || forbidden(value("mofa")) {
            return (Severity::Prohibited, "Moped-class access may conflict", "SP-MOPED-NO", "This region treats 45 km/h speed pedelecs as a moped-class vehicle, while the matched way prohibits the relevant moped class.");
        }
        if value("highway") == "cycleway" && !matches!(value("moped"), "yes" | "designated") {
            return (
                Severity::Review,
                "Cycleway needs a speed-pedelec check",
                "SP-CYCLEWAY-UNKNOWN",
                if region == "BE" {
                    "Belgian speed pedelec access to cycle tracks depends on signing, speed limits, and local conditions. The map has no explicit speed-pedelec/moped permission here."
                } else {
                    "Speed-pedelec use of this cycleway is jurisdiction- and sign-dependent. The map has no explicit vehicle-specific permission."
                },
            );
        }
        return (Severity::Review, "Vehicle-specific access is not tagged", "SP-TAG-UNKNOWN", "The matched way has no explicit speed-pedelec access tag. Check the road class, signs, and current regional rules.");
    }
    if matches!(value("bicycle"), "yes" | "designated" | "permissive") {
        return (
            Severity::Clear,
            "Bicycle access is tagged",
            "BIKE-EXPLICIT-YES",
            "The matched way explicitly allows bicycles.",
        );
    }
    (
        Severity::Clear,
        "No tagged bicycle conflict",
        "BIKE-DEFAULT",
        "No bicycle-specific conflict was found in the matched tags.",
    )
}

fn relevant_tags(tags: &HashMap<String, String>) -> HashMap<String, String> {
    const KEYS: &[&str] = &[
        "highway",
        "access",
        "bicycle",
        "speed_pedelec",
        "moped",
        "mofa",
        "vehicle",
        "motor_vehicle",
        "surface",
        "maxspeed",
        "traffic_sign",
    ];
    tags.iter()
        .filter(|(key, _)| KEYS.contains(&key.as_str()))
        .map(|(key, value)| (key.clone(), value.clone()))
        .collect()
}

fn rule_pack(region: &str) -> RulePack {
    let (label, legal) = match region {
        "NL" => (
            "Netherlands traffic rules for speed pedelecs",
            "https://www.government.nl/topics/bicycles/safe-cycling",
        ),
        "DE" => (
            "Germany road traffic guidance",
            "https://bmdv.bund.de/SharedDocs/EN/Articles/StV/Roadtraffic/cycling.html",
        ),
        _ => (
            "Belgium road code: cycling and speed pedelecs",
            "https://mobilit.belgium.be/en/road/road-safety/road-rules",
        ),
    };
    RulePack {
        version: "2026.08".into(),
        source_date: "2026-08-01".into(),
        sources: vec![
            Source {
                label: label.into(),
                url: legal.into(),
            },
            Source {
                label: "OpenStreetMap bicycle access tagging".into(),
                url: "https://wiki.openstreetmap.org/wiki/Key:bicycle".into(),
            },
            Source {
                label: "OpenStreetMap access tagging".into(),
                url: "https://wiki.openstreetmap.org/wiki/Key:access".into(),
            },
        ],
    }
}

fn severity_rank(value: &Severity) -> u8 {
    match value {
        Severity::Prohibited => 0,
        Severity::Review => 1,
        Severity::Clear => 2,
    }
}
fn round1(value: f64) -> f64 {
    (value * 10.0).round() / 10.0
}
fn haversine(a: Point, b: Point) -> f64 {
    let r = 6371.0;
    let dlat = (b.lat - a.lat).to_radians();
    let dlon = (b.lon - a.lon).to_radians();
    let v = (dlat / 2.0).sin().powi(2)
        + a.lat.to_radians().cos() * b.lat.to_radians().cos() * (dlon / 2.0).sin().powi(2);
    r * 2.0 * v.sqrt().atan2((1.0 - v).sqrt())
}
fn distance_to_way(point: Point, way: &OverpassWay) -> f64 {
    if way.geometry.len() < 2 {
        return f64::MAX;
    }
    way.geometry
        .windows(2)
        .map(|pair| point_segment_km(point, &pair[0], &pair[1]))
        .fold(f64::MAX, f64::min)
}
fn point_segment_km(p: Point, a: &GeoPoint, b: &GeoPoint) -> f64 {
    let scale = p.lat.to_radians().cos();
    let px = p.lon * scale;
    let py = p.lat;
    let ax = a.lon * scale;
    let ay = a.lat;
    let bx = b.lon * scale;
    let by = b.lat;
    let dx = bx - ax;
    let dy = by - ay;
    let t = if dx * dx + dy * dy == 0.0 {
        0.0
    } else {
        ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    }
    .clamp(0.0, 1.0);
    let q = Point {
        lat: ay + t * dy,
        lon: (ax + t * dx) / scale,
        km: 0.0,
    };
    haversine(p, q)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn parses_and_measures_gpx() {
        let (_, points)=parse_gpx("<gpx><trk><name>Test</name><trkseg><trkpt lat='50' lon='4'/><trkpt lat='50.01' lon='4'/></trkseg></trk></gpx>").unwrap();
        assert!(points[1].km > 1.0);
    }
    #[test]
    fn rejects_short_gpx() {
        assert!(matches!(
            parse_gpx("<gpx><trkpt lat='50' lon='4'/></gpx>"),
            Err(AnalyzeError::TooFewPoints)
        ));
    }
    #[test]
    fn bicycle_no_is_prohibited() {
        let tags = HashMap::from([("bicycle".into(), "no".into())]);
        assert_eq!(assess_tags(&tags, "bicycle", "BE").0, Severity::Prohibited);
    }
    #[test]
    fn speed_pedelec_cycleway_is_uncertain() {
        let tags = HashMap::from([("highway".into(), "cycleway".into())]);
        assert_eq!(
            assess_tags(&tags, "speed_pedelec", "BE").0,
            Severity::Review
        );
    }
    #[test]
    fn unmatched_route_is_review() {
        let (_, points) =
            parse_gpx("<gpx><trkpt lat='50' lon='4'/><trkpt lat='50.01' lon='4'/></gpx>").unwrap();
        let report = analyze("X".into(), &points, &[], "bicycle", "BE", false).unwrap();
        assert_eq!(report.verdict, Severity::Review);
        assert_eq!(report.coverage_percent, 0.0);
    }
}
