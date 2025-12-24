import mongoose from 'mongoose';
import { IReminder } from './reminder.interface';

const ReminderSchema = new mongoose.Schema<IReminder>({
     userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
     },
     thumbnail: {
          type: String,
          required: true,
     },
     name: {
          type: String,
          required: true,
     },
     description: {
          type: String,
     },
     reminderTime: {
          type: Date,
          required: true,
     },
     status: {
          type: String,
          enum: ['active', 'inactive'],
          default: 'active',
     },
});

export const ReminderModel = mongoose.model<IReminder>('Reminder', ReminderSchema);
