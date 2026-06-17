import colors from 'colors';
import { Server, Socket } from 'socket.io';
import { logger } from '../shared/logger';
import config from '../config';
import { jwtHelper } from './jwtHelper';
import { User } from '../app/modules/user/user.model';
import { SOCKET_EVENTS } from '../enums/soket_event';

interface SocketWithUser extends Socket {
     userId?: string;
     userName?: string;
}
const activeConnections = new Map<string, string>(); // userId -> socketId

const socket = (io: Server) => {
     io.on('connection', (socket: SocketWithUser) => {
          logger.info(colors.blue('A user connected'));

          // ✅ Step 1: Authentication
          socket.on(SOCKET_EVENTS.AUTHENTICATE, async (token: string) => {
               try {
                    const decoded = (await jwtHelper.verifyToken(
                         token,
                         config.jwt.jwt_secret as string,
                    )) as any;
                    socket.userId = decoded.userId;

                    // Store connection
                    activeConnections.set(decoded.userId, socket.id);

                    // Set user online
                    await User.setUserOnline(decoded.userId);

                    // Broadcast to all users that this user is online
                    socket.broadcast.emit('user_online', {
                         userId: decoded.userId,
                         isOnline: true,
                         lastSeen: new Date(),
                    });

                    socket.emit(SOCKET_EVENTS.AUTHENTICATED, { success: true });
                    console.log(`User ${decoded.userId} authenticated and set online`);
               } catch (error) {
                    socket.emit(SOCKET_EVENTS.AUTHENTICATION_ERROR, { message: 'Invalid token' });
               }
          });
          // ✅ Step 2: Heartbeat system
          socket.on(SOCKET_EVENTS.HEARTBEAT, async () => {
               if (socket.userId) {
                    await User.updateHeartbeat(socket.userId);
               }
          });

          // ✅ Step 3: Get online users
          socket.on(SOCKET_EVENTS.GET_ONLINE_USERS, async () => {
               try {
                    const onlineUsers = await User.getOnlineUsers();
                    socket.emit('online_users_list', onlineUsers);
               } catch (error) {
                    socket.emit('error', { message: 'Failed to fetch online users' });
               }
          });
          // ✅ Step 4: Get bulk user status
          socket.on(SOCKET_EVENTS.GET_USERS_STATUS, async (userIds: string[]) => {
               try {
                    const usersWithStatus = await User.bulkUserStatus(userIds);
                    socket.emit('users_status', usersWithStatus);
               } catch (error) {
                    socket.emit('error', { message: 'Failed to fetch users status' });
               }
          });
          // // Typing indicators
          // socket.on(SOCKET_EVENTS.TYPING_START, (data: { chatId: string }) => {
          //      const { chatId } = data;

          //      if (!typingUsers.has(chatId)) {
          //           typingUsers.set(chatId, new Set());
          //      }

          //      typingUsers.get(chatId)?.add(socket.userId!);

          //      socket.to(chatId).emit(SOCKET_EVENTS.USER_TYPING, {
          //           userId: socket.userId,
          //           userName: socket.userName,
          //           chatId,
          //      });
          // });

          // socket.on(SOCKET_EVENTS.TYPING_STOP, (data: { chatId: string }) => {
          //      const { chatId } = data;

          //      typingUsers.get(chatId)?.delete(socket.userId!);

          //      socket.to(chatId).emit(SOCKET_EVENTS.USER_STOPPED_TYPING, {
          //           userId: socket.userId,
          //           userName: socket.userName,
          //           chatId,
          //      });
          // });
          // // Join chat rooms
          // socket.on('join_chat', (chatId: string) => {
          //      socket.join(chatId);
          //      console.log(`User ${socket.userId} joined chat ${chatId}`);
          // });

          // socket.on('leave_chat', (chatId: string) => {
          //      socket.leave(chatId);
          //      // Clean up typing indicators
          //      typingUsers.get(chatId)?.delete(socket.userId!);
          // });

          // ✅ Step 5: Handle disconnect
          socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
               if (socket.userId) {
                    // Remove from active connections
                    activeConnections.delete(socket.userId);

                    // Set user offline
                    await User.setUserOffline(socket.userId);

                    // Broadcast to all users that this user is offline
                    socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, {
                         userId: socket.userId,
                         isOnline: false,
                         lastSeen: new Date(),
                    });

                    logger.info(colors.blue(`User ${socket.userId} disconnected and set offline`));
               }
          });
     });
};

export const socketHelper = { socket };
