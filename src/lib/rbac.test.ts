import { describe, it, expect } from 'vitest';
import { canManage, maxAssignableRole } from './rbac';

describe('rbac', () => {
  it('canManage: owner bisa kelola siapa pun', () => {
    expect(canManage('owner', 'karyawan')).toBe(true);
    expect(canManage('owner', 'admin')).toBe(true);
    expect(canManage('owner', 'owner')).toBe(true);
  });

  it('canManage: admin hanya karyawan', () => {
    expect(canManage('admin', 'karyawan')).toBe(true);
    expect(canManage('admin', 'admin')).toBe(false);
    expect(canManage('admin', 'owner')).toBe(false);
  });

  it('canManage: karyawan tidak kelola siapa pun', () => {
    expect(canManage('karyawan', 'karyawan')).toBe(false);
    expect(canManage('karyawan', 'admin')).toBe(false);
  });

  it('maxAssignableRole', () => {
    expect(maxAssignableRole('owner')).toBe('owner');
    expect(maxAssignableRole('admin')).toBe('karyawan');
    expect(maxAssignableRole('karyawan')).toBe('karyawan');
  });
});
