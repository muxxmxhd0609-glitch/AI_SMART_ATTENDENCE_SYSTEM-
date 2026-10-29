async function getTokens() {
  const accounts = [
    { role: 'student', url: 'http://localhost:8000/api/auth/student-login', body: { usn: '1RG24CS409', password: 'student123' } },
    { role: 'faculty', url: 'http://localhost:8000/api/auth/login', body: { username: 'bhagyashri', password: 'faculty123' } },
    { role: 'hod', url: 'http://localhost:8000/api/auth/hod-login', body: { username: 'hod_cse', password: 'arudra123' } },
    { role: 'admin', url: 'http://localhost:8000/api/auth/admin-login', body: { username: 'MOHD', password: '0609' } }
  ];

  for (const acc of accounts) {
    try {
      const res = await fetch(acc.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acc.body)
      });
      const data = await res.json();
      console.log(`[${acc.role}] HTTP ${res.status}: token=${data.access_token ? data.access_token.substring(0, 15) + '...' : 'none'}, name=${data.full_name}`);
    } catch (e) {
      console.error(`[${acc.role}] Error:`, e.message);
    }
  }
}

getTokens();
