import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import multer from "multer";
const storage = multer.memoryStorage();
// Only images allowed
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
     if (file.mimetype.startsWith('image/')) {
          cb(null, true);
     } else {
          cb(new AppError(StatusCodes.BAD_REQUEST, 'Only image files are allowed'), false);
     }
};
// Thumbnail upload
export const uploadThumbnail = multer({
     storage,
     fileFilter,
     limits: {
          fileSize: 10 * 1024 * 1024, // 10MB max
     },
}).single('thumbnail');