import { safeParseStaff, ANON_KEY, BASE_URL } from './src/lib/config.js';

async function run() {
  const token = ANON_KEY; // or get token from somewhere
  
  const payload = {
        is_active: false,
        archived_at: new Date().toISOString(),
        archive_reason: 'Graduated',
        graduation_year: "2026",
        suspension_end_date: null,
  };

  const res = await fetch(`${BASE_URL}/students?id=eq.invalid-id`, {
        method: "PATCH",
        headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("BODY:", text);
}

run();
