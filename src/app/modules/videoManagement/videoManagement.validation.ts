import { z } from 'zod';

const watchTimePayloadSchema = z.object({
     body: z.object({
          watchedSeconds: z.number().min(1, 'Watched seconds must be greater than 0'),
     }),
});

export const VideoManagementValidation = {
     watchTimePayloadSchema,
};
