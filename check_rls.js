const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('users','attendance','geofence','audit_log','settings') AND relkind='r';`
  }).catch(async () => {
    // fallback: query information_schema via raw SQL not available, use pg_class through a direct query
    const { data: d, error: e } = await supabase.from('pg_class').select('relname,relrowsecurity').limit(1);
    return { data: d, error: e };
  });
  if (error) {
    console.log('Cannot check RLS status directly:', error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
})();
