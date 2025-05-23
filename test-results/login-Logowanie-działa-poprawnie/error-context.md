# Test info

- Name: Logowanie działa poprawnie
- Location: /var/www/html/e2e/login.spec.js:4:1

# Error details

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://213.73.1.69:3000/", waiting until "load"

    at /var/www/html/e2e/login.spec.js:6:14
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 | const fs = require('fs');
   3 |
   4 | test('Logowanie działa poprawnie', async ({ page }) => {
   5 |   // Otwórz frontend, NIE backend!
>  6 |   await page.goto('/');
     |              ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
   7 |
   8 |
   9 |   // Zapisz HTML do debugowania
  10 |   const html = await page.content();
  11 |   fs.writeFileSync('page-dump.html', html);
  12 |
  13 |   // Poczekaj na input logowania
  14 |   await page.waitForSelector('#login-username', { timeout: 8000 });
  15 |
  16 |   // Wypełnij dane logowania
  17 |   await page.fill('#login-username', 'testuser');
  18 |   await page.fill('#login-password', 'test123');
  19 |   await page.click('#login-form button[type="submit"]');
  20 |
  21 |   // Poczekaj na pojawienie się dashboardu
  22 |   await expect(page.locator('#dashboard-view')).toBeVisible({ timeout: 10000 });
  23 | });
  24 |
```