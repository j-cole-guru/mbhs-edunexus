const BASE_URL = "https://tvitevnovhiimpdukebm.supabase.co/rest/v1";
const SUPABASE_URL = "https://tvitevnovhiimpdukebm.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aXRldm5vdmhpaW1wZHVrZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc5NDksImV4cCI6MjA5MzcyMzk0OX0.ppLsEGZqXAE9YurmXCUqto7Mi3p6ZEVDHS4ODLwJo6Y";

async function run() {
  const headers = {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
  };

  console.log("=== Testing PATCH /students ===");
  const payload = {
    is_active: false,
    archived_at: new Date().toISOString(),
    archive_reason: 'Graduated',
    graduation_year: "2026",
    suspension_end_date: null,
  };
  let res = await fetch(`${BASE_URL}/students?id=eq.00000000-0000-0000-0000-000000000000`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
  console.log("STATUS:", res.status);
  console.log("BODY:", await res.text());

  console.log("\n=== Fetching 1 student ===");
  res = await fetch(`${BASE_URL}/students?limit=1`, { headers });
  console.log("BODY:", await res.text());

  console.log("\n=== Testing RPC ===");
  res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/student_login_by_name`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_full_name: "John", p_pin: "1234" })
  });
  console.log("RPC STATUS:", res.status);
  console.log("RPC BODY:", await res.text());
}

run();
