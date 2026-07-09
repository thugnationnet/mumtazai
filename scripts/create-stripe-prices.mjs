/**
 * Create Stripe products + prices at correct amounts for all agents
 * Daily $5 | Weekly $7 | Monthly $30 | Yearly $300
 * GenCraft Pro: Daily $10 | Weekly $15 | Monthly $30 | Yearly $300
 * Canvas Build: Daily $10 | Weekly $20 | Monthly $50 | Yearly $500
 */
import Stripe from 'stripe';
import fs from 'fs';

const SK = process.env.STRIPE_SECRET_KEY;
if (!SK) { console.error('Missing STRIPE_SECRET_KEY env var'); process.exit(1); }
const stripe = new Stripe(SK, { apiVersion: '2024-11-20.acacia' });

const AGENTS = [
  'comedy-king', 'ben-sega', 'bishop-burger', 'chef-biew', 'chess-player',
  'drama-queen', 'einstein', 'emma-emotional', 'fitness-guru', 'julie-girlfriend',
  'knight-logic', 'lazy-pawn', 'mrs-boss', 'nid-gaming', 'professor-astrology',
  'rook-jokey', 'tech-wizard', 'travel-buddy',
];

const AGENT_NAMES = {
  'comedy-king': 'Comedy King', 'ben-sega': 'Ben Sega', 'bishop-burger': 'Bishop Burger',
  'chef-biew': 'Chef Biew', 'chess-player': 'Chess Player', 'drama-queen': 'Drama Queen',
  'einstein': 'Einstein', 'emma-emotional': 'Emma Emotional', 'fitness-guru': 'Fitness Guru',
  'julie-girlfriend': 'Julie Girlfriend', 'knight-logic': 'Knight Logic', 'lazy-pawn': 'Lazy Pawn',
  'mrs-boss': 'Mrs Boss', 'nid-gaming': 'Nid Gaming', 'professor-astrology': 'Professor Astrology',
  'rook-jokey': 'Rook Jokey', 'tech-wizard': 'Tech Wizard', 'travel-buddy': 'Travel Buddy',
  'gencraft-pro': 'Gencraft Pro', 'canvas-build': 'Canvas Build',
};

// Prices in cents
const STANDARD_AMOUNTS = { daily: 500, weekly: 700, monthly: 3000, yearly: 30000 };
const GENCRAFT_AMOUNTS  = { daily: 1000, weekly: 1500, monthly: 3000, yearly: 30000 };
const CANVAS_AMOUNTS    = { daily: 1000, weekly: 2000, monthly: 5000, yearly: 50000 };

const INTERVALS = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' };

const envLines = [];

async function createPrice(slug, name, plan, amounts) {
  const amount = amounts[plan];
  const label = plan.charAt(0).toUpperCase() + plan.slice(1);
  const upperSlug = slug.toUpperCase();
  const upperPlan = plan.toUpperCase();

  // Create product
  const product = await stripe.products.create({
    name: `${name} - AI Agent Access (${label})`,
    description: `Access to ${name} AI agent on Mumtaz AI`,
    metadata: { agent: slug, plan },
  });

  // Create one-time price
  const price = await stripe.prices.create({
    unit_amount: amount,
    currency: 'usd',
    product: product.id,
    metadata: { agent: slug, plan, label: `$${(amount/100).toFixed(0)} ${label}` },
  });

  console.log(`  ✓ ${slug} ${plan}: ${product.id} / ${price.id} ($${amount/100})`);
  envLines.push(`STRIPE_PRODUCT_${upperSlug}_${upperPlan}=${product.id}`);
  envLines.push(`STRIPE_PRICE_${upperSlug}_${upperPlan}=${price.id}`);
  return { productId: product.id, priceId: price.id };
}

(async () => {
  console.log('Creating Stripe products and prices...\n');
  console.log('Plan amounts: Daily $5 | Weekly $7 | Monthly $30 | Yearly $300');
  console.log('GenCraft Pro: Daily $10 | Weekly $15 | Monthly $30 | Yearly $300');
  console.log('Canvas Build: Daily $10 | Weekly $20 | Monthly $50 | Yearly $500\n');

  // Standard agents
  for (const slug of AGENTS) {
    console.log(`→ ${AGENT_NAMES[slug]}`);
    for (const plan of ['daily', 'weekly', 'monthly', 'yearly']) {
      await createPrice(slug, AGENT_NAMES[slug], plan, STANDARD_AMOUNTS);
    }
  }

  // GenCraft Pro
  console.log('→ Gencraft Pro');
  const gencraftResults = {};
  for (const plan of ['daily', 'weekly', 'monthly', 'yearly']) {
    gencraftResults[plan] = await createPrice('gencraft-pro', 'Gencraft Pro', plan, GENCRAFT_AMOUNTS);
  }
  // Underscore variant aliases
  for (const plan of ['daily', 'weekly', 'monthly', 'yearly']) {
    const upperPlan = plan.toUpperCase();
    envLines.push(`STRIPE_PRODUCT_GENCRAFT_PRO_${upperPlan}=${gencraftResults[plan].productId}`);
    envLines.push(`STRIPE_PRICE_GENCRAFT_PRO_${upperPlan}=${gencraftResults[plan].priceId}`);
  }
  envLines.push(`STRIPE_PRODUCT_GENCRAFT-PRO=${gencraftResults['daily'].productId}`);

  // Canvas Build
  console.log('→ Canvas Build');
  const canvasResults = {};
  for (const plan of ['daily', 'weekly', 'monthly', 'yearly']) {
    canvasResults[plan] = await createPrice('canvas-build', 'Canvas Build', plan, CANVAS_AMOUNTS);
  }
  // Underscore variant aliases
  for (const plan of ['daily', 'weekly', 'monthly', 'yearly']) {
    const upperPlan = plan.toUpperCase();
    envLines.push(`STRIPE_PRODUCT_CANVAS_BUILD_${upperPlan}=${canvasResults[plan].productId}`);
    envLines.push(`STRIPE_PRICE_CANVAS_BUILD_${upperPlan}=${canvasResults[plan].priceId}`);
  }
  envLines.push(`STRIPE_PRODUCT_CANVAS-BUILD=${canvasResults['daily'].productId}`);

  const out = '/tmp/stripe_correct_prices.env';
  fs.writeFileSync(out, envLines.join('\n') + '\n');
  console.log(`\nDone! ${envLines.length} entries written to ${out}`);
})();
