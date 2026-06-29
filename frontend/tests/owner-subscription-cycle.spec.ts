/**
 * Owner-realistic subscription cycle test against PROD (mumtaz.ai)
 *
 * Drives a real Chromium browser through the actual user flow:
 *   - Pre-bootstrap a test user + session cookie (bypasses Turnstile)
 *   - For each phase (daily, weekly, monthly, yearly, random, daily-again):
 *       For each of 18 agents:
 *         1. Navigate to /subscribe?slug={agent}&agent={Name}
 *         2. Click the plan button
 *         3. Wait for redirect to checkout.stripe.com
 *         4. Fill card 4242 4242 4242 4242, exp 12/34, CVC 123, zip 12345
 *         5. Submit
 *         6. Wait for redirect to /subscription-success
 *         7. Verify subscription is active via /api/agentSubscriptions/check
 *       Cancel all 18 (via DELETE API on the resulting subscription IDs)
 *
 * Run:
 *   STRIPE_TEST_BOOTSTRAP_JSON='{"userId":"...","email":"...","cookie":"sessionId=..."}'
 *     npx playwright test tests/owner-subscription-cycle.spec.ts \
 *       --project=chromium --headed --workers=1
 *
 * If STRIPE_TEST_BOOTSTRAP_JSON is not set, the test will skip with a hint.
 * Bootstrap on EC2 with:
 *   ssh ec2 'cd shiny-friend-disco && node backend/scripts/test-bootstrap-session.cjs'
 */

import { test, expect, BrowserContext, Page } from '@playwright/test';
import Stripe from 'stripe';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://mumtaz.ai';
const BACKEND_BASE = `${BASE_URL}`; // proxied via /api on same origin
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_CUSTOMER_ID = process.env.STRIPE_TEST_CUSTOMER_ID || '';

const AGENTS: Array<{ slug: string; name: string }> = [
  { slug: 'julie-girlfriend', name: 'Julie Girlfriend' },
  { slug: 'emma-emotional', name: 'Emma Emotional' },
  { slug: 'einstein', name: 'Einstein' },
  { slug: 'tech-wizard', name: 'Tech Wizard' },
  { slug: 'mrs-boss', name: 'Mrs Boss' },
  { slug: 'comedy-king', name: 'Comedy King' },
  { slug: 'chess-player', name: 'Chess Player' },
  { slug: 'fitness-guru', name: 'Fitness Guru' },
  { slug: 'travel-buddy', name: 'Travel Buddy' },
  { slug: 'drama-queen', name: 'Drama Queen' },
  { slug: 'chef-biew', name: 'Chef Biew' },
  { slug: 'professor-astrology', name: 'Professor Astrology' },
  { slug: 'nid-gaming', name: 'Nid Gaming' },
  { slug: 'ben-sega', name: 'Ben Sega' },
  { slug: 'bishop-burger', name: 'Bishop Burger' },
  { slug: 'knight-logic', name: 'Knight Logic' },
  { slug: 'lazy-pawn', name: 'Lazy Pawn' },
  { slug: 'rook-jokey', name: 'Rook Jokey' },
];

const ALL_PLANS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
type Plan = (typeof ALL_PLANS)[number];

interface BootstrapInfo {
  userId: string;
  email: string;
  sessionId: string;
  cookie: string;
}

function readBootstrap(): BootstrapInfo {
  const raw = process.env.STRIPE_TEST_BOOTSTRAP_JSON;
  if (!raw) throw new Error('STRIPE_TEST_BOOTSTRAP_JSON env not set. Run test-bootstrap-session.cjs first.');
  return JSON.parse(raw);
}

async function setSessionCookies(context: BrowserContext, info: BootstrapInfo) {
  const domain = '.mumtaz.ai';
  const cookies = [
    { name: 'session_id', value: info.sessionId, domain, path: '/', secure: true, httpOnly: true, sameSite: 'Lax' as const },
    { name: 'sessionId', value: info.sessionId, domain, path: '/', secure: true, httpOnly: true, sameSite: 'Lax' as const },
    { name: 'userId', value: info.userId, domain, path: '/', secure: true, sameSite: 'Lax' as const },
    { name: 'userEmail', value: info.email, domain, path: '/', secure: true, sameSite: 'Lax' as const },
  ];
  await context.addCookies(cookies);
}

async function checkActive(page: Page, info: BootstrapInfo, agentSlug: string): Promise<{ active: boolean; subscriptionId?: string; plan?: string }> {
  const resp = await page.request.get(`${BACKEND_BASE}/api/agentSubscriptions/check/${info.userId}/${agentSlug}`, {
    headers: { cookie: info.cookie },
  });
  if (!resp.ok()) return { active: false };
  const data = await resp.json();
  // Endpoint returns { hasActiveSubscription, subscription }
  if (data.hasActiveSubscription && data.subscription?.id) {
    return { active: true, subscriptionId: data.subscription.id, plan: data.subscription.plan };
  }
  return { active: false };
}

async function cancelSubscription(page: Page, info: BootstrapInfo, subscriptionId: string) {
  const resp = await page.request.delete(`${BACKEND_BASE}/api/agentSubscriptions/${subscriptionId}`, {
    headers: { cookie: info.cookie },
  });
  return resp.ok();
}

async function fillStripeCheckout(page: Page) {
  // Stripe Checkout (hosted page, iframe-less variant).
  // Wait for the form to mount.
  await page.waitForLoadState('domcontentloaded');
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });

  // Email may be pre-filled; fill if empty
  const emailInput = page.locator('input#email').first();
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    const value = await emailInput.inputValue().catch(() => '');
    if (!value) await emailInput.fill('cycle-test@mumtaz.ai');
  }

  await page.locator('input#cardNumber').fill('4242 4242 4242 4242');
  await page.locator('input#cardExpiry').fill('12 / 34');
  await page.locator('input#cardCvc').fill('123');

  const nameField = page.locator('input#billingName');
  if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameField.fill('Cycle Test');
  }

  const zipField = page.locator('input#billingPostalCode');
  if (await zipField.isVisible({ timeout: 2000 }).catch(() => false)) {
    await zipField.fill('12345');
  }

  // Submit
  const submit = page.locator('[data-testid="hosted-payment-submit-button"], button.SubmitButton, button[type="submit"]').first();
  await submit.click();
}

async function subscribeOne(page: Page, info: BootstrapInfo, agent: { slug: string; name: string }, plan: Plan) {
  const url = `${BASE_URL}/subscribe?slug=${agent.slug}&agent=${encodeURIComponent(agent.name)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // The subscribe page renders 4 plan cards with button text 'Purchase {Type} Access'.
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const button = page.getByRole('button', { name: new RegExp(`Purchase\\s+${planLabel}\\s+Access`, 'i') }).first();
  await button.waitFor({ state: 'visible', timeout: 15000 });
  await button.click({ timeout: 10000 });

  // Wait for Stripe Checkout redirect & fill
  await fillStripeCheckout(page);

  // Wait for redirect back to /subscription-success
  await page.waitForURL(/\/subscription-success/, { timeout: 90000 });

  // Verify in API
  // Poll briefly because webhook may need a sec to land
  for (let i = 0; i < 6; i++) {
    const res = await checkActive(page, info, agent.slug);
    if (res.active && res.plan === plan) return res;
    await page.waitForTimeout(2500);
  }
  throw new Error(`Subscription did not become active for ${agent.slug}/${plan}`);
}

function pickRandomPlan(): Plan {
  return ALL_PLANS[Math.floor(Math.random() * ALL_PLANS.length)];
}

test.describe.configure({ mode: 'serial' });

test('owner-subscription-cycle: 6 phases × 18 agents through real Stripe Checkout', async ({ browser }) => {
  test.setTimeout(0); // no timeout — this is a long-running flow

  const info = readBootstrap();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
  });
  await setSessionCookies(context, info);
  const page = await context.newPage();

  const summary: Array<{ phase: string; ok: number; fail: number; failures: string[] }> = [];

  const runPhase = async (label: string, planSelector: (agent: any) => Plan, doCancel = true) => {
    console.log(`\n========== PHASE: ${label} ==========`);
    const failures: string[] = [];
    let ok = 0; let fail = 0;
    const created: Array<{ slug: string; subscriptionId: string }> = [];

    for (const agent of AGENTS) {
      const plan = planSelector(agent);
      const tag = `${agent.slug.padEnd(22)} ${plan.padEnd(8)}`;
      try {
        const res = await subscribeOne(page, info, agent, plan);
        if (res.subscriptionId) created.push({ slug: agent.slug, subscriptionId: res.subscriptionId });
        console.log(`  ✓ ${tag} sub=${res.subscriptionId}`);
        ok++;
      } catch (e: any) {
        console.error(`  ✗ ${tag} ${e.message}`);
        failures.push(`${agent.slug}/${plan}: ${e.message}`);
        fail++;
      }
    }

    if (doCancel) {
      console.log(`  Canceling ${created.length}...`);
      for (const c of created) {
        const cancelled = await cancelSubscription(page, info, c.subscriptionId);
        if (!cancelled) failures.push(`cancel ${c.slug}: failed`);
      }
      console.log(`  ✓ Canceled`);
    }
    summary.push({ phase: label, ok, fail, failures });
  };

  await runPhase('1-daily',   () => 'daily',   true);
  await runPhase('2-weekly',  () => 'weekly',  true);
  await runPhase('3-monthly', () => 'monthly', true);
  await runPhase('4-yearly',  () => 'yearly',  true);

  const randomMap: Record<string, Plan> = {};
  AGENTS.forEach((a) => { randomMap[a.slug] = pickRandomPlan(); });
  await runPhase('5-random',  (a) => randomMap[a.slug], true);

  // Final phase: leave daily subscriptions ACTIVE so we can validate auto-renew later
  await runPhase('6-daily-again', () => 'daily', false);

  console.log('\n=========== FINAL SUMMARY ===========');
  for (const r of summary) {
    console.log(`  ${r.phase.padEnd(16)} ok=${r.ok}/${AGENTS.length}  fail=${r.fail}`);
    for (const f of r.failures) console.log(`    ✗ ${f}`);
  }
  const totalFail = summary.reduce((s, r) => s + r.fail, 0);

  // ============================================
  // AUTO-RENEW VALIDATION (Stripe SDK)
  // ============================================
  if (STRIPE_SECRET_KEY) {
    console.log('\n=========== AUTO-RENEW VALIDATION ===========');
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
    let customerId = STRIPE_CUSTOMER_ID;
    if (!customerId) {
      const matches = await stripe.customers.list({ email: info.email, limit: 1 });
      customerId = matches.data[0]?.id || '';
      console.log(`  Discovered Stripe customer ${customerId || '(none)'} for ${info.email}`);
    }
    if (!customerId) {
      console.log('  [skip] No Stripe customer found for this email yet.');
      expect(totalFail, `${totalFail} failures across phases`).toBe(0);
      return;
    }
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 100 });
    console.log(`  Active Stripe subscriptions: ${subs.data.length}`);
    const bad: string[] = [];
    for (const s of subs.data) {
      const item = s.items.data[0];
      const interval = item?.price?.recurring?.interval;
      const cap = s.cancel_at_period_end;
      const renews = s.current_period_end * 1000 > Date.now();
      const tag = `${(s.metadata?.agentId || s.metadata?.slug || '?').padEnd(22)} ${String(interval).padEnd(6)} cap=${cap} renews=${renews}`;
      if (cap || !renews || item?.price?.type !== 'recurring') {
        console.log(`  ✗ ${tag}`); bad.push(s.id);
      } else {
        console.log(`  ✓ ${tag}`);
      }
    }
    expect(bad, `${bad.length} subscriptions failed auto-renew assertion`).toEqual([]);
  } else {
    console.log('\n[skip] Auto-renew validation — set STRIPE_SECRET_KEY to enable.');
  }

  expect(totalFail, `${totalFail} failures across phases`).toBe(0);
});
