import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { UserEntity } from '../../../users/infrastructure/persistence/relational/entities/user.entity';
import { PaymentMethodEntity } from '../entities';

@Injectable()
export class StripeCustomerService {
  private readonly logger = new Logger(StripeCustomerService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(PaymentMethodEntity)
    private paymentMethodRepository: Repository<PaymentMethodEntity>,
  ) {}

  /**
   * Create or retrieve Stripe customer for user
   */
  async createCustomerForUser(stripe: Stripe, user: UserEntity, name?: string): Promise<string> {
    // Return existing customer ID if already exists
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    try {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: name || user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
        metadata: {
          userId: user.id.toString(),
        },
      });

      // Update user with Stripe customer ID
      await this.userRepository.update(user.id, {
        stripeCustomerId: customer.id,
      });

      this.logger.log(`Created Stripe customer for user ${user.id}`, {
        customerId: customer.id,
        userEmail: user.email,
      });

      return customer.id;
    } catch (error) {
      this.logger.error(`Failed to create Stripe customer for user ${user.id}`, error);
      throw error;
    }
  }

  /**
   * Create Stripe customer using basic user data (for domain objects)
   */
  async createCustomerForUserData(stripe: Stripe, userData: {
    id: number | string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  }, name?: string): Promise<string> {
    try {
      // Check if user already has a Stripe customer
      const existingUser = await this.userRepository.findOne({
        where: { id: userData.id.toString() },
      });

      if (existingUser?.stripeCustomerId) {
        return existingUser.stripeCustomerId;
      }

      const customer = await stripe.customers.create({
        email: userData.email || undefined,
        name: name || userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : undefined,
        metadata: {
          userId: userData.id.toString(),
        },
      });

      // Update user with Stripe customer ID
      await this.userRepository.update(userData.id.toString(), {
        stripeCustomerId: customer.id,
      });

      this.logger.log(`Created Stripe customer for user ${userData.id}`, {
        customerId: customer.id,
        userEmail: userData.email,
      });

      return customer.id;
    } catch (error) {
      this.logger.error(`Failed to create Stripe customer for user ${userData.id}`, error);
      throw error;
    }
  }

  /**
   * Save payment method to database
   */
  async savePaymentMethod(
    userId: string,
    stripePaymentMethodId: string,
    type: string,
    last4?: string,
    brand?: string,
    expMonth?: number,
    expYear?: number,
  ): Promise<PaymentMethodEntity> {
    try {
      const paymentMethod = this.paymentMethodRepository.create({
        userId,
        stripePaymentMethodId,
        type,
        last4,
        brand,
        expMonth,
        expYear,
        isDefault: false,
      });

      const savedPaymentMethod = await this.paymentMethodRepository.save(paymentMethod);

      this.logger.log(`Payment method saved for user ${userId}`, {
        paymentMethodId: savedPaymentMethod.id,
        stripePaymentMethodId,
        type,
        last4,
      });

      return savedPaymentMethod;
    } catch (error) {
      this.logger.error(`Failed to save payment method for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Mark a payment method as default for a user (DB) and optionally update Stripe customer invoice settings
   */
  async setDefaultPaymentMethod(
    userId: string,
    stripePaymentMethodId: string,
    stripe?: Stripe,
    customerId?: string,
  ): Promise<PaymentMethodEntity> {
    try {
      // Run DB changes in a transaction: unset previous default(s) and set the provided one
      const result = await this.paymentMethodRepository.manager.transaction(async (manager) => {
        const repo = manager.getRepository(PaymentMethodEntity);

        // Unset any existing default payment methods for this user
        await repo.update({ userId, isDefault: true }, { isDefault: false });

        // Find the payment method by stripe id
        let pm: PaymentMethodEntity | null = await repo.findOne({ where: { stripePaymentMethodId } });

        if (!pm) {
          // If it doesn't exist yet (edge case), insert and then re-query
          const toInsert: Partial<PaymentMethodEntity> = {
            userId,
            stripePaymentMethodId,
            isDefault: true,
          };
          await repo.insert(toInsert as any);
          pm = await repo.findOne({ where: { stripePaymentMethodId } });
          if (!pm) {
            throw new Error('Failed to create payment method record');
          }
        } else {
          pm.isDefault = true;
          pm = await repo.save(pm as any);
        }

        return pm as PaymentMethodEntity;
      });

      // If Stripe client and customerId provided, update invoice settings on Stripe side
      if (stripe && customerId) {
        try {
          await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: stripePaymentMethodId },
          });
          this.logger.log(`Stripe customer ${customerId} default payment method set to ${stripePaymentMethodId}`);
        } catch (err) {
          // Log but don't fail the overall operation — DB change already applied
          this.logger.error(
            `Failed to update Stripe customer ${customerId} default payment method to ${stripePaymentMethodId}`,
            err,
          );
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to set default payment method for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Delete a payment method for a user if it's not the default.
   * Will attempt to detach from Stripe (if client and customerId provided) and remove DB record.
   */
  async deletePaymentMethod(
    userId: string,
    stripePaymentMethodId: string,
    stripe?: Stripe,
    customerId?: string,
  ): Promise<void> {
    try {
      const repo = this.paymentMethodRepository;

      const pm = await repo.findOne({ where: { userId, stripePaymentMethodId } });
      if (!pm) {
        throw new Error('Payment method not found');
      }

      if (pm.isDefault) {
        throw new Error('Cannot delete default payment method');
      }

      // Attempt to detach from Stripe if possible
      if (stripe) {
        try {
          // Detach the PaymentMethod from customer
          await stripe.paymentMethods.detach(stripePaymentMethodId);
        } catch (err) {
          // Log but don't block deletion — detachment failing shouldn't leave DB inconsistent
          this.logger.error(`Failed to detach payment method ${stripePaymentMethodId} from Stripe`, err);
        }
      }

      await repo.delete({ id: pm.id });
      this.logger.log(`Deleted payment method ${stripePaymentMethodId} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete payment method ${stripePaymentMethodId} for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get user's payment methods
   */
  async getUserPaymentMethods(userId: string): Promise<PaymentMethodEntity[]> {
    try {
      return await this.paymentMethodRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to get payment methods for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(userId: string) {
    return await this.userRepository.findOne({ where: { id: userId } });
  }

  /**
   * Get user by Stripe customer id
   */
  public async getUserByStripeCustomerId(customerId: string) {
    return await this.userRepository.findOne({ where: { stripeCustomerId: customerId } });
  }
}