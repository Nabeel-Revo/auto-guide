import fs from 'fs';
import path from 'path';
import { chromium, type Browser, type Page } from 'playwright';
import type { AutoCapture, CaptureAction, AuthConfig } from '@autoguide/core';
import { logger } from '../utils/logger';
import { authenticate } from './auth';

export interface CaptureEngineConfig {
  viewport: { width: number; height: number };
  headless: boolean;
  baseUrl: string;
  timeout: number;
}

export class CaptureEngine {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: CaptureEngineConfig;

  constructor(config: CaptureEngineConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
    });
    const context = await this.browser.newContext({
      viewport: this.config.viewport,
    });
    this.page = await context.newPage();
    this.page.setDefaultTimeout(this.config.timeout);
  }

  async authenticateWith(auth: AuthConfig): Promise<void> {
    if (!this.page) throw new Error('Engine not initialized');
    await authenticate(this.page, this.config.baseUrl, auth);
  }

  async captureAutoScene(
    capture: AutoCapture,
    outputPath: string,
    delay?: number,
  ): Promise<void> {
    if (!this.page) throw new Error('Engine not initialized');

    const url = capture.route.startsWith('http')
      ? capture.route
      : `${this.config.baseUrl}${capture.route}`;

    await this.page.goto(url, { waitUntil: 'networkidle' });

    for (const action of capture.actions) {
      await this.executeAction(action);
    }

    if (capture.waitFor) {
      await this.page.waitForSelector(capture.waitFor, { timeout: this.config.timeout });
    }

    const waitMs = capture.delay ?? delay ?? 0;
    if (waitMs > 0) {
      await this.page.waitForTimeout(waitMs);
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    await this.page.screenshot({
      path: outputPath,
      fullPage: false,
    });
  }

  private async executeAction(action: CaptureAction): Promise<void> {
    if (!this.page) throw new Error('Engine not initialized');

    switch (action.type) {
      case 'click':
        await this.page.click(action.selector);
        break;
      case 'type':
        await this.page.fill(action.selector, action.text);
        break;
      case 'hover':
        await this.page.hover(action.selector);
        break;
      case 'wait':
        await this.page.waitForTimeout(action.ms);
        break;
      case 'waitForSelector':
        await this.page.waitForSelector(action.selector, { timeout: action.timeout });
        break;
      case 'scroll':
        await this.page.evaluate((y) => window.scrollTo(0, y), action.y);
        break;
      case 'select':
        await this.page.selectOption(action.selector, action.value);
        break;
      case 'press':
        await this.page.keyboard.press(action.key);
        break;
      case 'evaluate':
        await this.page.evaluate(action.script);
        break;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
