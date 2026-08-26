import { test, expect } from '@playwright/test';

test.describe('login flow', () => {
  test('halaman login render + validasi', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /masuk/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();

    // submit kosong -> tetap di login (validasi client)
    await page.getByRole('button', { name: /masuk/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('login gagal menampilkan pesan error', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('salah@contoh.com');
    await page.getByPlaceholder(/password/i).fill('salah123');
    await page.getByRole('button', { name: /masuk/i }).click();
    // tunggu toast / error text (implementasi menampilkan toast)
    await expect(page.getByText(/gagal|tidak ditemukan|invalid|error/i).first()).toBeVisible({ timeout: 10000 });
  });

  // Test sukses butuh kredensial real — skip jika env tidak ada
  test.skip('login sukses karyawan -> redirect ke /', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('budi@contoh.com');
    await page.getByPlaceholder(/password/i).fill('Rolis2026!');
    await page.getByRole('button', { name: /masuk/i }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });
});
