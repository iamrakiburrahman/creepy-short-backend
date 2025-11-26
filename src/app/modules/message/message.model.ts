import { Schema, Types, model } from 'mongoose';
import { IMessage, MessageModel } from './message.interface';

const messageSchema = new Schema<IMessage, MessageModel>(
     {
          chatId: {
               type: Schema.Types.ObjectId,
               required: true,
               ref: 'Chat',
          },
          sender: {
               type: Schema.Types.ObjectId,
               required: true,
               ref: 'User',
          },
          text: {
               type: String,
          },
          images: {
               type: [String],
               default: [],
          },
          read: {
               type: Boolean,
               default: false,
          },
          type: {
               type: String,
               enum: ['text', 'image', 'doc', 'both'],
               default: 'text',
          },
          isDeleted: {
               type: Boolean,
               default: false,
               required: true,
          },
          // Pinned message fields
          isPinned: {
               type: Boolean,
               default: false,
          },
          pinnedBy: {
               type: Schema.Types.ObjectId,
               ref: 'User',
          },
          pinnedAt: {
               type: Date,
          },
          pinnedByUsers: [
               {
                    userId: {
                         type: Schema.Types.ObjectId,
                         ref: 'User',
                         required: true,
                    },
                    pinnedAt: {
                         type: Date,
                         default: Date.now,
                    },
               },
          ],
          // NEW: Track which users have deleted this message from their view
          deletedForUsers: [
               {
                    userId: {
                         type: Schema.Types.ObjectId,
                         ref: 'User',
                         required: true,
                    },
                    deletedAt: {
                         type: Date,
                         default: Date.now,
                    },
               },
          ],
          // Reply functionality fields
          replyTo: {
               type: Schema.Types.ObjectId,
               ref: 'Message',
               default: null,
          },
          replyText: {
               type: String, // Store the original text of the message being replied to
          },
          replySender: {
               type: Schema.Types.ObjectId,
               ref: 'User', // Store the sender of the original message
          },
          replyType: {
               type: String,
               enum: ['text', 'image', 'doc', 'both'],
               // Store the type of the original message
          },
          iconViewed: {
               type: [
                    {
                         type: Types.ObjectId,
                         ref: 'User',
                    },
               ],
               default: [],
          },
          reactions: [
               {
                    userId: {
                         type: Schema.Types.ObjectId,
                         required: true,
                         ref: 'User',
                    },
                    reactionType: {
                         type: String,
                         enum: ['like', 'love', 'thumbs_up', 'laugh', 'angry', 'sad'],
                         required: true,
                    },
                    timestamp: {
                         type: Date,
                         default: Date.now,
                    },
               },
          ],
     },
     {
          timestamps: true,
     },
);

// Index for better query performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ replyTo: 1 });

export const Message = model<IMessage, MessageModel>('Message', messageSchema);
