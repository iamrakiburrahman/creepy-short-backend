import mongoose, { Schema } from 'mongoose';
import { IChat } from './chat.interface';

const chatSchema = new Schema<IChat>(
     {
          participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
          lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
          status: { type: String, enum: ['active', 'deleted'], default: 'active' },
          isDeleted: { type: Boolean, default: false },
          deletedByDetails: [
               {
                    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                    deletedAt: { type: Date, default: Date.now },
               },
          ],

          lastMessageAt: Date,
          readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
          // New fields
          mutedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
          blockedUsers: [
               {
                    blocker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                    blocked: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                    blockedAt: { type: Date, default: Date.now },
               },
          ],
          userPinnedMessages: [
               {
                    userId: {
                         type: Schema.Types.ObjectId,
                         ref: 'User',
                         required: true,
                    },
                    pinnedMessages: [
                         {
                              type: Schema.Types.ObjectId,
                              ref: 'Message',
                         },
                    ],
               },
          ],
     },
     {
          timestamps: true,
     },
);

export const Chat = mongoose.model<IChat>('Chat', chatSchema);
