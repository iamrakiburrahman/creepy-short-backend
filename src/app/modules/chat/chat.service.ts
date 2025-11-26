import { Chat } from './chat.model';
import { Message } from '../message/message.model';
import mongoose from 'mongoose';
import { User } from '../user/user.model';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';

const createChatIntoDB = async (participants: string[]) => {
     const isExistChat = await Chat.findOne({
          participants: { $all: participants },
     });

     if (isExistChat) {
          return isExistChat;
     }
     const newChat = await Chat.create({
          participants: participants,
          lastMessage: null,
     });
     if (!newChat) {
          throw new Error('Failed to create chat');
     }

     //@ts-ignore
     const io = global.io;
     newChat.participants.forEach((participant) => {
          //@ts-ignore
          io.emit(`newChat::${participant._id}`, newChat);
     });
     return newChat;
};

const markChatAsRead = async (userId: string, chatId: string) => {
     return Chat.findByIdAndUpdate(chatId, { $addToSet: { readBy: userId } }, { new: true });
};

const markMessagesAsIconViewed = async (userId: string) => {
     await Message.updateMany(
          {
               sender: { $ne: userId },
               read: false,
               isDeleted: false,
               iconViewed: { $not: { $elemMatch: { $eq: userId } } }, // userId array তে নেই
          },
          {
               $addToSet: { iconViewed: userId },
          },
     );
};

// Define proper types first
interface ProcessedChat {
     _id: any;
     participants: any[];
     isRead: boolean;
     unreadCount: number;
     iconUnreadCount: number;
     isMuted: boolean;
     isBlocked: boolean;
     wasDeletedByUser: boolean;
     deletedAt: Date | null;
     lastMessage?: any;
     mutedBy?: any[];
     blockedUsers?: any[];
     deletedByDetails?: any[];
     [key: string]: any; // For other chat properties
}

// Updated getAllChatsFromDB function
const getAllChatsFromDB = async (
     userId: string,
     query: Record<string, any>,
): Promise<{
     data: ProcessedChat[];
     unreadChatsCount: number;
     totalUnreadMessages: number;
     totalIconUnreadMessages: number;
     meta: {
          limit: number;
          page: number;
          total: number;
          totalPage: number;
     };
}> => {
     const searchTerm = query.searchTerm?.toLowerCase();
     const page = parseInt(query.page) || 1;
     const limit = parseInt(query.limit) || 10;
     const skip = (page - 1) * limit;

     // Base chat query - get all chats user participates in that aren't globally deleted
     const baseChatQuery = {
          participants: { $in: [userId] },
          isDeleted: { $ne: true },
     };

     let chats: ProcessedChat[] = [];
     let totalChats: number = 0;

     // Helper function to process individual chat
     const processChatForUser = async (chat: any): Promise<ProcessedChat | null> => {
          const otherParticipantIds = chat.participants.filter((participantId: mongoose.Types.ObjectId) => participantId.toString() !== userId);

          const otherParticipants = await User.find({
               _id: { $in: otherParticipantIds },
          })
               .select('_id firstName lastName email image')
               .lean();

          // Check if user deleted this chat and get deletion time
          const userDeletionDetail = chat.deletedByDetails?.find((detail: { userId: mongoose.Types.ObjectId | string }) => detail.userId.toString() === userId);

          // Build message query based on user-specific deletion
          let messageQuery: any = {
               'chatId': chat._id,
               'sender': { $ne: userId },
               'read': false,
               'isDeleted': false,
               'deletedForUsers.userId': { $ne: new mongoose.Types.ObjectId(userId) }, // User-specific deletion check
          };

          // REMOVE this part since we're using deletedForUsers:
          // if (userDeletionDetail) {
          //     messageQuery.createdAt = { $gt: userDeletionDetail.deletedAt };
          // }

          // Regular unread count - for individual chat
          const unreadCount = await Message.countDocuments(messageQuery);

          // Check if this chat should appear in the list
          // If user deleted the chat, check if there are any messages visible to them
          if (userDeletionDetail) {
               const visibleMessagesCount = await Message.countDocuments({
                    'chatId': chat._id,
                    'isDeleted': false,
                    'deletedForUsers.userId': { $ne: new mongoose.Types.ObjectId(userId) },
               });

               // If no visible messages exist, don't show this chat
               if (visibleMessagesCount === 0) {
                    return null;
               }

               // Update lastMessage to show the most recent visible message
               const recentVisibleMessage = await Message.findOne({
                    'chatId': chat._id,
                    'isDeleted': false,
                    'deletedForUsers.userId': { $ne: new mongoose.Types.ObjectId(userId) },
               })
                    .populate('sender', 'firstName lastName email image')

                    .sort({ createdAt: -1 });

               if (recentVisibleMessage) {
                    chat.lastMessage = recentVisibleMessage;
               }
          }

          const isMuted = chat.mutedBy?.some((id: any) => id.toString() === userId) || false;
          const isBlocked = chat.blockedUsers?.some((block: any) => block.blocker.toString() === userId || block.blocked.toString() === userId) || false;

          // Icon-level unread count - only count if chat is not muted
          const iconUnreadCount = isMuted
               ? 0
               : await Message.countDocuments({
                      ...messageQuery,
                      iconViewed: { $ne: userId },
                 });

          return {
               ...chat,
               participants: otherParticipants,
               isRead: unreadCount === 0,
               unreadCount,
               iconUnreadCount,
               isMuted,
               isBlocked,
               // Add deletion info for debugging
               wasDeletedByUser: !!userDeletionDetail,
               deletedAt: userDeletionDetail?.deletedAt || null,
          };
     };

     if (searchTerm) {
          const allChats = await Chat.find(baseChatQuery).populate('lastMessage').lean().sort({ updatedAt: -1 });

          const allChatLists: (ProcessedChat | null)[] = await Promise.all(allChats.map(processChatForUser));

          // Filter out null values (deleted chats with no visible messages)
          const validChats = allChatLists.filter((chat): chat is ProcessedChat => chat !== null);

          const filteredChats = validChats.filter((chat) => {
               return chat.participants.some((participant) => participant.name.toLowerCase().includes(searchTerm));
          });

          totalChats = filteredChats.length;
          chats = filteredChats.slice(skip, skip + limit);
     } else {
          // For non-search queries, we need to filter after processing to get correct counts
          const allChats = await Chat.find(baseChatQuery).populate('lastMessage').lean().sort({ updatedAt: -1 });

          const processedChats = await Promise.all(allChats.map(processChatForUser));

          // Filter out null values and apply pagination
          const validChats = processedChats.filter((chat): chat is ProcessedChat => chat !== null);
          totalChats = validChats.length;
          chats = validChats.slice(skip, skip + limit);
     }

     // Calculate totals for icon display - this now automatically excludes muted chats
     const totalIconUnreadMessages = chats.reduce((total, chat) => total + chat.iconUnreadCount, 0);

     // Regular unread counts (for individual chats)
     const unreadChatsCount = chats.filter((chat) => chat.unreadCount > 0).length;
     const totalUnreadMessages = chats.reduce((total, chat) => total + chat.unreadCount, 0);

     const totalPage = Math.ceil(totalChats / limit);

     return {
          data: chats,
          unreadChatsCount,
          totalUnreadMessages,
          totalIconUnreadMessages,
          meta: {
               limit,
               page,
               total: totalChats,
               totalPage,
          },
     };
};

// Updated soft delete function
const softDeleteChatForUser = async (chatId: string, id: string) => {
     const userId = new mongoose.Types.ObjectId(id);
     const chat = await Chat.findById(chatId);

     if (!chat) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Chat not found');
     }

     if (!chat.participants.some((id) => id.toString() === userId.toString())) {
          throw new AppError(StatusCodes.UNAUTHORIZED, 'User is not authorized');
     }

     const alreadyDeleted = chat.deletedByDetails.some((detail) => detail.userId.toString() === userId.toString());

     if (alreadyDeleted) {
          return {
               success: true,
               message: 'Chat already deleted for this user',
               chat,
          };
     }

     const deletionTime = new Date();

     // Add detailed deletion info to chat
     chat.deletedByDetails.push({
          userId: userId,
          deletedAt: deletionTime,
     });

     // NEW: Mark all existing messages as deleted for this user
     await Message.updateMany(
          {
               'chatId': chatId,
               'createdAt': { $lte: deletionTime }, // Only messages created before deletion
               'deletedForUsers.userId': { $ne: userId }, // Don't duplicate if already marked
          },
          {
               $push: {
                    deletedForUsers: {
                         userId: userId,
                         deletedAt: deletionTime,
                    },
               },
          },
     );

     const allParticipantsDeleted = chat.participants.every((participantId) => chat.deletedByDetails.some((detail) => detail.userId.toString() === participantId.toString()));

     if (allParticipantsDeleted) {
          chat.isDeleted = true;
          chat.status = 'deleted';
     }

     await chat.save();

     // Socket events
     //@ts-ignore
     const io = global.io;

     io.emit(`notification::${userId}`, {
          chatId,
          deletedBy: userId,
          deletedAt: deletionTime,
          isGloballyDeleted: allParticipantsDeleted,
     });

     chat.participants.forEach((participantId) => {
          if (participantId.toString() !== userId.toString()) {
               io.emit(`chatListUpdate::${participantId}`, {
                    chatId,
                    updatedBy: userId,
                    type: 'user_deleted_chat',
               });
          }
     });

     if (allParticipantsDeleted) {
          chat.participants.forEach((participantId) => {
               io.emit(`chatGloballyDeleted::${participantId}`, {
                    chatId,
                    deletedAt: deletionTime,
               });
          });
     }

     return {
          success: true,
          message: 'Chat deleted successfully',
          chat,
          isGloballyDeleted: allParticipantsDeleted,
     };
};
// New feature: Mute/Unmute chat
const muteUnmuteChat = async (userId: string, chatId: string, action: 'mute' | 'unmute') => {
     const chat = await Chat.findById(chatId);
     if (!chat) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Chat not found');
     }

     if (!chat.participants.some((id) => id.toString() === userId)) {
          throw new AppError(StatusCodes.UNAUTHORIZED, 'User is not authorized');
     }

     if (action === 'mute') {
          // Add user to mutedBy array if not already muted
          await Chat.findByIdAndUpdate(chatId, { $addToSet: { mutedBy: userId } }, { new: true });
     } else {
          // Remove user from mutedBy array
          await Chat.findByIdAndUpdate(chatId, { $pull: { mutedBy: userId } }, { new: true });
     }

     const updatedChat = await Chat.findById(chatId);

     //@ts-ignore
     const io = global.io;
     //@ts-ignore
     io.emit(`chatMuteStatus::${userId}`, {
          chatId,
          isMuted: action === 'mute',
          action,
     });

     return updatedChat;
};

// New feature: Block/Unblock user in chat
const blockUnblockUser = async (blockerId: string, blockedId: string, chatId: string, action: 'block' | 'unblock') => {
     const chat = await Chat.findById(chatId);
     if (!chat) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Chat not found');
     }

     // Check if both users are participants
     const participants = chat.participants.map((p) => p.toString());
     if (!participants.includes(blockerId) || !participants.includes(blockedId)) {
          throw new AppError(StatusCodes.UNAUTHORIZED, 'One or both users are not participants in this chat');
     }

     if (action === 'block') {
          // Check if already blocked
          const existingBlock = chat.blockedUsers?.find((block: any) => block.blocker.toString() === blockerId && block.blocked.toString() === blockedId);

          if (existingBlock) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'User is already blocked');
          }

          // Add to blocked users
          await Chat.findByIdAndUpdate(
               chatId,
               {
                    $push: {
                         blockedUsers: {
                              blocker: blockerId,
                              blocked: blockedId,
                              blockedAt: new Date(),
                         },
                    },
               },
               { new: true },
          );
     } else {
          // Remove from blocked users
          await Chat.findByIdAndUpdate(
               chatId,
               {
                    $pull: {
                         blockedUsers: {
                              blocker: blockerId,
                              blocked: blockedId,
                         },
                    },
               },
               { new: true },
          );
     }

     const updatedChat = await Chat.findById(chatId);

     //@ts-ignore
     const io = global.io;
     // Notify both users
     [blockerId, blockedId].forEach((userId) => {
          //@ts-ignore
          io.emit(`userBlockStatus::${userId}`, {
               chatId,
               blockerId,
               blockedId,
               isBlocked: action === 'block',
               action,
          });
     });

     return updatedChat;
};

export const ChatService = {
     createChatIntoDB,
     getAllChatsFromDB,
     markChatAsRead,
     softDeleteChatForUser,
     muteUnmuteChat,
     blockUnblockUser,
     markMessagesAsIconViewed,
};
