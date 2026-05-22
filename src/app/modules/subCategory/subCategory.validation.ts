import { z } from 'zod';

const createSubCategoryZodSchema = z.object({
     body: z.object({
          name: z.string({ required_error: 'Subcategory name is required' }),
          categoryId: z.string({ required_error: 'Category ID is required' }),
     }),
});

export const SubCategoryValidation = {
     createSubCategoryZodSchema,
};
