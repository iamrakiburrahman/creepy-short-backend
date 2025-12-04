import { Types } from "mongoose";

// Based on Image 3: Create New Movies Modal
export type TMovieType = 'Movie' | 'Series';

export interface IMovie {
     title: string;
     genre: string;
     type: TMovieType;
     category: string;
     categoryId: Types.ObjectId;
     tags: string[]; // From "Tags" input
     description: string;
     accentColor: string; // "Accent Color" (Hex code)
     thumbnail: string;
     // Derived/Default fields visible in Image 2 & 4
     status: 'Ongoing' | 'Completed';
     totalViews: number;
     rating: number;
     releaseDate: Date;
     isReleased: boolean;
     isDeleted: boolean;
}
