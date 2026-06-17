import { model, Schema } from 'mongoose';
import { ISubscription, SubscriptionModel } from './subscription.interface';

const subscriptionSchema = new Schema<ISubscription, SubscriptionModel>(
     {
          price: {
               type: Number,
               required: true,
          },
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
          },
          name: {
               type: String,
               required: false,
          },
          package: {
               type: Schema.Types.ObjectId,
               ref: 'Package',
               required: function () {
                    // Password is only required for non-OAuth users
                    return !['google', 'apple'].includes(this.provider);
               },
          },
          packageName: {
               type: String,
               required: false,
          },
          trxId: {
               type: String,
               required: false,
               default: '',
          },
          subscriptionId: {
               type: String,
               required: true,
          },
          currentPeriodStart: {
               type: String,
               required: true,
          },
          currentPeriodEnd: {
               type: String,
               required: true,
          },
          remaining: {
               type: Number,
               required: true,
          },
          status: {
               type: String,
               enum: [
                    'expired',
                    'active',
                    'cancel',
                    'deactivated',
                    'trialing',
                    'past_due',
                    'unpaid',
                    'incomplete',
               ],
               default: 'active',
               required: true,
          },

          cancelAtPeriodEnd: {
               type: Boolean,
               default: false,
          },
          provider: {
               type: String,
               enum: ['google', 'apple'],
               required: true,
          },
          iapProductId: {
               type: String, // Stores 'basic_01'
               default: '',
          },
          iapReceipt: {
               type: String, // Stores the purchaseToken/verification string
               select: false, // Optional: Hide from default queries if it's very long
               default: '',
          },
     },
     {
          timestamps: true,
     },
);

export const Subscription = model<ISubscription, SubscriptionModel>(
     'Subscription',
     subscriptionSchema,
);
