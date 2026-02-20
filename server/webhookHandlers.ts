import { getStripeSync } from './stripeClient';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. '
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    try {
      const rawEvent = JSON.parse(payload.toString());
      const eventType = rawEvent.type;
      const eventData = rawEvent.data?.object;

      if (!eventData) return;

      if (eventType.startsWith('customer.subscription.')) {
        await WebhookHandlers.handleSubscriptionEvent(eventType, eventData);
      }

      if (eventType === 'checkout.session.completed') {
        await WebhookHandlers.handleCheckoutCompleted(eventData);
      }
    } catch (error) {
      console.error('Error processing webhook event for user sync:', error);
    }
  }

  static async handleSubscriptionEvent(eventType: string, subscription: any) {
    const customerId = subscription.customer;
    if (!customerId) return;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));

    if (!user) {
      console.log(`No user found for Stripe customer ${customerId}`);
      return;
    }

    const status = subscription.status;
    console.log(`Subscription ${eventType} for user ${user.id}: status=${status}`);

    await db
      .update(users)
      .set({
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: status,
      })
      .where(eq(users.id, user.id));
  }

  static async handleCheckoutCompleted(session: any) {
    if (session.mode !== 'subscription') return;

    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (!customerId || !subscriptionId) return;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));

    if (!user) return;

    await db
      .update(users)
      .set({
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active',
      })
      .where(eq(users.id, user.id));

    console.log(`Checkout completed for user ${user.id}, subscription ${subscriptionId}`);
  }
}
