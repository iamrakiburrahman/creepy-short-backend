import { Types } from 'mongoose';

// Based on Image 3: Create New Movies Modal
export type TMovieType = 'Movie' | 'Series';

export interface IMovie {
     title: string;
     genre: string;
     type: TMovieType;
     tags: string[]; // From "Tags" input
     description: string;
     bannerUrl: string; // "Top Banner"
     accentColor: string; // "Accent Color" (Hex code)
     thumbnailUrl: string;
     // Derived/Default fields visible in Image 2 & 4
     status: 'Ongoing' | 'Completed';
     totalViews: number;
     rating: number;
     releaseDate: Date;
     isDeleted: boolean;
}

export interface IVideo {
     title: string;
     description?: string;
     duration: number; // UI: Duration (minutes)
     videoUrl: string; // UI: Video File link
     thumbnailUrl: string; // UI: Thumbnail Image link
     movieId: Types.ObjectId; // Parent (Movie or Series ID)
     // Only for Series
     seasonId?: Types.ObjectId;
     episodeNumber?: number;
     views: number;
     isDeleted: boolean;
}
