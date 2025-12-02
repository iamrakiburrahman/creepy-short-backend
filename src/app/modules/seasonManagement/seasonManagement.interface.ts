import { Types } from "mongoose";

export interface ISeason {
     title: string;
     seasonNumber: number; 
     movieId: Types.ObjectId;
     description?: string;
}
