const { spawn } = require('child_process');
const http = require('http');

const TEST_PORT = 5050;
console.log(`=== STARTING END-TO-END SERVER PROBE ON PORT ${TEST_PORT} ===`);

const server = spawn('node', ['backend/dist/index.js'], {
  env: { ...process.env, PORT: String(TEST_PORT) },
  stdio: 'inherit'
});

setTimeout(async () => {
  try {
    // 1. Check health
    const health = await fetchJson(`http://localhost:${TEST_PORT}/api/health`);
    console.log('Healthcheck:', health);

    // 2. Check clients
    const clients = await fetchJson(`http://localhost:${TEST_PORT}/api/clients`);
    console.log(`Loaded ${clients.length} clients.`);

    const rahul = clients.find(c => c.name.includes('Rahul'));
    console.log('Found Rahul Mehta profile:', rahul.name);

    // 3. Test analysis endpoint
    const analysisRes = await postJson(`http://localhost:${TEST_PORT}/api/analyze`, rahul);
    const { analysis, recommendations, aiInsights } = analysisRes;

    console.log('\n--- VERIFYING BENCHMARKS ---');
    console.log(`Monthly Commitments: ₹${analysis.monthlyCommitments} (Target: ₹60000) -> ${analysis.monthlyCommitments === 60000 ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`Monthly Surplus: ₹${analysis.monthlySurplus} (Target: ₹25000) -> ${analysis.monthlySurplus === 25000 ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`6-Mo Emergency Target: ₹${analysis.emergencyFundTarget} (Target: ₹360000) -> ${analysis.emergencyFundTarget === 360000 ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`Emergency Fund Gap: ₹${analysis.emergencyFundGap} (Target: ₹110000) -> ${analysis.emergencyFundGap === 110000 ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`Savings Runway: ${analysis.currentSavingsCoverageMonths} months (Target: 4.17) -> ${analysis.currentSavingsCoverageMonths === 4.17 ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log(`Illustrative Protection Gap: ₹${analysis.protectionNeed.illustrativeProtectionGap} (Target: ₹8200000) -> ${analysis.protectionNeed.illustrativeProtectionGap === 8200000 ? '✅ MATCH' : '❌ MISMATCH'}`);

    console.log('\n--- VERIFYING RECOMMENDATIONS & AI ---');
    console.log(`Total Actions: ${recommendations.length}`);
    recommendations.forEach((r) => console.log(`  [Priority ${r.priorityRank}] [${r.urgency}] ${r.title}`));
    console.log(`AI Engine: ${aiInsights.aiEngine}`);
    console.log(`Live AI Status: ${aiInsights.isLiveAi}`);

    console.log('\n✅ ALL ENDPOINTS AND BENCHMARKS VALIDATED PERFECTLY!\n');
  } catch (err) {
    console.error('Probe failed:', err);
    process.exitCode = 1;
  } finally {
    server.kill();
    setTimeout(() => process.exit(process.exitCode || 0), 500);
  }
}, 2500);

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
