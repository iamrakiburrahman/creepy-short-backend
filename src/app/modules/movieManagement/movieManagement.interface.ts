import { Types } from "mongoose";

// Based on Image 3: Create New Movies Modal
export type TMovieType = 'Movie' | 'Series';

export interface IMovie {
     title: string;
     genre: string;
     category: string[];
     categoryId: Types.ObjectId[];
     tags: string[];
     description: string;
     accentColor: string;
     thumbnail: string;
     status: 'Ongoing' | 'Completed';
     totalViews: number;
     rating: number;
     releaseDate: Date;
     isReleased: boolean;
     isDeleted: boolean;
}
