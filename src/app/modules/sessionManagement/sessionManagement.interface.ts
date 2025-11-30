import { Types } from "mongoose";

export interface ISeason {
     title: string;
     seasonNumber: number; 
     seriesId: Types.ObjectId;
     description?: string;
}
