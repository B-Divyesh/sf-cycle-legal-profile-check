import http2 from 'node:http2';

const baseUrl = new URL(
  process.env.VERIFY_BASE_URL ?? 'https://cycle-legal-profile-check.sociobot.in',
);
const expectedBuild = process.env.EXPECTED_BUILD_SHA;
const requestCount = 60;

function request(session, method, path) {
  return new Promise((resolve, reject) => {
    const stream = session.request({
      ':method': method,
      ':path': path,
      'content-length': '0',
    });
    let responseHeaders;
    let body = '';
    stream.setEncoding('utf8');
    stream.on('response', headers => {
      responseHeaders = headers;
    });
    stream.on('data', chunk => {
      body += chunk;
    });
    stream.on('end', () => {
      resolve({
        status: Number(responseHeaders[':status']),
        retryAfter: responseHeaders['retry-after'],
        body,
      });
    });
    stream.on('error', reject);
    stream.end();
  });
}

const session = http2.connect(baseUrl.origin);
session.on('error', error => {
  throw error;
});

try {
  const health = await request(session, 'GET', '/health');
  if (health.status !== 200) {
    throw new Error(`/health returned ${health.status}: ${health.body}`);
  }
  const identity = JSON.parse(health.body);
  if (expectedBuild && identity.build !== expectedBuild) {
    throw new Error(`Expected build ${expectedBuild}, received ${identity.build}`);
  }

  // Every stream shares this one HTTP/2 session and therefore one ingress
  // client identity. The burst must exceed the 40-request allowance.
  const responses = await Promise.all(
    Array.from({ length: requestCount }, () => request(session, 'POST', '/api/page-view')),
  );
  const accepted = responses.filter(response => response.status === 204);
  const throttled = responses.filter(response => response.status === 429);
  const unexpected = responses.filter(response => ![204, 429].includes(response.status));

  if (unexpected.length > 0) {
    throw new Error(`Unexpected statuses: ${unexpected.map(response => response.status).join(', ')}`);
  }
  if (throttled.length === 0) {
    throw new Error(`Limiter allowed all ${requestCount} requests from one HTTP/2 client`);
  }
  for (const response of throttled) {
    if (!/^\d+$/.test(response.retryAfter ?? '') || Number(response.retryAfter) < 1) {
      throw new Error(`429 response had invalid Retry-After: ${response.retryAfter ?? '<missing>'}`);
    }
  }

  console.log(
    JSON.stringify({
      build: identity.build,
      http2SessionCount: 1,
      requestCount,
      accepted: accepted.length,
      throttled: throttled.length,
      retryAfter: [...new Set(throttled.map(response => response.retryAfter))],
    }),
  );
} finally {
  session.close();
}
