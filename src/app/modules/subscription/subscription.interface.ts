import { Model, Types } from 'mongoose';

export type ISubscription = {
     customerId: string;
     price: number;
     userId: Types.ObjectId;
     package: Types.ObjectId;
     packageName?: string;
     trxId: string;
     remaining: number;
     name: string;
     subscriptionId: string;
     status: 'expired' | 'active' | 'cancel' | 'trialing' | 'past_due' | 'unpaid' | 'incomplete';
     currentPeriodStart: string;
     currentPeriodEnd: string;
     cancelAtPeriodEnd?: boolean;
     provider: 'google' | 'apple';
     iapProductId: string;
     iapReceipt: string;
};

export type SubscriptionModel = Model<ISubscription, Record<string, unknown>>;
