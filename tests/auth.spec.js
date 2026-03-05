const { test, expect } = require('@playwright/test');
const { login } = require('../src/auth/login');

test('login to onvio and reach dashboard', async ({ page }) => {
  // Use a longer timeout for the whole login process including MFA
  test.setTimeout(120000); 

  await login(page);

  // Validate we are indeed in the dashboard
  // We'll be flexible with the URL pattern
  await expect(page).toHaveURL(/.*dashboard.*/i);
});
