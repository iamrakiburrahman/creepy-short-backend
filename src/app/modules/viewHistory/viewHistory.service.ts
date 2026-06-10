import moment from 'moment';
import { Types } from 'mongoose';
import { ViewHistory } from './viewHistory.model';
import { ItemType } from './viewHistory.interface';

const incrementViewCount = async (itemType: ItemType, itemId: string | Types.ObjectId) => {
     const today = moment().startOf('day').toDate();
     
     await ViewHistory.updateOne(
          {
               date: today,
               itemType,
               itemId: new Types.ObjectId(itemId),
          },
          {
               $inc: { count: 1 },
          },
          { upsert: true },
     );
};

export const ViewHistoryServices = {
     incrementViewCount,
};
