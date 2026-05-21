import { z } from 'zod';

const createSubCategoryZodSchema = z.object({
     body: z.object({
          name: z.string({ required_error: 'Subcategory name is required' }),
          categoryId: z.string({ required_error: 'Category ID is required' }),
     }),
});

const updateSubCategoryZodSchema = z.object({
     body: z.object({
          name: z.string().optional(),
          categoryId: z.string().optional(),
     }),
});

export const SubCategoryValidation = {
     createSubCategoryZodSchema,
     updateSubCategoryZodSchema,
};
