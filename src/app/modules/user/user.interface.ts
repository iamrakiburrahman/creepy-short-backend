import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';
export type IUser = {
     name: string;
     role: USER_ROLES;
     email: string;
     phone: string;
     password?: string;
     image?: string;
     isDeleted: boolean;
     stripeCustomerId: string;
     status: 'active' | 'blocked';
     verified: boolean;
     googleId?: string;
     facebookId?: string;
     oauthProvider?: 'google' | 'facebook';
     pageAccess?: {
          name: string;
          access: boolean;
     }[];
     authentication?: {
          isResetPassword: boolean;
          oneTimeCode: number;
          expireAt: Date;
     };
     // ✅ Online Status Interface
     onlineStatus?: {
          isOnline?: boolean;
          lastSeen?: Date;
          lastHeartbeat?: Date;
     };
};

export type UserModel = {
     isExistUserById(id: string): any;
     isExistUserByEmail(email: string): any;
     isExistUserByPhone(contact: string): any;
     isMatchPassword(password: string, hashPassword: string): boolean;
     // ✅ Online Status Methods
     setUserOnline(userId: string): Promise<void>;
     setUserOffline(userId: string): Promise<void>;
     updateHeartbeat(userId: string): Promise<void>;
     getOnlineUsers(): Promise<IUser[]>;
     bulkUserStatus(userIds: string[]): Promise<IUser[]>;
} & Model<IUser>;
