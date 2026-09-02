use std::{
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    process::{Command, Stdio},
    thread,
    time::{Duration, Instant},
};

#[test]
fn binary_starts_with_only_port_and_creates_database() {
    let runtime_root = tempfile::tempdir().expect("temporary runtime root");
    let port_probe = TcpListener::bind("127.0.0.1:0").expect("reserve a local port");
    let port = port_probe
        .local_addr()
        .expect("reserved port address")
        .port();
    drop(port_probe);

    let mut child = Command::new(env!("CARGO_BIN_EXE_cycle-legal-profile-check"))
        .env_clear()
        .env("PORT", port.to_string())
        .current_dir(runtime_root.path())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("start production binary with only PORT");

    let deadline = Instant::now() + Duration::from_secs(15);
    let health_response = loop {
        if let Some(status) = child.try_wait().expect("inspect child status") {
            panic!("server exited before health check with {status}");
        }
        if let Ok(mut connection) = TcpStream::connect(("127.0.0.1", port)) {
            connection
                .set_read_timeout(Some(Duration::from_secs(2)))
                .expect("health read timeout");
            connection
                .write_all(b"GET /health HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n")
                .expect("send health request");
            let mut response = String::new();
            connection
                .read_to_string(&mut response)
                .expect("read health response");
            break response;
        }
        assert!(
            Instant::now() < deadline,
            "server did not listen within 15 seconds"
        );
        thread::sleep(Duration::from_millis(25));
    };

    child.kill().expect("stop test server");
    let output = child.wait_with_output().expect("collect server output");
    let startup_log = format!(
        "{}{}",
        String::from_utf8(output.stdout).expect("UTF-8 stdout log"),
        String::from_utf8(output.stderr).expect("UTF-8 stderr log")
    );
    assert!(health_response.starts_with("HTTP/1.1 200 OK"));
    assert!(health_response.contains(r#""status":"ok""#));
    assert!(health_response.contains(r#""build":"dev""#));
    assert!(
        runtime_root.path().join("cycle-legal.sqlite").is_file(),
        "first boot must create the fallback SQLite database"
    );
    let database_header =
        std::fs::read(runtime_root.path().join("cycle-legal.sqlite")).expect("SQLite file");
    assert!(database_header.starts_with(b"SQLite format 3\0"));
    assert!(
        startup_log.contains(r#""database_config":"generated default""#),
        "startup log did not identify generated configuration: {startup_log}"
    );
    assert!(!startup_log.contains("DATABASE_URL"));
}
