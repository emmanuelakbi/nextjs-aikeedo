import { Plan } from '../entities/Plan';
import { Id } from '../../user/value-objects/Id';
import { PlanInterval } from '../types';

/**
 * IPlanRepository - Domain interface for Plan persistence
 * 
 * Defines the contract for Plan data access operations.
 * Requirements: Billing 1.1, 1.2, 1.3, 1.4, 1.5
 */

export interface CreatePlanData {
  name: string;
  description: string;
  price: number;
  currency?: string;
  interval: PlanInterval;
  creditCount: number | null;
  features?: Record<string, any>;
  limits?: Record<string, any>;
  stripeProductId: string;
  stripePriceId: string;
}

export interface UpdatePlanData {
  name?: string;
  description?: string;
  price?: number;
  creditCount?: number | null;
  features?: Record<string, any>;
  limits?: Record<string, any>;
  isActive?: boolean;
}

export interface ListPlansOptions {
  isActive?: boolean;
  interval?: PlanInterval;
  limit?: number;
  offset?: number;
}

export interface IPlanRepository {
  /**
   * Saves a Plan entity (create or update)
   * @param plan - The Plan entity to save
   * @returns The saved Plan entity
   */
  save(plan: Plan): Promise<Plan>;

  /**
   * Finds a plan by ID
   * @param id - The plan ID
   * @returns The Plan entity or null if not found
   */
  findById(id: string): Promise<Plan | null>;

  /**
   * Finds a plan by Stripe product ID
   * @param stripeProductId - The Stripe product ID
   * @returns The Plan entity or null if not found
   */
  findByStripeProductId(stripeProductId: string): Promise<Plan | null>;

  /**
   * Finds a plan by Stripe price ID
   * @param stripePriceId - The Stripe price ID
   * @returns The Plan entity or null if not found
   */
  findByStripePriceId(stripePriceId: string): Promise<Plan | null>;

  /**
   * Lists plans with optional filters
   * @param options - Filter and pagination options
   * @returns Array of Plan entities
   */
  list(options?: ListPlansOptions): Promise<Plan[]>;

  /**
   * Finds all active plans
   * @returns Array of active Plan entities
   */
  findActivePlans(): Promise<Plan[]>;

  /**
   * Finds active plans by interval
   * @param interval - The billing interval
   * @returns Array of active Plan entities for the interval
   */
  findActivePlansByInterval(interval: PlanInterval): Promise<Plan[]>;

  /**
   * Creates a new plan
   * @param data - Plan creation data
   * @returns The created Plan entity
   */
  create(data: CreatePlanData): Promise<Plan>;

  /**
   * Updates a plan
   * @param id - The plan ID
   * @param data - Plan update data
   * @returns The updated Plan entity
   */
  update(id: string, data: UpdatePlanData): Promise<Plan>;

  /**
   * Deprecates a plan (sets isActive to false)
   * @param id - The plan ID
   * @returns The deprecated Plan entity
   */
  deprecate(id: string): Promise<Plan>;

  /**
   * Activates a plan (sets isActive to true)
   * @param id - The plan ID
   * @returns The activated Plan entity
   */
  activate(id: string): Promise<Plan>;

  /**
   * Deletes a plan
   * Note: Should only be used if there are no subscriptions
   * @param id - The plan ID
   */
  delete(id: string): Promise<void>;
}
