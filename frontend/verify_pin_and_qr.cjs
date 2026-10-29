const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runVerification() {
  console.log('--- Starting PIN and QR Verification Suite ---');

  // Authenticate student
  let token = 'mock-test-token';
  try {
    const res = await fetch('http://localhost:8000/api/auth/student-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usn: '1RG24CS409', password: 'student123' })
    });
    const data = await res.json();
    if (data.access_token) token = data.access_token;
  } catch (e) {
    console.log('Backend auth fallback');
  }

  const user = {
    role: 'student',
    username: '1RG24CS409',
    usn: '1RG24CS409',
    full_name: 'Mohammed Muzammil',
    department: 'B.E in Computer Science and Engineering',
    semester: 7,
    selected_semester: 7,
    section: 'A',
    email: 'student@rgit.ac.in',
    phone: '+91 9620773507',
    face_registered: true,
    access_token: token
  };

  const facultyUser = {
    id: 15,
    role: 'faculty',
    full_name: 'Prof. Bhagyashri Wakde',
    department: 'B.E in Computer Science and Engineering',
    faculty_code: 'bhagyashri',
    semester: 7,
    selected_semester: 7,
    assigned_subject_codes: ['BCS701', 'BCS702', 'BCS703'],
    assigned_subjects: ['BCS701 - Cloud Computing & Virtualization']
  };

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  const outDir = path.resolve(__dirname, '..', 'project_screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Student Dashboard with both PIN and QR options
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.evaluate((u, t) => {
    localStorage.setItem('rgit_auth_token', t);
    localStorage.setItem('rgit_user_data', JSON.stringify(u));
  }, user, token);
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(outDir, 'qr_pin_1_student_dashboard_options.png') });
  console.log('Saved: qr_pin_1_student_dashboard_options.png');

  // 2. Open QR Scanner Modal
  const qrButton = await page.$('button[title*="classroom QR"]');
  if (qrButton) {
    await qrButton.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'qr_pin_2_qr_scanner_modal.png') });
    console.log('Saved: qr_pin_2_qr_scanner_modal.png');
    // Close QR modal
    const closeBtn = await page.$('.modal-card button.btn-secondary');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // 3. Open Enter 6-Digit PIN Biometric Modal
  const pinButton = await page.$('button[title*="Enter 6-digit"]');
  if (pinButton) {
    await pinButton.click();
    await new Promise(r => setTimeout(r, 600));
    // Type in PIN
    const pinInput = await page.$('input.code-insertion-input');
    if (pinInput) {
      await pinInput.type('849201');
      await new Promise(r => setTimeout(r, 400));
    }
    await page.screenshot({ path: path.join(outDir, 'qr_pin_3_pin_biometric_modal.png') });
    console.log('Saved: qr_pin_3_pin_biometric_modal.png');

    // Close modal
    const cancelBtn = await page.$('.modal-header button.btn-secondary');
    if (cancelBtn) await cancelBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // 4. Switch to Faculty View and inspect QR & Projector Mode
  await page.evaluate((fac) => {
    localStorage.setItem('rgit_user_data', JSON.stringify(fac));
  }, facultyUser);
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Click on "Take Attendance" tab in Faculty Portal
  const navTabs = await page.$$('.nav-tab, button');
  for (const tab of navTabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && text.includes('Take Attendance')) {
      await tab.click();
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }

  await page.screenshot({ path: path.join(outDir, 'qr_pin_4_faculty_qr_and_pin.png') });
  console.log('Saved: qr_pin_4_faculty_qr_and_pin.png');

  // 5. Open Projector View
  const projectorBtn = await page.$('button[title*="projector"]');
  if (projectorBtn) {
    await projectorBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, 'qr_pin_5_projector_fullscreen.png') });
    console.log('Saved: qr_pin_5_projector_fullscreen.png');
  }

  // 6. Test URL PIN Auto-Detection in Student Mode
  await page.evaluate((u, t) => {
    localStorage.setItem('rgit_auth_token', t);
    localStorage.setItem('rgit_user_data', JSON.stringify(u));
  }, user, token);
  await page.goto('http://localhost:5173/?pin=984521', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: path.join(outDir, 'qr_pin_6_url_pin_autodetected.png') });
  console.log('Saved: qr_pin_6_url_pin_autodetected.png');

  await browser.close();
  console.log('All verification snapshots completed successfully!');
}

runVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
