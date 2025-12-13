import { model, Schema } from 'mongoose';
import { IPackage, PackageModel } from './package.interface';

const packageSchema = new Schema<IPackage, PackageModel>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      enum: ['1 month', '3 months', '6 months', '1 year'],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ['Monthly', 'Yearly'],
      required: true,
    },
    // Google Play Store Product ID (SKU)
    googleProductId: {
      type: String,
      required: false,
    },
    appleProductId: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add a validation to ensure at least one Store ID is provided
packageSchema.pre('save', function (next) {
  if (!this.googleProductId && !this.appleProductId) {
    next(new Error('Package must have either a Google Product ID or an Apple Product ID'));
  } else {
    next();
  }
});

export const Package = model<IPackage, PackageModel>('Package', packageSchema);