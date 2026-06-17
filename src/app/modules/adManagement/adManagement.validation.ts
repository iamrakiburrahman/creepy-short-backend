import { z } from 'zod';

export const TrailerValidations = {
     create: z.object({
          title: z.string(),
          duration: z.string(),
          color: z.string(),
          contentName: z.string(),
          description: z.string(),
          videoUrl: z.string(),
          videoId: z.string(),
          libraryId: z.string(),
          thumbnailUrl: z.string(),
          status: z.string(),
          views: z.number(),
     }),

     update: z.object({
          title: z.string().optional(),
          duration: z.string().optional(),
          color: z.string().optional(),
          contentName: z.string().optional(),
          description: z.string().optional(),
          videoUrl: z.string().optional(),
          videoId: z.string().optional(),
          libraryId: z.string().optional(),
          thumbnailUrl: z.string().optional(),
          status: z.string().optional(),
          views: z.number().optional(),
     }),
};
