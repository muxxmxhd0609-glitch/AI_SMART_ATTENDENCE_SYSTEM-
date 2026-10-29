const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testSnapshot() {
  const res = await fetch('http://localhost:8000/api/auth/student-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usn: '1RG24CS409', password: 'student123' })
  });
  const data = await res.json();
  const token = data.access_token;
  const user = {
    role: 'student',
    username: '1RG24CS409',
    usn: '1RG24CS409',
    full_name: 'Mohammed Muzammil',
    department: 'B.E in Computer Science and Engineering',
    semester: 7,
    selected_semester: 7,
    section: 'A',
    email: 'muxxmxhd0609@gmail.com',
    phone: '+91 9620773507',
    face_registered: true,
    access_token: token
  };

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Set localStorage
  await page.evaluate((u, t) => {
    localStorage.setItem('rgit_auth_token', t);
    localStorage.setItem('rgit_user_data', JSON.stringify(u));
  }, user, token);

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  const outDir = path.resolve(__dirname, '..', 'project_screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const testFile = path.join(outDir, 'test_student_dashboard.png');
  await page.screenshot({ path: testFile, fullPage: false });
  console.log('Saved test screenshot to:', testFile);

  await browser.close();
}

testSnapshot().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
