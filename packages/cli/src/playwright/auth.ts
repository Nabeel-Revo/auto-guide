import type { Page } from 'playwright';
import type { AuthConfig } from '@autoguide/core';
import { logger } from '../utils/logger';

export async function authenticate(page: Page, baseUrl: string, auth: AuthConfig): Promise<void> {
  switch (auth.strategy) {
    case 'form':
      await authenticateForm(page, baseUrl, auth);
      break;
    case 'cookie':
      await authenticateCookie(page, auth);
      break;
    case 'bearer':
      await authenticateBearer(page, auth);
      break;
    case 'none':
      break;
  }
}

async function authenticateForm(page: Page, baseUrl: string, auth: AuthConfig): Promise<void> {
  if (!auth.loginUrl || !auth.credentials || !auth.selectors) {
    throw new Error('Form auth requires loginUrl, credentials, and selectors');
  }
  logger.step('auth', `Logging in via form at ${auth.loginUrl}`);
  const loginUrl = auth.loginUrl.startsWith('http') ? auth.loginUrl : `${baseUrl}${auth.loginUrl}`;
  await page.goto(loginUrl);
  await page.fill(auth.selectors.username, auth.credentials.username);
  await page.fill(auth.selectors.password, auth.credentials.password);
  await page.click(auth.selectors.submit);
  if (auth.waitAfterLogin) {
    await page.waitForURL(`**${auth.waitAfterLogin}**`, { timeout: 15000 });
  }
  logger.success('Authentication successful');
}

async function authenticateCookie(page: Page, auth: AuthConfig): Promise<void> {
  if (!auth.cookies) {
    throw new Error('Cookie auth requires cookies array');
  }
  logger.step('auth', 'Setting cookies');
  await page.context().addCookies(auth.cookies);
  logger.success('Cookies set');
}

async function authenticateBearer(page: Page, auth: AuthConfig): Promise<void> {
  if (!auth.token) {
    throw new Error('Bearer auth requires token');
  }
  logger.step('auth', 'Setting bearer token header');
  await page.setExtraHTTPHeaders({
    Authorization: `Bearer ${auth.token}`,
  });
  logger.success('Bearer token set');
}
