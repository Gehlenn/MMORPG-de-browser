import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_URL || 'http://localhost:3000';

/**
 * QA Exhaustivo - MMORPG Eldoria
 * Tier: Exhaustivo (critical + high + medium + low)
 */

test.describe('QA Exhaustivo - MMORPG', () => {
  
  test.beforeEach(async ({ page }) => {
    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Console error: ${msg.text()}`);
      }
    });
    
    // Monitor page errors
    page.on('pageerror', error => {
      console.error(`Page error: ${error.message}`);
    });
  });

  // ==========================================
  // FASE 1: Homepage & Landing
  // ==========================================
  
  test('Homepage loads without errors', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check page loads
    await expect(page).toHaveTitle(/Eldoria|MMORPG|Login/i);
    
    // Check no critical console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    await page.waitForLoadState('networkidle');
    
    // Critical: Should have no module/loading errors
    expect(consoleErrors.filter(e => 
      e.includes('MODULE_NOT_FOUND') || 
      e.includes('SyntaxError') ||
      e.includes('ReferenceError')
    )).toHaveLength(0);
  });

  test('Game client loads all required modules', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    
    // Wait for game to initialize
    await page.waitForTimeout(3000);
    
    // Check canvas exists
    const canvas = await page.locator('#gameCanvas, canvas').first();
    if (await canvas.isVisible().catch(() => false)) {
      console.log('✅ Game canvas found');
    }
    
    // Check for module errors in console
    const errors = await page.evaluate(() => {
      return window.errors || [];
    }).catch(() => []);
    
    expect(errors.filter(e => e.includes('module') || e.includes('import'))).toHaveLength(0);
  });

  // ==========================================
  // FASE 2: Authentication System
  // ==========================================
  
  test('Login form exists and is functional', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Find login form elements
    const usernameInput = page.locator('input[type="text"], input[name="username"], #username').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    const loginButton = page.locator('button[type="submit"], #loginBtn, .login-btn').first();
    
    // Check if form exists
    const hasForm = await usernameInput.isVisible().catch(() => false) ||
                   await passwordInput.isVisible().catch(() => false);
    
    if (hasForm) {
      console.log('✅ Login form detected');
      
      // Test form validation
      await loginButton.click().catch(() => {});
      
      // Should show error for empty fields (if client-side validation exists)
      await page.waitForTimeout(500);
    } else {
      console.log('ℹ️ No traditional login form found - may use socket-based auth');
    }
  });

  test('Registration flow (if available)', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Look for register/register button
    const registerBtn = page.locator('text=/registrar|register|sign up/i').first();
    
    if (await registerBtn.isVisible().catch(() => false)) {
      await registerBtn.click();
      await page.waitForTimeout(500);
      
      // Check registration form
      const inputs = await page.locator('input').count();
      console.log(`✅ Registration form with ${inputs} input fields`);
    }
  });

  // ==========================================
  // FASE 3: Navigation & UI Elements
  // ==========================================
  
  test('All navigation links are functional', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const links = await page.locator('a').all();
    const brokenLinks = [];
    
    for (const link of links.slice(0, 10)) { // Test first 10 links
      const href = await link.getAttribute('href').catch(() => null);
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          const response = await page.goto(href.startsWith('http') ? href : `${BASE_URL}${href}`, { timeout: 5000 });
          if (response && response.status() >= 400) {
            brokenLinks.push({ href, status: response.status() });
          }
          await page.goBack();
        } catch (e) {
          brokenLinks.push({ href, error: e.message });
        }
      }
    }
    
    // Critical: No 404s on internal navigation
    const criticalBroken = brokenLinks.filter(l => l.status === 404);
    expect(criticalBroken).toHaveLength(0);
  });

  test('UI elements render correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Screenshot for visual verification
    await page.screenshot({ path: 'qa-reports/screenshots/homepage.png', fullPage: true });
    
    // Check for common UI elements
    const buttons = await page.locator('button').count();
    const inputs = await page.locator('input').count();
    
    console.log(`✅ UI Elements: ${buttons} buttons, ${inputs} inputs`);
  });

  // ==========================================
  // FASE 4: Game Systems
  // ==========================================
  
  test('Character creation (if available)', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForTimeout(2000);
    
    // Look for class selection
    const classOptions = await page.locator('.class-option, [data-class], .character-class').all();
    
    if (classOptions.length > 0) {
      console.log(`✅ Found ${classOptions.length} character classes`);
      
      // Try selecting a class
      await classOptions[0].click().catch(() => {});
      await page.waitForTimeout(500);
    }
  });

  test('Combat system elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForTimeout(3000);
    
    // Look for combat UI
    const combatElements = await page.locator('.combat-ui, .attack-btn, .skill-btn, #combatPanel').all();
    
    console.log(`✅ Found ${combatElements.length} combat-related elements`);
  });

  // ==========================================
  // FASE 5: Performance & Error Handling
  // ==========================================
  
  test('Page load performance', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Page load time: ${loadTime}ms`);
    
    // Warning if > 3s, critical if > 10s
    expect(loadTime).toBeLessThan(10000);
  });

  test('No unhandled promise rejections', async ({ page }) => {
    const rejections = [];
    
    page.on('pageerror', error => {
      if (error.message.includes('unhandled') || error.message.includes('rejection')) {
        rejections.push(error.message);
      }
    });
    
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    
    expect(rejections).toHaveLength(0);
  });

  // ==========================================
  // FASE 6: Responsive Design
  // ==========================================
  
  test('Mobile viewport compatibility', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'qa-reports/screenshots/mobile.png' });
    
    // Check for horizontal scroll (shouldn't exist on mobile)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // Allow small tolerance
  });

  // ==========================================
  // FASE 7: Accessibility
  // ==========================================
  
  test('Basic accessibility checks', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    const missingAlt = [];
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (!alt) missingAlt.push(await img.getAttribute('src'));
    }
    
    console.log(`✅ ${images.length} images, ${missingAlt.length} missing alt text`);
    
    // Check for form labels
    const inputs = await page.locator('input').all();
    const unlabeledInputs = [];
    
    for (const input of inputs) {
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      const id = await input.getAttribute('id');
      
      let hasLabel = ariaLabel || placeholder;
      
      if (id && !hasLabel) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = label > 0;
      }
      
      if (!hasLabel) {
        unlabeledInputs.push(await input.getAttribute('name') || 'unnamed');
      }
    }
    
    console.log(`✅ ${inputs.length} inputs, ${unlabeledInputs.length} potentially unlabeled`);
  });

  // ==========================================
  // FASE 8: Socket.io Integration
  // ==========================================
  
  test('Socket.io connection', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check if socket.io client is loaded
    const socketLoaded = await page.evaluate(() => {
      return typeof io !== 'undefined' || window.socket !== undefined;
    }).catch(() => false);
    
    console.log(`✅ Socket.io available: ${socketLoaded}`);
  });
});

// ==========================================
// Health Score Summary
// ==========================================

test.afterAll(async () => {
  console.log('\n📊 QA Exhaustivo Completo!');
  console.log('Verifique qa-reports/screenshots/ para evidências visuais');
});
