import { Types } from 'mongoose';

export interface IReminder {
     userId: Types.ObjectId;
     thumbnail: string;
     name: string;
     description?: string;
     reminderTime: Date;
     status?: 'active' | 'inactive';
}
