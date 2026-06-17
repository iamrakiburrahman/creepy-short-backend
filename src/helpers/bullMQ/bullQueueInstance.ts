import { Queue } from 'bullmq';
import { redisConnection } from '../../DB/bullMQ';
import { CleanupJobData, EmailJobData, NotificationJobData, SMSJobData } from './bullInterface';

export const emailQueue = new Queue<EmailJobData>('email-queue', {
     connection: redisConnection,
     defaultJobOptions: {
          attempts: 3,
          backoff: {
               type: 'exponential',
               delay: 2000,
          },
          removeOnComplete: {
               count: 100,
               age: 24 * 3600,
          },
          removeOnFail: {
               count: 500,
          },
     },
});

export const notificationQueue = new Queue<NotificationJobData>('notification-queue', {
     connection: redisConnection,
     defaultJobOptions: {
          attempts: 2,
          backoff: {
               type: 'fixed',
               delay: 5000,
          },
          removeOnComplete: {
               count: 50,
               age: 12 * 3600,
          },
     },
});

export const smsQueue = new Queue<SMSJobData>('sms-queue', {
     connection: redisConnection,
     defaultJobOptions: {
          attempts: 3,
          backoff: {
               type: 'exponential',
               delay: 3000,
          },
          removeOnComplete: {
               count: 100,
               age: 24 * 3600,
          },
     },
});

export const cleanupQueue = new Queue<CleanupJobData>('cleanup-queue', {
     connection: redisConnection,
     defaultJobOptions: {
          attempts: 1,
          removeOnComplete: true,
     },
});
