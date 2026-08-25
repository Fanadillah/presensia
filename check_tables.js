const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const tables = ['users', 'attendance', 'geofence', 'audit_log', 'settings'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(t, '-> ERROR:', error.message, '| code:', error.code);
    } else {
      console.log(t, '-> OK, sample rows:', data.length);
    }
  }
})();
