SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('attendance','geofence','audit_log','settings')
ORDER BY tablename, policyname;
