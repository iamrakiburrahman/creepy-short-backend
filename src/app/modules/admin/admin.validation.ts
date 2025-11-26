import { z } from 'zod';

const createAdminZodSchema = z.object({
     body: z.object({
          name: z.string({ required_error: 'Name is required' }),
          email: z.string({ required_error: 'Email is required' }),
          phone: z.string({ required_error: 'Phone is required' }),
          password: z.string({ required_error: 'Password is required' }),

     }),
});

export const AdminValidation = {
     createAdminZodSchema,
};
