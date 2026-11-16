import { expect, test } from '@playwright/test';

async function login(page, email) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/workspaces');
}

async function openGeneral(page) {
  await page.getByRole('link', { name: /Demo Workspace/ }).click();
  await page.getByRole('link', { name: /^general/ }).click();
  await expect(page.getByLabel('Message', { exact: true })).toBeVisible();
}

test('a message sent in one session appears in the other without a reload', async ({ browser }) => {
  const ownerContext = await browser.newContext();
  const memberContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  const member = await memberContext.newPage();

  await login(owner, 'owner@demo.test');
  await login(member, 'member@demo.test');
  await openGeneral(owner);
  await openGeneral(member);

  const text = `live check ${Date.now()}`;
  await owner.getByLabel('Message', { exact: true }).fill(text);
  await owner.keyboard.press('Enter');

  await expect(member.getByText(text)).toBeVisible({ timeout: 15000 });

  await ownerContext.close();
  await memberContext.close();
});
