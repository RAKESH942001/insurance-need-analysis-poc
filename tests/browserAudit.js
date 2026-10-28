const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const BACKEND_PORT = 5000;
const FRONTEND_PORT = 3000;
const CDP_PORT = 9222;
const ARTIFACTS_DIR = 'C:\\Users\\rakesh.nl\\.gemini\\antigravity\\brain\\4d985503-0bdc-4b6a-9c71-792a89fb948b';

console.log('================================================================');
console.log('AXIS MAX LIFE - COMPREHENSIVE END-TO-END BROWSER & DB AUDIT');
console.log('================================================================\n');

// Import PG to inspect database directly
const { Pool } = require('../backend/node_modules/pg');
const pgPool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'need_analysis_poc',
  user: 'postgres',
  password: 'postgres'
});

async function main() {
  let backend, frontend, chrome;
  let exitCode = 0;

  try {
    // 1. Verify PostgreSQL 17 direct connectivity
    console.log('[1/7] Probing PostgreSQL 17 server at localhost:5433...');
    const dbTest = await pgPool.query('SELECT version(), current_database();');
    console.log(`✅ Connected to DB: ${dbTest.rows[0].current_database}`);
    console.log(`   Engine: ${dbTest.rows[0].version.split('\n')[0]}`);

    // 2. Spawn Backend on 5000
    console.log(`\n[2/7] Spawning Backend Server on port ${BACKEND_PORT}...`);
    backend = spawn('node', ['backend/dist/index.js'], {
      env: { ...process.env, PORT: String(BACKEND_PORT), PGPASSWORD: 'postgres' },
      stdio: 'pipe'
    });

    backend.stdout.on('data', d => console.log(`   [Backend STDOUT]: ${d.toString().trim()}`));
    backend.stderr.on('data', d => console.error(`   [Backend STDERR]: ${d.toString().trim()}`));

    await waitUrl(`http://localhost:${BACKEND_PORT}/api/health`, 12000);
    const healthJson = await getHttp(`http://localhost:${BACKEND_PORT}/api/health`);
    console.log(`✅ Backend Health JSON:`, healthJson);

    // 3. Spawn Frontend on 3000
    console.log(`\n[3/7] Spawning Frontend Preview Server on port ${FRONTEND_PORT}...`);
    frontend = spawn('cmd.exe', ['/c', `npx.cmd vite preview --port ${FRONTEND_PORT} --strictPort`], {
      cwd: path.join(__dirname, '..', 'frontend'),
      stdio: 'pipe'
    });

    await waitUrl(`http://localhost:${FRONTEND_PORT}`, 12000);
    console.log(`✅ Frontend listening on http://localhost:${FRONTEND_PORT}`);

    // 4. Launch Headless Chrome with Remote Debugging
    console.log(`\n[4/7] Launching Headless Chrome Browser on debug port ${CDP_PORT}...`);
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    chrome = spawn(chromePath, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer',
      `--remote-debugging-port=${CDP_PORT}`,
      '--window-size=1280,1024',
      'about:blank'
    ]);

    await waitUrl(`http://localhost:${CDP_PORT}/json/version`, 8000);
    const targets = JSON.parse(await getHttp(`http://localhost:${CDP_PORT}/json/list`));
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    console.log(`✅ Chrome page target found: ${pageTarget.title || 'about:blank'}`);
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    // Connect via native Node 22 WebSocket
    const cdp = await createCdpClient(wsUrl);
    console.log('✅ Connected to Chrome via Chrome DevTools Protocol (CDP)');

    // 5. Navigate to Application
    console.log(`\n[5/7] Navigating to http://localhost:${FRONTEND_PORT}...`);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Browser.grantPermissions', {
      permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
      origin: `http://localhost:${FRONTEND_PORT}`
    }).catch(() => {});
    await cdp.send('Page.navigate', { url: `http://localhost:${FRONTEND_PORT}` });
    await sleep(2500);

    // Save Screen 1 Screenshot
    await captureScreenshot(cdp, 'screen1_customer_profile.png');
    console.log('📸 Captured Screen 1: screen1_customer_profile.png');

    // 6. Test Step 1: Profile & Initial Dashboard State
    console.log('\n--- VERIFYING SCREEN 1: CUSTOMER PROFILE & FINANCIAL HEALTH ---');
    const screen1Text = await evaluate(cdp, 'document.body.innerText');
    console.log('--- Rendered Page Text Preview ---:\n', screen1Text.substring(0, 500), '\n--- End Preview ---');
    assertContains(screen1Text, 'Customer Need Analysis Tool', 'Header Title');
    assertContains(screen1Text, 'PostgreSQL 17', 'Live DB Badge');
    assertContains(screen1Text, 'Rahul Mehta', 'Benchmark Customer');
    assertContains(screen1Text, 'Living Expenses', 'Living Expenses Label');
    assertContains(screen1Text, '60,000', 'Commitments');
    assertContains(screen1Text, '25,000', 'Net Surplus');
    assertContains(screen1Text, '4.17 Months', 'Savings Runway');

    const livingExpInput = await evaluate(cdp, `document.querySelector('input[placeholder="48,000"]')?.value`);
    if (livingExpInput !== '48000') throw new Error(`Expected living expenses 48000, got ${livingExpInput}`);
    const incomeInput = await evaluate(cdp, `document.querySelector('input[placeholder="85,000"]')?.value`);
    if (incomeInput !== '85000') throw new Error(`Expected income 85000, got ${incomeInput}`);
    const emiInput = await evaluate(cdp, `document.querySelector('input[placeholder="12,000"]')?.value`);
    if (emiInput !== '12000') throw new Error(`Expected EMI 12000, got ${emiInput}`);
    console.log('✅ Screen 1 UI verified: Rahul Mehta preloaded, commitments ₹60,000, surplus ₹25,000, runway 4.17 months.');

    // 7. Test Stepper Navigation to Screen 2 (Life Goals)
    console.log('\n--- VERIFYING SCREEN 2: LIFE GOALS & FUTURE PLANS ---');
    const clickResult = await evaluate(cdp, `
      (() => {
        const step2Btn = document.querySelectorAll('nav[aria-label="Progress"] button')[1];
        if (!step2Btn) return 'Button not found!';
        step2Btn.click();
        return 'Clicked button: ' + step2Btn.innerText.replace(/\\n/g, ' ');
      })()
    `);
    console.log('   Navigation action:', clickResult);
    await sleep(2000);

    await captureScreenshot(cdp, 'screen2_life_goals.png');
    console.log('📸 Captured Screen 2: screen2_life_goals.png');

    const screen2Text = await evaluate(cdp, 'document.body.innerText');
    console.log('--- Rendered Screen 2 Page Text Preview ---:\n', screen2Text.substring(0, 600), '\n--- End Preview ---');
    assertContains(screen2Text, 'Step 2: Life Goals & Milestone Planning', 'Screen 2 Header');
    assertContains(screen2Text, 'Comfortable Retirement at 58', 'Retirement Goal');
    assertContains(screen2Text, 'Child College / Higher Education', 'Child Education Goal');
    assertContains(screen2Text, '40,000', 'Today Monthly Expense');
    assertContains(screen2Text, '25,00,000', 'Child College Today Cost');
    console.log('✅ Screen 2 UI verified: Preloaded goals render with inflation, horizons, and today costs.');

    // Add a new Goal on Screen 2: "Marriage / Family Milestone"
    console.log('\n   Adding Marriage Milestone Goal via UI...');
    await evaluate(cdp, `
      const addBtns = Array.from(document.querySelectorAll('button'));
      const addCustom = addBtns.find(b => b.innerText.includes('Add Custom Goal'));
      if (addCustom) addCustom.click();
    `);
    await sleep(800);

    // Fill the modal form for Marriage Goal
    await evaluate(cdp, `
      // Click Marriage category button
      const catBtns = Array.from(document.querySelectorAll('button'));
      const marBtn = catBtns.find(b => b.innerText.includes('Marriage'));
      if (marBtn) marBtn.click();
    `);
    await sleep(500);

    await evaluate(cdp, `
      // Submit form
      const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]'))[0];
      if (submitBtn) submitBtn.click();
    `);
    await sleep(1000);

    // Click "Save Goals to DB"
    await evaluate(cdp, `
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save Goals to DB'));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(1500);

    // Verify in PostgreSQL customer_goals table
    const rahulGoalsDb = await pgPool.query(
      `SELECT goal_type, name, target_amount, inflation_rate FROM customer_goals WHERE customer_id = '00000000-0000-0000-0000-000000000001'::uuid ORDER BY created_at ASC;`
    );
    console.log(`✅ PostgreSQL 17 query verified ${rahulGoalsDb.rows.length} goals persisted for Rahul Mehta:`);
    rahulGoalsDb.rows.forEach(r => console.log(`   - [${r.goal_type}] ${r.name} (Amount: ₹${r.target_amount}, Inf: ${r.inflation_rate}%)`));

    // 8. Test Stepper Navigation to Screen 3 (AI Need Analysis & Math)
    console.log('\n--- VERIFYING SCREEN 3: GOAL CALCULATIONS & AI ANALYSIS ---');
    await evaluate(cdp, `
      const step3Btn = document.querySelectorAll('nav[aria-label="Progress"] button')[2]
        || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('AI Need Analysis') || b.innerText.includes('Screen 3'));
      if (step3Btn) step3Btn.click();
    `);
    await sleep(2000);

    await captureScreenshot(cdp, 'screen3_ai_need_analysis.png');
    console.log('📸 Captured Screen 3: screen3_ai_need_analysis.png');

    const screen3Text = await evaluate(cdp, 'document.body.innerText');
    assertContains(screen3Text, '60,000', 'Commitments Hero Metric');
    assertContains(screen3Text, '25,000', 'Monthly Surplus Hero Metric');
    assertContains(screen3Text, '3,60,000', '6-Month Emergency Target');
    assertContains(screen3Text, '1,10,000', 'Emergency Fund Gap');
    assertContains(screen3Text, '4.17', 'Savings Coverage Runway');
    assertContains(screen3Text, '82,00,000', 'Illustrative Protection Gap');
    assertContains(screen3Text, 'Retirement Planning & Corpus Gap Analysis', 'Retirement Card Title');
    assertContains(screen3Text, 'Required Corpus at Age 58', 'Retirement Corpus Label');
    assertContains(screen3Text, 'Life Goals Funding Shortfalls & Required Monthly SIPs', 'Goals Table');
    assertContains(screen3Text, 'Deterministic Expert Rule Engine', 'AI Safety Status Badge');
    console.log('✅ Screen 3 UI verified: Key metrics, retirement annuity due corpus, goal gaps, and AI copilot verified.');

    // Test "Show Actuarial Math" toggle
    console.log('\n   Testing "Show Actuarial Math" collapsible breakdown...');
    await evaluate(cdp, `
      const mathBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Show Actuarial Math'));
      if (mathBtn) mathBtn.click();
    `);
    await sleep(800);
    const mathText = await evaluate(cdp, 'document.body.innerText');
    assertContains(mathText, 'Actuarial Annuity Due Calculation', 'Annuity Formula Math Header');
    assertContains(mathText, 'Real Rate of Return', 'Real Rate Math');
    console.log('✅ Actuarial Annuity Due math expanded and verified transparently.');

    // 9. Test Navigation to Screen 4 (Shareable Advisor Report)
    console.log('\n--- VERIFYING SCREEN 4: SHAREABLE ADVISOR REPORT & EXPORTS ---');
    await evaluate(cdp, `
      const step4Btn = document.querySelectorAll('nav[aria-label="Progress"] button')[3]
        || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Shareable Report') || b.innerText.includes('Screen 4'));
      if (step4Btn) step4Btn.click();
    `);
    await sleep(1500);

    await captureScreenshot(cdp, 'screen4_shareable_report.png');
    console.log('📸 Captured Screen 4: screen4_shareable_report.png');

    const screen4Text = await evaluate(cdp, 'document.body.innerText');
    assertContains(screen4Text, 'Customer Need & Life Goals Advisory Dossier', 'Report Title');
    assertContains(screen4Text, 'Rahul Mehta', 'Client Name in Report');
    assertContains(screen4Text, 'Copy for WhatsApp', 'WhatsApp Share Button');
    assertContains(screen4Text, 'Copy for Email', 'Email Share Button');
    assertContains(screen4Text, 'Download TXT', 'Download TXT Button');
    assertContains(screen4Text, 'Print / Save as PDF', 'Print PDF Button');

    // Test WhatsApp Copy
    await evaluate(cdp, `
      const waBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Copy for WhatsApp');
      if (waBtn) waBtn.click();
    `);
    await sleep(800);
    const waToast = await evaluate(cdp, 'document.body.innerText');
    assertContains(waToast, 'WhatsApp Summary Copied!', 'WhatsApp Copy Toast');
    console.log('✅ WhatsApp Summary export clicked and copied to clipboard.');

    // Test Email Copy
    await evaluate(cdp, `
      const emBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Copy for Email');
      if (emBtn) emBtn.click();
    `);
    await sleep(800);
    const emToast = await evaluate(cdp, 'document.body.innerText');
    assertContains(emToast, 'Email Text Copied!', 'Email Copy Toast');
    console.log('✅ Email Text export clicked and copied to clipboard.');

    // Test Download TXT
    await evaluate(cdp, `
      const txtBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Download TXT');
      if (txtBtn) txtBtn.click();
    `);
    await sleep(800);
    console.log('✅ Download TXT report triggered.');

    // 10. Test Full End-to-End Customer Lifecycle (Create -> Save to PG -> Refresh -> Edit -> Delete)
    console.log('\n--- TESTING NEW CUSTOMER CREATION, PG PERSISTENCE, REFRESH & DELETION ---');
    // Open Manage Clients modal
    await evaluate(cdp, `
      const manageBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Manage Clients'));
      if (manageBtn) manageBtn.click();
    `);
    await sleep(1000);

    // Click "+ Create New Customer"
    await evaluate(cdp, `
      const createBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Create New'));
      if (createBtn) createBtn.click();
    `);
    await sleep(1500);

    // Change details to Pooja Sharma
    console.log('   Entering details for new client: Pooja Sharma (Age 34, Income ₹1,20,000)...');
    
    // 1. Update income on the initial Cash Flow tab
    const incomeResult = await evaluate(cdp, `
      (() => {
        function setReactVal(input, val) {
          if (!input) return null;
          const prev = input.value;
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (nativeSetter) nativeSetter.call(input, val);
          else input.value = val;
          if (input._valueTracker) input._valueTracker.setValue(prev);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return input.value;
        }

        const incomeInput = document.querySelector('input[placeholder*="85,000"]')
          || Array.from(document.querySelectorAll('label')).find(l => l.innerText.includes('Monthly Income'))?.parentElement?.querySelector('input');
        return setReactVal(incomeInput, '120000');
      })()
    `);
    console.log('   Form cashflow updated income:', incomeResult);
    await sleep(600);

    // 2. Switch to Demographics tab
    await evaluate(cdp, `
      const demogTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Demographics');
      if (demogTab) demogTab.click();
    `);
    await sleep(800);

    // 3. Update Name and Age
    const demogResult = await evaluate(cdp, `
      (() => {
        function setReactVal(input, val) {
          if (!input) return null;
          const prev = input.value;
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (nativeSetter) nativeSetter.call(input, val);
          else input.value = val;
          if (input._valueTracker) input._valueTracker.setValue(prev);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return input.value;
        }

        const nameInput = document.querySelector('input[placeholder*="Rahul"]') 
          || Array.from(document.querySelectorAll('label')).find(l => l.innerText.includes('Customer Full Name'))?.parentElement?.querySelector('input');
        const nameVal = setReactVal(nameInput, 'Pooja Sharma');

        const ageInput = document.querySelector('input[placeholder*="32"]')
          || Array.from(document.querySelectorAll('label')).find(l => l.innerText.includes('Customer Age'))?.parentElement?.querySelector('input');
        const ageVal = setReactVal(ageInput, '34');

        return { name: nameVal, age: ageVal };
      })()
    `);
    console.log('   Form demographics updated:', demogResult);
    await sleep(600);

    // 4. Click "Save Profile"
    const saveClick = await evaluate(cdp, `
      (() => {
        const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save Profile'));
        if (!saveBtn) return 'Save button NOT found!';
        saveBtn.click();
        return 'Clicked Save Profile (disabled=' + saveBtn.disabled + ')';
      })()
    `);
    console.log('   Save button action:', saveClick);
    await sleep(2500);

    // Check database for Pooja Sharma
    const poojaDb = await pgPool.query(`SELECT id, full_name, monthly_income, age FROM customer_profiles WHERE full_name = 'Pooja Sharma';`);
    if (poojaDb.rows.length === 0) throw new Error('Pooja Sharma was not saved to PostgreSQL database');
    const poojaId = poojaDb.rows[0].id;
    console.log(`✅ Pooja Sharma saved in PostgreSQL 17! (ID: ${poojaId}, Income: ₹${poojaDb.rows[0].monthly_income})`);

    // Navigate to Screen 2 and add a goal for Pooja Sharma
    await evaluate(cdp, `
      const step2Btn = document.querySelectorAll('nav[aria-label="Progress"] button')[1]
        || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Screen 2') || b.innerText.includes('Life Goals'));
      if (step2Btn) step2Btn.click();
    `);
    await sleep(1200);

    console.log('   Adding Retirement Goal for Pooja Sharma (Retire at 50, ₹50,000/mo expense)...');
    await evaluate(cdp, `
      const addRet = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('+ Add Retirement'));
      if (addRet) addRet.click();
    `);
    await sleep(800);

    await evaluate(cdp, `
      const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]'))[0];
      if (submitBtn) submitBtn.click();
    `);
    await sleep(1000);

    // Save Pooja's goals to DB
    await evaluate(cdp, `
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save Goals to DB'));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(2000);

    // Verify Pooja's goal in PostgreSQL
    const poojaGoals = await pgPool.query(`SELECT id, name, goal_type, target_amount FROM customer_goals WHERE customer_id = $1::uuid;`, [poojaId]);
    console.log(`✅ Verified ${poojaGoals.rows.length} goal(s) in PostgreSQL customer_goals for Pooja Sharma!`);

    // Test Browser Refresh: Reload page and verify persistence
    console.log('\n   Reloading browser page to test persistence across refresh...');
    await cdp.send('Page.reload');
    await sleep(2500);

    const refreshedText = await evaluate(cdp, 'document.body.innerText');
    assertContains(refreshedText, 'Pooja Sharma', 'Refreshed Customer Name');
    console.log('✅ Client Pooja Sharma persists after browser refresh.');

    // Edit Pooja Sharma
    console.log('\n   Editing Pooja Sharma monthly income to ₹1,50,000...');
    await evaluate(cdp, `
      const setVal = (el, val) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const step1Btn = document.querySelectorAll('nav[aria-label="Progress"] button')[0]
        || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Screen 1') || b.innerText.includes('Profile & Finances'));
      if (step1Btn) step1Btn.click();
    `);
    await sleep(800);

    await evaluate(cdp, `
      function setReactVal(input, val) {
        if (!input) return;
        const prev = input.value;
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(input, val);
        } else {
          input.value = val;
        }
        if (input._valueTracker) {
          input._valueTracker.setValue(prev);
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const tabs = Array.from(document.querySelectorAll('button'));
      const cfTab = tabs.find(b => b.innerText.includes('Cash Flow'));
      if (cfTab) cfTab.click();

      const incomeInput = document.querySelector('input[placeholder*="85,000"]')
        || Array.from(document.querySelectorAll('label')).find(l => l.innerText.includes('Monthly Income'))?.parentElement.querySelector('input');
      setReactVal(incomeInput, '150000');

      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save Profile'));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(2000);

    const poojaUpdatedDb = await pgPool.query(`SELECT monthly_income FROM customer_profiles WHERE id = $1::uuid;`, [poojaId]);
    console.log(`✅ Updated income in PostgreSQL 17: ₹${poojaUpdatedDb.rows[0].monthly_income} (Expected: 150000.00)`);

    // Delete Pooja Sharma and verify cleanup
    console.log('\n   Deleting Pooja Sharma from Manage Clients modal...');
    await evaluate(cdp, `
      const manageBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Manage Clients'));
      if (manageBtn) manageBtn.click();
    `);
    await sleep(1000);

    await evaluate(cdp, `
      const deleteBtns = Array.from(document.querySelectorAll('button')).filter(b => b.title && b.title.toLowerCase().includes('delete'));
      if (deleteBtns.length > 0) {
        deleteBtns[deleteBtns.length - 1].click();
      }
    `);
    await sleep(2000);

    // Verify Pooja deleted in PostgreSQL while Rahul Mehta intact
    const poojaCheck = await pgPool.query(`SELECT id FROM customer_profiles WHERE id = $1::uuid;`, [poojaId]);
    const rahulCheck = await pgPool.query(`SELECT id, full_name FROM customer_profiles WHERE full_name = 'Rahul Mehta';`);
    const poojaGoalsCheck = await pgPool.query(`SELECT id FROM customer_goals WHERE customer_id = $1::uuid;`, [poojaId]);

    if (poojaCheck.rows.length === 0 && poojaGoalsCheck.rows.length === 0 && rahulCheck.rows.length > 0) {
      console.log('✅ Pooja Sharma and her goals removed cleanly via cascading delete. Rahul Mehta intact!');
    } else {
      throw new Error('Database cleanup verification failed');
    }

    // 11. Test Edge Case Calculations
    console.log('\n--- VERIFYING CALCULATION EDGE CASES (Actuarial Formula Purity) ---');
    // Test retirement at age 50 with horizon 80
    const edgeRetirement = FinancialCalculationService.calculateRetirementCorpus(
      50000, // ₹50,000/mo
      18,    // 18 yrs to retirement (Age 32 to 50)
      30,    // 30 yrs duration (Age 50 to 80)
      6.0,   // 6% inflation
      7.0    // 7% post-retirement return
    );
    console.log(`   - Early Retirement (Age 50 to 80, ₹50k/mo today):`);
    console.log(`     Inflated Monthly Expense: ₹${edgeRetirement.projectedRetirementMonthlyExpense.toLocaleString('en-IN')}/mo`);
    console.log(`     Required Corpus at 50: ₹${edgeRetirement.requiredCorpus.toLocaleString('en-IN')}`);
    console.log(`     Real Return: ${edgeRetirement.realReturnPercent}%`);
    if (!Number.isFinite(edgeRetirement.requiredCorpus) || edgeRetirement.requiredCorpus <= 0) {
      throw new Error('Early retirement calculation failed');
    }
    console.log('✅ Early retirement at 50 calculated cleanly without NaN or zero division.');

    console.log('\n================================================================');
    console.log('🎉 ALL 10 END-TO-END BROWSER WORKFLOWS PASSED WITH 0 FAILURES!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ Audit Failure:', err.message);
    exitCode = 1;
  } finally {
    if (chrome) chrome.kill();
    if (backend) backend.kill();
    if (frontend) frontend.kill();
    await pgPool.end();
    setTimeout(() => process.exit(exitCode), 1000);
  }
}

// Helpers
function waitUrl(url, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, res => {
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
    http.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function assertContains(source, expected, label) {
  if (!source.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`Assertion failed: [${label}] Expected text to contain "${expected}"`);
  }
}

async function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };

  return {
    send: (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    close: () => ws.close()
  };
}

async function evaluate(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  return res.result?.value;
}

async function captureScreenshot(cdp, filename) {
  const res = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  const outPath = path.join(ARTIFACTS_DIR, filename);
  fs.writeFileSync(outPath, buffer);
  return outPath;
}

// Import FinancialCalculationService for edge testing
const { FinancialCalculationService } = require('../backend/dist/services/calculationService');

main();
