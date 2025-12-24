import { Types } from 'mongoose';

export interface IReminder {
     userId: Types.ObjectId;
     image: string;
     name: string;
     description?: string;
     reminderTime: Date;
}
