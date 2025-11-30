import { Types } from 'mongoose';

// Based on Image 3: Create New Movies Modal
export type TMovieType = 'Movie' | 'Series';

export interface IVideo {
     title: string;
     description?: string;
     duration: number; // UI: Duration (minutes)
     videoUrl: string; // UI: Video File link
     videoId: string; // UI: Video File link
     libraryId: string; // UI: Video File link
     thumbnailUrl: string; // UI: Thumbnail Image link
     movieId: Types.ObjectId; // Parent (Movie or Series ID)
     // Only for Series
     seasonId?: Types.ObjectId;
     episodeNumber?: number;
     views: number;
     isDeleted: boolean;
}
