SELECT c.relname, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('users','attendance','geofence','audit_log','settings')
  AND c.relkind = 'r'
ORDER BY c.relname;
