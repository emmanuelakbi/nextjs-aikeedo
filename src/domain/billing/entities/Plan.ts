import { Id } from '../../user/value-objects/Id';
import { PlanInterval } from '@prisma/client';

/**
 * Plan Entity
 *
 * Represents a subscription plan with pricing and features.
 * Requirements: Billing 1.1, 1.2, 1.3, 1.4, 1.5
 */

export interface PlanFeatures {
  [key: string]: boolean | string | number;
}

export interface PlanLimits {
  maxUsers?: number;
  maxGenerations?: number;
  maxStorage?: number;
  [key: string]: number | undefined;
}

export interface PlanProps {
  id: Id;
  name: string;
  description: string;
  price: number; // Price in cents
  currency: string;
  interval: PlanInterval;
  creditCount: number | null; // null = unlimited
  features: PlanFeatures;
  limits: PlanLimits;
  stripeProductId: string;
  stripePriceId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlanProps {
  name: string;
  description: string;
  price: number;
  currency?: string;
  interval: PlanInterval;
  creditCount: number | null;
  features?: PlanFeatures;
  limits?: PlanLimits;
  stripeProductId: string;
  stripePriceId: string;
}

export class Plan {
  private readonly props: PlanProps;

  private constructor(props: PlanProps) {
    this.props = props;
  }

  /**
   * Creates a new Plan entity
   * Requirements: Billing 1.1, 1.2
   */
  static create(createProps: CreatePlanProps): Plan {
    // Validate required fields
    if (!createProps.name?.trim()) {
      throw new Error('Plan name is required');
    }

    if (!createProps.description?.trim()) {
      throw new Error('Plan description is required');
    }

    if (createProps.price < 0) {
      throw new Error('Plan price must be non-negative');
    }

    if (createProps.creditCount !== null && createProps.creditCount < 0) {
      throw new Error('Credit count must be non-negative or null for unlimited');
    }

    if (!createProps.stripeProductId?.trim()) {
      throw new Error('Stripe product ID is required');
    }

    if (!createProps.stripePriceId?.trim()) {
      throw new Error('Stripe price ID is required');
    }

    const now = new Date();
    const props: PlanProps = {
      id: Id.generate(),
      name: createProps.name.trim(),
      description: createProps.description.trim(),
      price: createProps.price,
      currency: createProps.currency || 'usd',
      interval: createProps.interval,
      creditCount: createProps.creditCount,
      features: createProps.features || {},
      limits: createProps.limits || {},
      stripeProductId: createProps.stripeProductId.trim(),
      stripePriceId: createProps.stripePriceId.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    return new Plan(props);
  }

  /**
   * Reconstitutes a Plan entity from persistence
   */
  static fromPersistence(props: PlanProps): Plan {
    return new Plan(props);
  }

  /**
   * Updates the plan details
   * Requirements: Billing 1.3
   */
  update(data: {
    name?: string;
    description?: string;
    price?: number;
    creditCount?: number | null;
    features?: PlanFeatures;
    limits?: PlanLimits;
  }): void {
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) {
        throw new Error('Plan name cannot be empty');
      }
      this.props.name = trimmed;
    }

    if (data.description !== undefined) {
      const trimmed = data.description.trim();
      if (!trimmed) {
        throw new Error('Plan description cannot be empty');
      }
      this.props.description = trimmed;
    }

    if (data.price !== undefined) {
      if (data.price < 0) {
        throw new Error('Plan price must be non-negative');
      }
      this.props.price = data.price;
    }

    if (data.creditCount !== undefined) {
      if (data.creditCount !== null && data.creditCount < 0) {
        throw new Error('Credit count must be non-negative or null for unlimited');
      }
      this.props.creditCount = data.creditCount;
    }

    if (data.features !== undefined) {
      this.props.features = data.features;
    }

    if (data.limits !== undefined) {
      this.props.limits = data.limits;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Deprecates the plan (prevents new subscriptions)
   * Requirements: Billing 1.4
   */
  deprecate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Activates the plan
   * Requirements: Billing 1.4
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Checks if plan has unlimited credits
   * Requirements: Billing 1.2
   */
  hasUnlimitedCredits(): boolean {
    return this.props.creditCount === null;
  }

  /**
   * Checks if plan is available for new subscriptions
   * Requirements: Billing 1.4
   */
  isAvailableForSubscription(): boolean {
    return this.props.isActive;
  }

  /**
   * Gets the monthly equivalent price for comparison
   * Requirements: Billing 1.5
   */
  getMonthlyEquivalentPrice(): number {
    if (this.props.interval === 'YEAR') {
      return Math.round(this.props.price / 12);
    }
    return this.props.price;
  }

  // Getters
  getId(): Id {
    return this.props.id;
  }

  getName(): string {
    return this.props.name;
  }

  getDescription(): string {
    return this.props.description;
  }

  getPrice(): number {
    return this.props.price;
  }

  getCurrency(): string {
    return this.props.currency;
  }

  getInterval(): PlanInterval {
    return this.props.interval;
  }

  getCreditCount(): number | null {
    return this.props.creditCount;
  }

  getFeatures(): PlanFeatures {
    return { ...this.props.features };
  }

  getLimits(): PlanLimits {
    return { ...this.props.limits };
  }

  getStripeProductId(): string {
    return this.props.stripeProductId;
  }

  getStripePriceId(): string {
    return this.props.stripePriceId;
  }

  getIsActive(): boolean {
    return this.props.isActive;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Converts the entity to a plain object for persistence
   */
  toPersistence(): PlanProps {
    return { ...this.props };
  }
}
