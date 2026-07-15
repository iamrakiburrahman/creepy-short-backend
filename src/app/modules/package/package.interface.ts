import { Model } from 'mongoose';

export interface IPackage {
     name: string;
     description: string;
     price: number;
     originalPrice: number;
     discount: number;
     duration: '1 week' | '1 month' | '3 months' | '6 months' | '1 year' | '1 week';
     paymentType: 'Monthly' | 'Yearly' | 'Weekly';
     googleProductId?: string; // ID from Google Play Console
     appleProductId?: string; // ID from App Store Connect
     isGoogle?: boolean;
     provider?: 'google' | 'apple';
     status: 'active' | 'inactive';
     isDeleted: boolean;
     deletedAt?: Date;
}

export type PackageModel = Model<IPackage>;
