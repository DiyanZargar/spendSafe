const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.resolve(__dirname, 'screenshots');
const ARTIFACTS_DIR = '/Users/rid/.gemini/antigravity-ide/brain/fa3a16c3-7709-4150-9eed-3b71239b8291';

async function loginViaApi() {
  const res = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@example.com',
      password: 'DemoPassword123!',
    }),
  });
  if (!res.ok) {
    throw new Error(`Login API failed: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Logging in via backend API to acquire authenticated session...');
  const authData = await loginViaApi();
  console.log('Logged in successfully! Token acquired for user:', authData.user.email);

  console.log('Launching Chrome:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1600,1000',
    ],
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2, // 2x Retina resolution
    },
  });

  const page = await browser.newPage();

  async function saveScreenshot(filename, description) {
    const projectPath = path.join(OUTPUT_DIR, filename);
    const artifactPath = path.join(ARTIFACTS_DIR, filename);
    await page.screenshot({ path: projectPath, fullPage: false });
    fs.copyFileSync(projectPath, artifactPath);
    console.log(`✓ [SAVED] ${filename} - ${description}`);
  }

  try {
    // 1. Login Screen (Unauthenticated - Monokai Dark)
    console.log('1. Capturing Login Page (Monokai Dark)...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('exp_theme', 'monokai');
      document.documentElement.setAttribute('data-theme', 'monokai');
      document.documentElement.classList.add('dark');
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));
    await saveScreenshot('01_login_screen.png', 'Monokai Dark Auth Screen - Single Viewport Fit');

    // 1b. Login Screen (Light Mode)
    console.log('1b. Capturing Login Page (Light Mode)...');
    await page.evaluate(() => {
      localStorage.setItem('exp_theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await new Promise((r) => setTimeout(r, 600));
    await saveScreenshot('01_login_screen_light.png', 'Modern Light Mode Auth Screen');

    // 2. Inject Authenticated Session & Load Dashboard (Monokai Dark)
    console.log('2. Authenticating browser session...');
    await page.evaluate((auth) => {
      localStorage.setItem('token', auth.access_token);
      localStorage.setItem('user', JSON.stringify(auth.user));
      localStorage.setItem('exp_theme', 'monokai');
      document.documentElement.setAttribute('data-theme', 'monokai');
      document.documentElement.classList.add('dark');
    }, authData);

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));

    // 3. Cockpit HUD Dashboard (Monokai Dark)
    console.log('3. Capturing Live Cockpit HUD Dashboard...');
    await saveScreenshot('02_dashboard_hud_monokai.png', 'Cockpit HUD: Radial Speedometer, Trajectory Curve & Metrics');

    // 4. Open Tactile Dial Pad in bottom-right station
    console.log('4. Opening Tactile Dial Pad in station...');
    await page.evaluate(() => {
      const dialBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Tactile Dial')
      );
      if (dialBtn) dialBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Key in amount 45.00
    await page.evaluate(() => {
      const keys = Array.from(document.querySelectorAll('aside button'));
      const key4 = keys.find((k) => k.textContent.trim() === '4');
      const key5 = keys.find((k) => k.textContent.trim() === '5');
      if (key4) key4.click();
      if (key5) key5.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await saveScreenshot('06_tactile_dialpad.png', 'Tactile Dialpad Docked in Bottom-Right Station');

    // 5. Switch to Neural AI Copilot in station
    console.log('5. Switching to Neural AI Copilot...');
    await page.evaluate(() => {
      const copilotBtn = Array.from(document.querySelectorAll('header button, aside button')).find((b) =>
        b.textContent.includes('Co-Pilot')
      );
      if (copilotBtn) copilotBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Interact with chip
    await page.evaluate(() => {
      const chip = Array.from(document.querySelectorAll('aside button')).find((c) =>
        c.textContent.includes('Spent $45') || c.textContent.includes('Log $18') || c.textContent.includes('dinner')
      );
      if (chip) chip.click();
    });
    await new Promise((r) => setTimeout(r, 2200));
    await saveScreenshot('07_neural_ai_copilot.png', 'Neural AI Co-Pilot Docked in Bottom-Right Station');

    // 6. Navigate to Ledger & Dials (Expenses)
    console.log('6. Navigating to Ledger & Dials (Expenses)...');
    await page.evaluate(() => {
      const navButtons = document.querySelectorAll('aside nav button');
      if (navButtons[1]) navButtons[1].click();
    });
    await new Promise((r) => setTimeout(r, 2000));
    await saveScreenshot('03_expenses_ledger.png', 'Financial Ledger: Decimal Precision, Category Filtering & CRUD');

    // 7. Navigate to Visual Reports (Interactive Frontend Card)
    console.log('7. Navigating to Visual Reports...');
    await page.evaluate(() => {
      const navButtons = document.querySelectorAll('aside nav button');
      if (navButtons[2]) navButtons[2].click();
    });
    await new Promise((r) => setTimeout(r, 2200));
    await saveScreenshot('04_visual_reports.png', 'Interactive Executive Financial Statement & Allocations');

    // 8. Navigate to Mesh & Models (Settings / Channels)
    console.log('8. Navigating to Mesh & Models (Settings)...');
    await page.evaluate(() => {
      const navButtons = document.querySelectorAll('aside nav button');
      if (navButtons[3]) navButtons[3].click();
    });
    await new Promise((r) => setTimeout(r, 2000));
    await saveScreenshot('05_mesh_channels_and_models.png', 'High-Contrast Monokai Dark Mode Channel & LLM Settings');

    // 9. Modern Light Theme Suite
    console.log('9. Switching to Modern Light Theme Suite...');
    await page.evaluate(() => {
      const navButtons = document.querySelectorAll('aside nav button');
      if (navButtons[0]) navButtons[0].click();
      localStorage.setItem('exp_theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshot('02_dashboard_hud_light.png', 'Sleek Light Mode Cockpit HUD');

    // 10. Light Theme Tactile DialPad
    console.log('10. Capturing Light Theme Tactile DialPad...');
    await page.evaluate(() => {
      const dialBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Tactile Dial')
      );
      if (dialBtn) dialBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    await saveScreenshot('06_tactile_dialpad_light.png', 'Light Mode Tactile Dialpad');

    // 11. Light Theme Co-Pilot
    console.log('11. Capturing Light Theme Co-Pilot...');
    await page.evaluate(() => {
      const copilotBtn = Array.from(document.querySelectorAll('header button, aside button')).find((b) =>
        b.textContent.includes('Co-Pilot')
      );
      if (copilotBtn) copilotBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await saveScreenshot('07_neural_ai_copilot_light.png', 'Light Mode AI Co-Pilot Console');

    // 12. Light Theme Ledger
    console.log('12. Capturing Light Theme Ledger...');
    await page.evaluate(() => {
      const navButtons = document.querySelectorAll('aside nav button');
      if (navButtons[1]) navButtons[1].click();
    });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshot('03_expenses_ledger_light.png', 'Light Mode Expenses Ledger');

    // 13. Light Theme Reports
    console.log('13. Capturing Light Theme Reports...');
    await page.evaluate(() => {
      const navButtons = document.querySelectorAll('aside nav button');
      if (navButtons[2]) navButtons[2].click();
    });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshot('04_visual_reports_light.png', 'Light Mode Visual Reports');

    // 14. Light Theme Settings
    console.log('14. Capturing Light Theme Settings...');
    await page.evaluate(() => {
      const navButtons = document.querySelectorAll('aside nav button');
      if (navButtons[3]) navButtons[3].click();
    });
    await new Promise((r) => setTimeout(r, 1500));
    await saveScreenshot('05_mesh_channels_and_models_light.png', 'Light Mode Channels & Models Settings');

    console.log('\nAll comprehensive Dark and Light theme showcase screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();
