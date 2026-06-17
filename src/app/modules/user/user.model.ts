import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import mongoose, { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import AppError from '../../../errors/AppError';
import { IUser, UserModel } from './user.interface';

const userSchema = new Schema<IUser, UserModel>(
     {
          name: {
               type: String,
               required: true,
          },
          role: {
               type: String,
               enum: Object.values(USER_ROLES),
               default: USER_ROLES.USER,
          },
          email: {
               type: String,
               required: true,
               unique: true,
               lowercase: true,
          },
          phone: {
               type: String,
               required: false,
          },
          password: {
               type: String,
               required: function (this: IUser) {
                    return !this.oauthProvider;
               },
               select: false,
               minlength: 8,
          },
          gender: {
               type: String,
               enum: ['male', 'female'],
               default: 'male',
          },
          age: {
               type: Number,
               min: 0,
               max: 120,
               default: 0,
          },
          image: {
               type: String,
               default: '',
          },
          status: {
               type: String,
               enum: ['active', 'blocked'],
               default: 'active',
          },
          verified: {
               type: Boolean,
               default: false,
          },
          isDeleted: {
               type: Boolean,
               default: false,
          },
          stripeCustomerId: {
               type: String,
               default: '',
          },
          // OAuth fields
          googleId: {
               type: String,
               sparse: true,
          },
          facebookId: {
               type: String,
               sparse: true,
          },
          oauthProvider: {
               type: String,
               enum: ['google', 'facebook'],
          },
          totalWatchTime: {
               type: Number,
               default: 0,
          },
          isSubscribed: {
               type: Boolean,
               default: false,
          },
          hasAccess: {
               type: Boolean,
               default: false,
          },
          recentlyViewed: [
               {
                    videoId: {
                         type: mongoose.Schema.Types.ObjectId,
                         ref: 'Videos',
                    },
                    viewedAt: {
                         type: Date,
                         default: Date.now,
                    },
               },
          ],
          pageAccess: {
               type: [
                    {
                         name: {
                              type: String,
                              default: '',
                         },
                         access: {
                              type: Boolean,
                              default: false,
                         },
                    },
               ],
               default: [],
          },
          authentication: {
               type: {
                    isResetPassword: {
                         type: Boolean,
                         default: false,
                    },
                    oneTimeCode: {
                         type: Number,
                         default: null,
                    },
                    expireAt: {
                         type: Date,
                         default: null,
                    },
               },
               select: false,
          },

          subscription: {
               type: Schema.Types.ObjectId,
               ref: 'Subscription',
               default: null,
          },

          onlineStatus: {
               isOnline: {
                    type: Boolean,
                    default: false,
               },
               lastSeen: {
                    type: Date,
                    default: Date.now,
               },
               lastHeartbeat: {
                    type: Date,
                    default: Date.now,
               },
          },
     },
     { timestamps: true },
);

// Exist User Check
userSchema.statics.isExistUserById = async (id: string) => {
     return await User.findById(id);
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
     return await User.findOne({ email });
};
userSchema.statics.isExistUserByPhone = async (contact: string) => {
     return await User.findOne({ contact });
};
// Password Matching
userSchema.statics.isMatchPassword = async (
     password: string,
     hashPassword: string,
): Promise<boolean> => {
     return await bcrypt.compare(password, hashPassword);
};

// Pre-Save Hook for Hashing Password & Checking Email Uniqueness
userSchema.pre('save', async function (next) {
     // Only check email uniqueness if this is a new user or email is being changed
     if (this.isNew || this.isModified('email')) {
          const existingUser = await User.findOne({ email: this.get('email') });
          if (existingUser && existingUser._id.toString() !== this._id.toString()) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Email already exists!');
          }
     }

     // Only hash password if it's provided and modified
     if (this.password && this.isModified('password')) {
          this.password = await bcrypt.hash(this.password, Number(config.bcrypt_salt_rounds));
     }

     // Auto-verify OAuth users
     if (this.oauthProvider && !this.verified) {
          this.verified = true;
     }

     next();
});
// ✅ Online Status Methods
userSchema.statics.setUserOnline = async (userId: string) => {
     await User.findByIdAndUpdate(userId, {
          'onlineStatus.isOnline': true,
          'onlineStatus.lastSeen': new Date(),
          'onlineStatus.lastHeartbeat': new Date(),
     });
};

userSchema.statics.setUserOffline = async (userId: string) => {
     await User.findByIdAndUpdate(userId, {
          'onlineStatus.isOnline': false,
          'onlineStatus.lastSeen': new Date(),
     });
};

userSchema.statics.updateHeartbeat = async (userId: string) => {
     await User.findByIdAndUpdate(userId, {
          'onlineStatus.lastHeartbeat': new Date(),
          'onlineStatus.lastSeen': new Date(),
     });
};

userSchema.statics.getOnlineUsers = async () => {
     return await User.find({ 'onlineStatus.isOnline': true }).select(
          'name userName profile onlineStatus',
     );
};

userSchema.statics.bulkUserStatus = async (userIds: string[]) => {
     return await User.find({ _id: { $in: userIds } }).select('name userName profile onlineStatus');
};
// Query Middleware
userSchema.pre('find', function (next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

userSchema.pre('findOne', function (next) {
     this.find({ isDeleted: { $ne: true } });
     next();
});

userSchema.pre('aggregate', function (next) {
     this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
     next();
});
userSchema.index({ 'onlineStatus.isOnline': 1 });
userSchema.index({ 'onlineStatus.lastHeartbeat': 1 });
export const User = model<IUser, UserModel>('User', userSchema);
