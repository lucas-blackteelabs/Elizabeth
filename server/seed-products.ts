import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  const products = await stripe.products.search({ query: "name:'Elizabeth Membership'" });
  if (products.data.length > 0) {
    console.log('Elizabeth Membership product already exists:', products.data[0].id);
    const prices = await stripe.prices.list({ product: products.data[0].id, active: true });
    for (const price of prices.data) {
      console.log(`  Price: ${price.id} - $${(price.unit_amount || 0) / 100}/${price.recurring?.interval}`);
    }
    return;
  }

  const product = await stripe.products.create({
    name: 'Elizabeth Membership',
    description: 'Full access to Elizabeth - your personal cancer support companion. Includes AI assistant, medical tracking, meal planning, community, and more.',
    metadata: {
      app: 'elizabeth',
    },
  });
  console.log('Created product:', product.id);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 995,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'monthly', label: 'Monthly' },
  });
  console.log('Created monthly price:', monthlyPrice.id, '- $9.95/month');

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 9588,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { plan: 'annual', label: 'Annual' },
  });
  console.log('Created annual price:', yearlyPrice.id, '- $95.88/year ($7.99/month)');
}

createProducts().catch(console.error);
