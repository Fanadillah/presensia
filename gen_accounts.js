const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, phone, is_active, created_at')
    .order('role', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }

  const admins = data.filter(u => u.role === 'admin' || u.role === 'owner');
  const karyawan = data.filter(u => u.role === 'karyawan');

  let md = '# Daftar Akun Pengguna\n\n';
  md += `Total akun: **${data.length}** (Admin/Owner: ${admins.length}, Karyawan: ${karyawan.length})\n\n`;

  md += '## Admin / Owner\n\n';
  md += '| No | Nama | Email | Telepon | Status | Bergabung |\n';
  md += '|----|------|-------|---------|--------|----------|\n';
  admins.forEach((u, i) => {
    md += `| ${i + 1} | ${u.full_name} | ${u.email} | ${u.phone || '-'} | ${u.is_active ? 'Aktif' : 'Nonaktif'} | ${new Date(u.created_at).toLocaleDateString('id-ID')} |\n`;
  });

  md += '\n## Karyawan\n\n';
  md += '| No | Nama | Email | Telepon | Status | Bergabung |\n';
  md += '|----|------|-------|---------|--------|----------|\n';
  karyawan.forEach((u, i) => {
    md += `| ${i + 1} | ${u.full_name} | ${u.email} | ${u.phone || '-'} | ${u.is_active ? 'Aktif' : 'Nonaktif'} | ${new Date(u.created_at).toLocaleDateString('id-ID')} |\n`;
  });

  md += `\n---\n\n_Di-generate otomatis dari tabel \`users\` Supabase._\n`;

  fs.writeFileSync('DAFTAR_AKUN.md', md);
  console.log('File DAFTAR_AKUN.md berhasil dibuat dengan', data.length, 'akun.');
})();
