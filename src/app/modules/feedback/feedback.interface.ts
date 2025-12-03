import { Types } from 'mongoose';
export interface IFeedback {
    userId: Types.ObjectId;
    rating: number; 
    comment: string;
}

export default IFeedback;
