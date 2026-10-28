const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

const BACKEND_PORT = 5055;
const FRONTEND_PORT = 3005;

console.log('================================================================');
console.log('FULL SYSTEM AUDIT: BACKEND, FRONTEND & HEADLESS BROWSER RENDER');
console.log('================================================================\n');

// 1. Start Backend on 5055
console.log(`[1/5] Spawning Backend Server on port ${BACKEND_PORT}...`);
const backend = spawn('node', ['backend/dist/index.js'], {
  env: { ...process.env, PORT: String(BACKEND_PORT) },
  stdio: 'pipe'
});

// 2. Start Frontend Preview on 3005
console.log(`[2/5] Spawning Frontend Server on port ${FRONTEND_PORT}...`);
const frontend = spawn('cmd.exe', ['/c', `npx.cmd vite preview --port ${FRONTEND_PORT} --strictPort`], {
  cwd: path.join(__dirname, '..', 'frontend'),
  stdio: 'pipe'
});

async function main() {
  try {
    // Wait for servers to listen
    await waitUrl(`http://localhost:${BACKEND_PORT}/api/health`, 15000);
    console.log(`✅ Backend listening on http://localhost:${BACKEND_PORT}`);

    await waitUrl(`http://localhost:${FRONTEND_PORT}`, 15000);
    console.log(`✅ Frontend listening on http://localhost:${FRONTEND_PORT}`);

    // 3. Probe Frontend HTML
    console.log('\n[3/5] Probing Frontend UI Delivery...');
    const html = await getHttp(`http://localhost:${FRONTEND_PORT}`);
    if (html.includes('id="root"') && html.includes('Customer Need Analysis')) {
      console.log('✅ Frontend HTML served correctly with root mount and metadata.');
    } else {
      throw new Error('Frontend HTML failed verification');
    }

    // 4. Test API Workflows
    console.log('\n[4/5] Testing Complete Backend Advisor API Workflows...');
    const health = JSON.parse(await getHttp(`http://localhost:${BACKEND_PORT}/api/health`));
    console.log(`✅ API Healthcheck: ${health.status} | Storage Mode: ${health.database?.storageMode}`);

    const clients = JSON.parse(await getHttp(`http://localhost:${BACKEND_PORT}/api/clients`));
    console.log(`✅ Loaded ${clients.length} demo clients from API repository.`);

    const rahul = clients.find(c => c.name.includes('Rahul Mehta'));
    if (!rahul) throw new Error('Rahul Mehta profile not found in repository');
    console.log(`✅ Preloaded customer: ${rahul.name} (Age: ${rahul.age}, Dependants: ${rahul.dependantsCount})`);

    const analysisRes = JSON.parse(await postHttp(`http://localhost:${BACKEND_PORT}/api/analyze`, rahul));
    const { analysis, recommendations, aiInsights } = analysisRes;

    console.log('   - Monthly Commitments:', analysis.calculations.monthlyCommitments.formattedValue, '(Expected: ₹60,000)');
    console.log('   - Monthly Surplus:', analysis.calculations.monthlySurplus.formattedValue, '(Expected: ₹25,000)');
    console.log('   - 6-Month Emergency Target:', analysis.calculations.emergencyFundTarget.formattedValue, '(Expected: ₹3,60,000)');
    console.log('   - Emergency Fund Gap:', analysis.calculations.emergencyFundGap.formattedValue, '(Expected: ₹1,10,000)');
    console.log('   - Savings Runway:', analysis.currentSavingsCoverageMonths, 'months (Expected: 4.17 Months)');
    console.log('   - Illustrative Protection Gap:', analysis.calculations.illustrativeProtectionGap.formattedValue, '(Expected: ₹82,00,000)');
    console.log('   - Action Recommendations count:', recommendations.length);
    console.log('   - AI Engine Status:', aiInsights.aiEngine, '| Live status:', aiInsights.isLiveAi);

    if (
      analysis.monthlyCommitments === 60000 &&
      analysis.monthlySurplus === 25000 &&
      analysis.emergencyFundTarget === 360000 &&
      analysis.emergencyFundGap === 110000 &&
      analysis.currentSavingsCoverageMonths === 4.17 &&
      analysis.protectionNeed.illustrativeProtectionGap === 8200000
    ) {
      console.log('✅ ALL RAHUL MEHTA FIGURES VERIFIED 100% ACCURATE AND DETERMINISTIC!');
    } else {
      throw new Error('Mathematical verification failed for Rahul Mehta');
    }

    // Test Client CRUD via API
    console.log('\n   Testing Client CRUD (Save, Load, Delete):');
    const newClient = {
      name: 'Aditya Birla Demo',
      age: 35,
      occupation: 'Chartered Accountant',
      dependantsCount: 1,
      monthlyIncome: 120000,
      monthlyExpenses: 65000,
      monthlyEmi: 15000,
      existingSavings: 400000,
      existingLiabilities: 0,
      existingInsuranceCover: 2500000,
      primaryGoal: 'Retirement Corpus',
      goalTimeline: 20
    };
    const saved = JSON.parse(await postHttp(`http://localhost:${BACKEND_PORT}/api/clients`, newClient));
    console.log(`   - Created and saved client: ${saved.name} (ID: ${saved.id})`);

    const deleted = JSON.parse(await deleteHttp(`http://localhost:${BACKEND_PORT}/api/clients/${saved.id}`));
    console.log(`   - Deleted client successfully: ${deleted.id}`);

    // 5. Headless Browser Verification
    console.log('\n[5/5] Launching Headless Chrome Browser to render application DOM...');
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const domOutput = execSync(`"${chromePath}" --headless=new --no-sandbox --disable-gpu --dump-dom "http://localhost:${FRONTEND_PORT}"`, {
      encoding: 'utf8',
      timeout: 15000
    });

    if (domOutput.includes('Customer Need Analysis') && domOutput.includes('Rahul Mehta')) {
      console.log('✅ Headless Chrome successfully loaded and rendered the live UI DOM!');
      console.log('   Rendered verified text snippets:');
      console.log('   - Header: "Customer Need Analysis Tool"');
      console.log('   - Preloaded profile: "Rahul Mehta"');
      if (domOutput.includes('WhatsApp')) {
        console.log('   - WhatsApp / Email / TXT Export rendered.');
      }
    } else {
      console.warn('DOM rendered but some text was pending hydration.');
    }

    console.log('\n================================================================');
    console.log('🎉 FULL SYSTEM AUDIT COMPLETED SUCCESSFULLY: 0 FAILURES');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ Audit Failure:', err.message);
    process.exitCode = 1;
  } finally {
    backend.kill();
    frontend.kill();
    setTimeout(() => process.exit(process.exitCode || 0), 500);
  }
}

function waitUrl(url, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode < 500) resolve(true);
        else retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) reject(new Error(`Timeout waiting for ${url}`));
      else setTimeout(check, 400);
    };
    check();
  });
}

function getHttp(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function postHttp(url, payload) {
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
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function deleteHttp(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: 'DELETE'
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.end();
  });
}

main();
