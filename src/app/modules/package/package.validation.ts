import { z } from 'zod';

const createPackageZodSchema = z.object({
     body: z.object({
          name: z.string({ required_error: 'Title is required' }),
          description: z.string({ required_error: 'Description is required' }),
          price: z
               .union([z.string(), z.number()])
               .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
               .refine((val) => !isNaN(val), {
                    message: 'Price must be a valid number.',
               }),
          duration: z.enum(['1 week', '1 month', '3 months', '6 months', '1 year'], {
               required_error: 'Duration is required',
          }),
          paymentType: z.enum(['Monthly', 'Yearly', 'Weekly'], {
               required_error: 'Payment type is required',
          }),
     }),
});

export const PackageValidation = {
     createPackageZodSchema,
};
