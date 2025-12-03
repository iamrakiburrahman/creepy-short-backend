import { z } from "zod";

const createFeedbackZodSchema = z.object({
    body: z.object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().min(1),
    }),
})
export const FeedbackValidation = {
    createFeedbackZodSchema
}