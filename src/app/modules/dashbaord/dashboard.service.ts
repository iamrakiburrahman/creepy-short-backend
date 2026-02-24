
import { User } from '../user/user.model';
import { Subscription } from '../subscription/subscription.model';
import { StatusCodes } from 'http-status-codes';
import { Video } from '../videoManagement/videoManagement.model';

const getOverview = async () => {
     const totalMovies = await Video.countDocuments({ isDeleted: false });
     const totalUsers = await User.countDocuments({ role: 'USER', isDeleted: false });
     const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
     const totalRevenueAgg = await Subscription.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: '$price' } } }]);
     const totalRevenue = totalRevenueAgg[0]?.total || 0;

     return { totalMovies, totalUsers, activeSubscriptions, totalRevenue };
};

const getUserGrowth = async () => {
     const pipeline = [
          {
               $match: { role: 'USER', isDeleted: false },
          },
          {
               $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 },
               },
          },
          { $sort: { _id: 1 } },
     ];
     const data = await User.aggregate<any>(pipeline as any);
     const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
     return monthNames.map((month, index) => {
          const found = data.find((d: any) => d._id === index + 1);
          return { month, count: found ? found.count : 0 };
     });
};

const getTopWatchedVideos = async () => {
     const videos = await Video.find({ isDeleted: false }).sort({ views: -1 }).limit(5).select('title views');
     return videos.map((v: any) => ({ title: v.title, views: v.views }));
};

export const DashboardService = {
     getOverview,
     getUserGrowth,
     getTopWatchedVideos,
};
