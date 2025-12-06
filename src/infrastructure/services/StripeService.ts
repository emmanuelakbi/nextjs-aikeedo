import Stripe from 'stripe';
import { stripeConfig } from '../../lib/config';

/**
 * StripeService
 *
 * Handles all Stripe API interactions for payment processing, subscription management,
 * and webhook handling. Provides a centralized interface for Stripe operations.
 *
 * Requirements: 1.1, 2.1, 2.2, 3.1, 4.1, 6.1, 7.1
 */

export class StripeNotConfiguredError extends Error {
  constructor() {
    super(
      'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.'
    );
    this.name = 'StripeNotConfiguredError';
  }
}

export class StripeService {
  private static instance: StripeService | null = null;
  private stripe: Stripe | null = null;

  private constructor() {
    this.initializeStripe();
  }

  /**
   * Get singleton instance of StripeService
   */
  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Initialize Stripe client with configuration
   */
  private initializeStripe(): void {
    const secretKey = stripeConfig.secretKey();

    if (!secretKey) {
      // Stripe is optional, so we don't throw here
      // Methods will throw when called if Stripe is not configured
      return;
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
      appInfo: {
        name: 'AIKEEDO',
        version: '1.0.0',
      },
    });
  }

  /**
   * Get the Stripe client instance
   * Throws if Stripe is not configured
   */
  public getClient(): Stripe {
    if (!this.stripe) {
      throw new StripeNotConfiguredError();
    }
    return this.stripe;
  }

  /**
   * Check if Stripe is configured and available
   */
  public isConfigured(): boolean {
    return this.stripe !== null;
  }

  /**
   * Get Stripe publishable key for client-side usage
   */
  public getPublishableKey(): string | undefined {
    return stripeConfig.publishableKey();
  }

  /**
   * Get Stripe webhook secret for signature verification
   */
  public getWebhookSecret(): string | undefined {
    return stripeConfig.webhookSecret();
  }

  /**
   * Verify webhook signature
   * Requirements: 7.1
   *
   * @param payload - Raw request body
   * @param signature - Stripe signature header
   * @returns Verified Stripe event
   */
  public verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    const client = this.getClient();
    const webhookSecret = this.getWebhookSecret();

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not configured');
    }

    try {
      return client.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      throw new Error(
        `Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a checkout session for subscription or one-time payment
   * Requirements: 2.1, 4.1
   *
   * @param params - Checkout session parameters
   * @returns Stripe checkout session
   */
  public async createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams
  ): Promise<Stripe.Checkout.Session> {
    const client = this.getClient();
    return await client.checkout.sessions.create(params);
  }

  /**
   * Retrieve a checkout session
   *
   * @param sessionId - Checkout session ID
   * @returns Stripe checkout session
   */
  public async retrieveCheckoutSession(
    sessionId: string
  ): Promise<Stripe.Checkout.Session> {
    const client = this.getClient();
    return await client.checkout.sessions.retrieve(sessionId);
  }

  /**
   * Create a customer in Stripe
   * Requirements: 2.1
   *
   * @param params - Customer creation parameters
   * @returns Stripe customer
   */
  public async createCustomer(
    params: Stripe.CustomerCreateParams
  ): Promise<Stripe.Customer> {
    const client = this.getClient();
    return await client.customers.create(params);
  }

  /**
   * Retrieve a customer from Stripe
   *
   * @param customerId - Stripe customer ID
   * @returns Stripe customer
   */
  public async retrieveCustomer(
    customerId: string
  ): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    const client = this.getClient();
    return await client.customers.retrieve(customerId);
  }

  /**
   * Update a customer in Stripe
   *
   * @param customerId - Stripe customer ID
   * @param params - Customer update parameters
   * @returns Updated Stripe customer
   */
  public async updateCustomer(
    customerId: string,
    params: Stripe.CustomerUpdateParams
  ): Promise<Stripe.Customer> {
    const client = this.getClient();
    return await client.customers.update(customerId, params);
  }

  /**
   * Create a subscription
   * Requirements: 2.2, 3.1
   *
   * @param params - Subscription creation parameters
   * @returns Stripe subscription
   */
  public async createSubscription(
    params: Stripe.SubscriptionCreateParams
  ): Promise<Stripe.Subscription> {
    const client = this.getClient();
    return await client.subscriptions.create(params);
  }

  /**
   * Retrieve a subscription
   *
   * @param subscriptionId - Stripe subscription ID
   * @returns Stripe subscription
   */
  public async retrieveSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    const client = this.getClient();
    return await client.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Update a subscription
   * Requirements: 3.1, 3.2
   *
   * @param subscriptionId - Stripe subscription ID
   * @param params - Subscription update parameters
   * @returns Updated Stripe subscription
   */
  public async updateSubscription(
    subscriptionId: string,
    params: Stripe.SubscriptionUpdateParams
  ): Promise<Stripe.Subscription> {
    const client = this.getClient();
    return await client.subscriptions.update(subscriptionId, params);
  }

  /**
   * Cancel a subscription
   * Requirements: 3.3
   *
   * @param subscriptionId - Stripe subscription ID
   * @param cancelAtPeriodEnd - Whether to cancel at period end or immediately
   * @returns Canceled Stripe subscription
   */
  public async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Stripe.Subscription> {
    const client = this.getClient();

    if (cancelAtPeriodEnd) {
      return await client.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      return await client.subscriptions.cancel(subscriptionId);
    }
  }

  /**
   * Create a product in Stripe
   * Requirements: 1.1, 1.2
   *
   * @param params - Product creation parameters
   * @returns Stripe product
   */
  public async createProduct(
    params: Stripe.ProductCreateParams
  ): Promise<Stripe.Product> {
    const client = this.getClient();
    return await client.products.create(params);
  }

  /**
   * Create a price for a product
   * Requirements: 1.1, 1.2
   *
   * @param params - Price creation parameters
   * @returns Stripe price
   */
  public async createPrice(
    params: Stripe.PriceCreateParams
  ): Promise<Stripe.Price> {
    const client = this.getClient();
    return await client.prices.create(params);
  }

  /**
   * Retrieve an invoice
   * Requirements: 5.1, 5.2
   *
   * @param invoiceId - Stripe invoice ID
   * @returns Stripe invoice
   */
  public async retrieveInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    const client = this.getClient();
    return await client.invoices.retrieve(invoiceId);
  }

  /**
   * List invoices for a customer
   * Requirements: 5.2
   *
   * @param customerId - Stripe customer ID
   * @param params - List parameters
   * @returns List of Stripe invoices
   */
  public async listInvoices(
    customerId: string,
    params?: Stripe.InvoiceListParams
  ): Promise<Stripe.ApiList<Stripe.Invoice>> {
    const client = this.getClient();
    return await client.invoices.list({
      customer: customerId,
      ...params,
    });
  }

  /**
   * Attach a payment method to a customer
   * Requirements: 6.1, 6.2
   *
   * @param paymentMethodId - Payment method ID
   * @param customerId - Stripe customer ID
   * @returns Stripe payment method
   */
  public async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    const client = this.getClient();
    return await client.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  /**
   * Detach a payment method from a customer
   * Requirements: 6.3
   *
   * @param paymentMethodId - Payment method ID
   * @returns Stripe payment method
   */
  public async detachPaymentMethod(
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod> {
    const client = this.getClient();
    return await client.paymentMethods.detach(paymentMethodId);
  }

  /**
   * List payment methods for a customer
   * Requirements: 6.1
   *
   * @param customerId - Stripe customer ID
   * @param type - Payment method type
   * @returns List of payment methods
   */
  public async listPaymentMethods(
    customerId: string,
    type: Stripe.PaymentMethodListParams.Type = 'card'
  ): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
    const client = this.getClient();
    return await client.paymentMethods.list({
      customer: customerId,
      type,
    });
  }

  /**
   * Create a payment intent for one-time payments
   * Requirements: 4.1
   *
   * @param params - Payment intent creation parameters
   * @returns Stripe payment intent
   */
  public async createPaymentIntent(
    params: Stripe.PaymentIntentCreateParams
  ): Promise<Stripe.PaymentIntent> {
    const client = this.getClient();
    return await client.paymentIntents.create(params);
  }

  /**
   * Create a refund
   * Requirements: 11.1, 11.2
   *
   * @param params - Refund creation parameters
   * @returns Stripe refund
   */
  public async createRefund(
    params: Stripe.RefundCreateParams
  ): Promise<Stripe.Refund> {
    const client = this.getClient();
    return await client.refunds.create(params);
  }

  /**
   * Calculate proration for subscription changes
   * Requirements: 9.1, 9.2
   *
   * @param subscriptionId - Subscription ID
   * @param newPriceId - New price ID
   * @returns Upcoming invoice with proration details
   */
  public async calculateProration(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.UpcomingInvoice> {
    const client = this.getClient();
    const subscription = await this.retrieveSubscription(subscriptionId);

    if (!subscription.items.data[0]) {
      throw new Error('Subscription has no items');
    }

    return await client.invoices.upcoming({
      customer: subscription.customer as string,
      subscription: subscriptionId,
      subscription_items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
    });
  }

  /**
   * Create an invoice item for one-time charges
   * Requirements: 10.3 - Add overage charges to invoice
   *
   * @param params - Invoice item creation parameters
   * @returns Stripe invoice item
   */
  public async createInvoiceItem(
    params: Stripe.InvoiceItemCreateParams
  ): Promise<Stripe.InvoiceItem> {
    const client = this.getClient();
    return await client.invoiceItems.create(params);
  }
}

// Export singleton instance
export const stripeService = StripeService.getInstance();
