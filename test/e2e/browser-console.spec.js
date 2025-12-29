/**
 * End-to-end tests for browser-console web component
 * Run with: npm run test:e2e
 */

import { test, expect } from '@playwright/test';

test.describe('BrowserConsole Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/');
  });

  // Helper to get locator inside the web component's shadow DOM
  const getConsoleLocator = (page) => page.locator('browser-console');

  test.describe('Component Rendering', () => {
    test('should render the console component', async ({ page }) => {
      const consoleEl = getConsoleLocator(page);
      await expect(consoleEl).toBeVisible();
    });

    test('should have filter buttons', async ({ page }) => {
      // Use exact match to avoid "Run All Tests" button
      await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Log', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Info', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Warn', exact: true })).toBeVisible();
      // Error button inside the console component
      await expect(page.locator('browser-console').getByRole('button', { name: 'Error', exact: true })).toBeVisible();
    });

    test('should have theme and clear buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Toggle light/dark theme' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Clear all logs' })).toBeVisible();
    });
  });

  test.describe('Console Logging', () => {
    test('should capture console.log', async ({ page }) => {
      await page.getByRole('button', { name: 'console.log()' }).click();

      const logEntry = page.locator('[role="log"]').getByText('[LOG]');
      await expect(logEntry).toBeVisible();
    });

    test('should capture console.info', async ({ page }) => {
      await page.getByRole('button', { name: 'console.info()' }).click();

      const logEntry = page.locator('[role="log"]').getByText('[INFO]');
      await expect(logEntry).toBeVisible();
    });

    test('should capture console.warn', async ({ page }) => {
      await page.getByRole('button', { name: 'console.warn()' }).click();

      const logEntry = page.locator('[role="log"]').getByText('[WARN]');
      await expect(logEntry).toBeVisible();
    });

    test('should capture console.error', async ({ page }) => {
      await page.getByRole('button', { name: 'console.error()' }).click();

      const logEntry = page.locator('[role="log"]').getByText('[ERROR]');
      await expect(logEntry).toBeVisible();
    });

    test('should display objects with expandable view', async ({ page }) => {
      await page.getByRole('button', { name: 'Object', exact: true }).click();

      // Should show expandable object
      const expandable = page.locator('[role="log"]').getByRole('button', { name: /Object.*name/ });
      await expect(expandable).toBeVisible();
    });
  });

  test.describe('Expand/Collapse', () => {
    test('should expand object when clicked', async ({ page }) => {
      // Clear any existing logs first
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.getByRole('button', { name: 'Object', exact: true }).click();

      const expandable = page.locator('[role="log"]').getByRole('button', { name: /Object.*name/ }).first();
      await expect(expandable).toHaveAttribute('aria-expanded', 'false');

      await expandable.click();
      await expect(expandable).toHaveAttribute('aria-expanded', 'true');

      // Should show properties
      const properties = page.locator('[role="region"]').filter({ hasText: 'name:' }).first();
      await expect(properties).toBeVisible();
    });

    test('should collapse object when clicked again', async ({ page }) => {
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.getByRole('button', { name: 'Object', exact: true }).click();

      const expandable = page.locator('[role="log"]').getByRole('button', { name: /Object.*name/ }).first();
      await expandable.click();
      await expect(expandable).toHaveAttribute('aria-expanded', 'true');

      await expandable.click();
      await expect(expandable).toHaveAttribute('aria-expanded', 'false');
    });

    test('should support keyboard navigation with Enter', async ({ page }) => {
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.getByRole('button', { name: 'Object', exact: true }).click();

      const expandable = page.locator('[role="log"]').getByRole('button', { name: /Object.*name/ }).first();
      await expandable.focus();
      await page.keyboard.press('Enter');

      await expect(expandable).toHaveAttribute('aria-expanded', 'true');
    });

    test('should support keyboard navigation with Space', async ({ page }) => {
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.getByRole('button', { name: 'Object', exact: true }).click();

      const expandable = page.locator('[role="log"]').getByRole('button', { name: /Object.*name/ }).first();
      await expandable.focus();
      await page.keyboard.press('Space');

      await expect(expandable).toHaveAttribute('aria-expanded', 'true');
    });
  });

  test.describe('Filtering', () => {
    test('should filter by log type', async ({ page }) => {
      // Clear and generate different log types
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.getByRole('button', { name: 'console.log()' }).click();
      await page.getByRole('button', { name: 'console.error()' }).click();

      // Filter to errors only - use the filter button inside the console
      await page.locator('browser-console').getByRole('button', { name: 'Error', exact: true }).click();

      // Should show error but not log
      await expect(page.locator('[role="log"]').getByText('[ERROR]').first()).toBeVisible();
      await expect(page.locator('[role="log"]').getByText('[LOG]')).not.toBeVisible();
    });

    test('should show all logs when All filter selected', async ({ page }) => {
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.getByRole('button', { name: 'console.log()' }).click();
      await page.getByRole('button', { name: 'console.error()' }).click();

      // Filter to errors
      await page.locator('browser-console').getByRole('button', { name: 'Error', exact: true }).click();
      // Back to all
      await page.getByRole('button', { name: 'All', exact: true }).click();

      await expect(page.locator('[role="log"]').getByText('[LOG]').first()).toBeVisible();
      await expect(page.locator('[role="log"]').getByText('[ERROR]').first()).toBeVisible();
    });

    test('should update aria-pressed on filter buttons', async ({ page }) => {
      const allBtn = page.getByRole('button', { name: 'All', exact: true });
      const errorBtn = page.locator('browser-console').getByRole('button', { name: 'Error', exact: true });

      await expect(allBtn).toHaveAttribute('aria-pressed', 'true');
      await expect(errorBtn).toHaveAttribute('aria-pressed', 'false');

      await errorBtn.click();

      await expect(allBtn).toHaveAttribute('aria-pressed', 'false');
      await expect(errorBtn).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Theme Toggle', () => {
    test('should toggle between dark and light themes', async ({ page }) => {
      const themeBtn = page.getByRole('button', { name: /toggle.*theme/i });
      const consoleFeed = page.locator('.console-feed');

      // Default is dark
      await expect(consoleFeed).toHaveAttribute('data-theme', 'dark');

      await themeBtn.click();
      await expect(consoleFeed).toHaveAttribute('data-theme', 'light');

      await themeBtn.click();
      await expect(consoleFeed).toHaveAttribute('data-theme', 'dark');
    });
  });

  test.describe('Clear Logs', () => {
    test('should clear all logs', async ({ page }) => {
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.getByRole('button', { name: 'console.log()' }).click();
      await expect(page.locator('[role="log"]').getByText('[LOG]').first()).toBeVisible();

      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await expect(page.locator('[role="log"]').getByText('[LOG]')).not.toBeVisible();
    });
  });

  test.describe('Data Type Formatting', () => {
    test('should format arrays', async ({ page }) => {
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.getByRole('button', { name: 'Array', exact: true }).click();

      const logEntry = page.locator('[role="log"]').getByText(/Array\(\d+\)/).first();
      await expect(logEntry).toBeVisible();
    });

    test('should format console.table', async ({ page }) => {
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.getByRole('button', { name: 'table()' }).click();

      const tableMethod = page.locator('[role="log"]').getByText('[TABLE]').first();
      await expect(tableMethod).toBeVisible();

      // Should have a table element
      const table = page.locator('[role="log"] table').first();
      await expect(table).toBeVisible();
    });

    test('should format dates', async ({ page }) => {
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.getByRole('button', { name: 'Date', exact: true }).click();

      // Date should be formatted as ISO string
      const dateEntry = page.locator('[role="log"]').getByText(/\d{4}-\d{2}-\d{2}T/).first();
      await expect(dateEntry).toBeVisible();
    });
  });

  test.describe('Map and Set Support', () => {
    test('should format Map correctly', async ({ page }) => {
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.evaluate(() => {
        const testMap = new Map([['key1', 'value1'], ['key2', 42]]);
        console.log('Map test:', testMap);
      });

      const mapEntry = page.locator('[role="log"]').getByText(/Map\(2\)/).first();
      await expect(mapEntry).toBeVisible();
    });

    test('should format Set correctly', async ({ page }) => {
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.evaluate(() => {
        const testSet = new Set([1, 2, 3, 'hello']);
        console.log('Set test:', testSet);
      });

      const setEntry = page.locator('[role="log"]').getByText(/Set\(4\)/).first();
      await expect(setEntry).toBeVisible();
    });
  });

  test.describe('Symbol Support', () => {
    test('should display Symbol keys in objects', async ({ page }) => {
      await page.getByRole('button', { name: 'Clear all logs' }).click();
      await page.evaluate(() => {
        const obj = { [Symbol('secret')]: 'hidden', normal: 'visible' };
        console.log('Symbol test:', obj);
      });

      const symbolEntry = page.locator('[role="log"]').getByText(/Symbol\(secret\)/).first();
      await expect(symbolEntry).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('region', { name: 'Console output' })).toBeVisible();
      await expect(page.getByRole('toolbar', { name: 'Console controls' })).toBeVisible();
      await expect(page.getByRole('log', { name: 'Console log entries' })).toBeVisible();
    });

    test('should have proper button groups', async ({ page }) => {
      await expect(page.getByRole('group', { name: 'Filter by log type' })).toBeVisible();
      await expect(page.getByRole('group', { name: 'Console actions' })).toBeVisible();
    });

    test('expandable elements should be focusable', async ({ page }) => {
      await page.getByRole('button', { name: 'Object', exact: true }).click();

      const expandable = page.locator('[role="log"]').getByRole('button', { name: /Object.*name/ });
      await expandable.focus();

      await expect(expandable).toBeFocused();
    });
  });
});
