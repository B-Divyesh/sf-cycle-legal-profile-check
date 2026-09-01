use crate::model::*;
use roxmltree::Document;
use std::collections::{HashMap, HashSet};
use thiserror::Error;

const MATCH_RADIUS_KM: f64 = 0.035;
const MATCH_RADIUS_METRES: u8 = 35;
const SAMPLE_DISTANCE_EPSILON_KM: f64 = 0.000_000_001;

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

pub(crate) fn validate_vehicle(vehicle: &str) -> Result<(), AnalyzeError> {
    if matches!(vehicle, "bicycle" | "ebike_25" | "speed_pedelec") {
        Ok(())
    } else {
        Err(AnalyzeError::Vehicle)
    }
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
        // GPS distances and the one-sixtieth interval are floating-point
        // values. Permit a sub-micrometre rounding difference so a point at
        // the intended interval is not accidentally skipped.
        if point.km + SAMPLE_DISTANCE_EPSILON_KM >= next || sampled.is_empty() {
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
        .map(|point| {
            format!(
                "way(around:{MATCH_RADIUS_METRES},{:.6},{:.6})[highway];",
                point.lat, point.lon
            )
        })
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
    validate_vehicle(vehicle)?;
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
                    (distance <= MATCH_RADIUS_KM).then_some((way, distance))
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
        return assess_speed_pedelec_region(tags, region);
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

/// Apply the maintained, conservative regional rules after explicit OSM tags
/// and universal access restrictions have been handled. A `highway=cycleway`
/// tag means a different default for a 45 km/h speed pedelec in each pack:
/// Belgium needs a sign review, Dutch cycleways need a mapped moped-path
/// permission, and German cycleways need an explicit exception. These are
/// decision differences, not just source-label differences.
fn assess_speed_pedelec_region(
    tags: &HashMap<String, String>,
    region: &str,
) -> (Severity, &'static str, &'static str, &'static str) {
    let value = |key: &str| tags.get(key).map(String::as_str).unwrap_or("");
    let moped_path = matches!(value("moped"), "yes" | "designated");

    if value("highway") != "cycleway" {
        return match region {
            "BE" => (
                Severity::Review,
                "Belgian speed-pedelec access is not tagged",
                "BE-SP-TAG-UNKNOWN",
                "The map has no explicit speed-pedelec access tag. Check the road class, signs, and current Belgian rules.",
            ),
            "NL" => (
                Severity::Review,
                "Dutch speed-pedelec access is not tagged",
                "NL-SP-TAG-UNKNOWN",
                "The map has no explicit speed-pedelec access tag. Check the road class, signs, and current Dutch rules.",
            ),
            _ => (
                Severity::Review,
                "German speed-pedelec access is not tagged",
                "DE-SP-TAG-UNKNOWN",
                "The map has no explicit speed-pedelec access tag. Check the road class, signs, and current German rules.",
            ),
        };
    }

    match region {
        "BE" => (
            Severity::Review,
            "Belgian cycleway needs a sign check",
            "BE-SP-CYCLEWAY-SIGN-CHECK",
            if moped_path {
                "The map marks moped access, but Belgian speed-pedelec use still depends on the applicable sign and local conditions. Check the sign before riding."
            } else {
                "Belgian speed-pedelec access to a cycleway depends on signing and local conditions. The map has no explicit speed-pedelec or moped-path permission."
            },
        ),
        "NL" if moped_path => (
            Severity::Clear,
            "Dutch moped path is tagged for access",
            "NL-SP-MOPED-PATH-YES",
            "The matched cycleway is tagged as a moped path. This is the map evidence the Dutch speed-pedelec pack expects; still check signs and local restrictions.",
        ),
        "NL" => (
            Severity::Prohibited,
            "Dutch cycleway is not a mapped moped path",
            "NL-SP-CYCLEWAY-NO-MOPED-PATH",
            "A Dutch speed pedelec needs moped-path permission on a cycleway. No mapped moped-path permission is present, so treat this section as prohibited until signs confirm otherwise.",
        ),
        "DE" if moped_path => (
            Severity::Review,
            "German cycleway exception needs a sign check",
            "DE-SP-CYCLEWAY-SIGNED-EXCEPTION",
            "The map marks moped access, but that does not by itself establish a German speed-pedelec exception. Check the sign before riding.",
        ),
        _ => (
            Severity::Prohibited,
            "German cycleway has no speed-pedelec exception",
            "DE-SP-CYCLEWAY-NO-EXCEPTION",
            "German speed pedelecs need an explicit exception to use a cycleway. No mapped exception is present, so treat this section as prohibited until signs confirm otherwise.",
        ),
    }
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
            "Netherlands government: speed-pedelec rules",
            "https://www.rijksoverheid.nl/onderwerpen/bromfiets/vraag-en-antwoorden/welke-regels-gelden-voor-speed-pedelecs",
        ),
        "DE" => (
            "Germany Road Traffic Regulations § 2",
            "https://www.gesetze-im-internet.de/stvo_2013/__2.html",
        ),
        _ => (
            "Belgium road code: speed-pedelec rules",
            "https://mobilit.belgium.be/en/road/road-safety/road-rules",
        ),
    };
    RulePack {
        version: "2026.09".into(),
        source_date: "2026-09-01".into(),
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

    #[test]
    fn germany_pack_links_to_the_road_traffic_regulations() {
        let source = &rule_pack("DE").sources[0];
        assert_eq!(source.label, "Germany Road Traffic Regulations § 2");
        assert_eq!(
            source.url,
            "https://www.gesetze-im-internet.de/stvo_2013/__2.html"
        );
    }

    #[test]
    fn regional_cycleway_rules_are_distinct_and_cautious() {
        let untagged_cycleway = HashMap::from([("highway".into(), "cycleway".into())]);
        let belgium = assess_tags(&untagged_cycleway, "speed_pedelec", "BE");
        let netherlands = assess_tags(&untagged_cycleway, "speed_pedelec", "NL");
        let germany = assess_tags(&untagged_cycleway, "speed_pedelec", "DE");

        assert_eq!(belgium.0, Severity::Review);
        assert_eq!(belgium.2, "BE-SP-CYCLEWAY-SIGN-CHECK");
        assert_eq!(netherlands.0, Severity::Prohibited);
        assert_eq!(netherlands.2, "NL-SP-CYCLEWAY-NO-MOPED-PATH");
        assert_eq!(germany.0, Severity::Prohibited);
        assert_eq!(germany.2, "DE-SP-CYCLEWAY-NO-EXCEPTION");
        assert_ne!(belgium.2, netherlands.2);
        assert_ne!(netherlands.2, germany.2);

        let mapped_moped_path = HashMap::from([
            ("highway".into(), "cycleway".into()),
            ("moped".into(), "designated".into()),
        ]);
        assert_eq!(
            assess_tags(&mapped_moped_path, "speed_pedelec", "BE").0,
            Severity::Review
        );
        assert_eq!(
            assess_tags(&mapped_moped_path, "speed_pedelec", "NL").0,
            Severity::Clear
        );
        assert_eq!(
            assess_tags(&mapped_moped_path, "speed_pedelec", "DE").0,
            Severity::Review
        );
    }

    #[test]
    fn sampling_rule_uses_eighty_metres_or_one_sixtieth_of_route_length() {
        let short_route = [
            Point {
                lat: 0.0,
                lon: 0.0,
                km: 0.0,
            },
            Point {
                lat: 0.0,
                lon: 0.0,
                km: 0.04,
            },
            Point {
                lat: 0.0,
                lon: 0.0,
                km: 0.08,
            },
            Point {
                lat: 0.0,
                lon: 0.0,
                km: 0.16,
            },
        ];
        let short_samples: Vec<_> = sample_points(&short_route)
            .into_iter()
            .map(|point| point.km)
            .collect();
        assert_eq!(short_samples, vec![0.0, 0.08, 0.16]);

        let long_route: Vec<_> = (0..=60)
            .map(|index| Point {
                lat: 0.0,
                lon: 0.0,
                km: index as f64 * 0.1,
            })
            .collect();
        let long_samples = sample_points(&long_route);
        assert_eq!(long_samples.len(), 61);
        assert_eq!(long_samples[1].km, 6.0 / 60.0);
    }

    #[test]
    fn matching_radius_is_thirty_five_metres() {
        let point = Point {
            lat: 50.0,
            lon: 4.0,
            km: 0.0,
        };
        let way_at = |metres: f64| OverpassWay {
            id: 1,
            tags: HashMap::from([("highway".into(), "residential".into())]),
            geometry: vec![
                GeoPoint {
                    lat: 50.0 + metres / 111_195.0,
                    lon: 3.999,
                },
                GeoPoint {
                    lat: 50.0 + metres / 111_195.0,
                    lon: 4.001,
                },
            ],
        };
        let near = distance_to_way(point, &way_at(34.0));
        let far = distance_to_way(point, &way_at(36.0));
        assert!((near * 1000.0 - 34.0).abs() < 0.2);
        assert!((far * 1000.0 - 36.0).abs() < 0.2);
        assert!(near <= MATCH_RADIUS_KM);
        assert!(far > MATCH_RADIUS_KM);

        let query = overpass_query(&[
            point,
            Point {
                lat: 50.0,
                lon: 4.001,
                km: 0.1,
            },
        ]);
        assert!(query.contains("way(around:35,50.000000,4.000000)[highway]"));
    }
}
