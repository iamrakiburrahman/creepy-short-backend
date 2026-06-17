import moment from 'moment';
import { Types } from 'mongoose';
import { ItemType } from './viewHistory.interface';
import { ViewHistory } from './viewHistory.model';

const incrementViewCount = async (itemType: ItemType, itemId: string | Types.ObjectId) => {
     const currentHour = moment().utc().startOf('hour').toDate();

     await ViewHistory.updateOne(
          {
               date: currentHour,
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
