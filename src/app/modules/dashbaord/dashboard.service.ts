import { User } from '../user/user.model';
import { Subscription } from '../subscription/subscription.model';
import { Video } from '../videoManagement/videoManagement.model';
import { MovieModel } from '../movieManagement/movieManagement.model';
import { Trailer } from '../trailer/trailer.model';

const getOverview = async (query: Record<string, unknown>) => {
     const year = Number(query.year) || new Date().getFullYear();
     const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
     const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

     // Common date filter object
     const dateFilter = {
          createdAt: { $gte: startDate, $lte: endDate },
     };

     // 1. Total Movies in that year
     const totalMovies = await Video.countDocuments({
          isDeleted: false,
          ...dateFilter,
     });

     // 2. Total Users joined in that year
     const totalUsers = await User.countDocuments({
          role: 'USER',
          isDeleted: false,
          ...dateFilter,
     });

     // 3. Active Subscriptions within that year
     const activeSubscriptions = await Subscription.countDocuments({
          status: 'active',
          ...dateFilter,
     });

     // 4. Total Revenue in that year
     const totalRevenueAgg = await Subscription.aggregate([
          {
               $match: {
                    status: 'active',
                    ...dateFilter,
               },
          },
          {
               $group: {
                    _id: null,
                    total: { $sum: '$price' },
               },
          },
     ]);

     const totalRevenue = totalRevenueAgg[0]?.total || 0;

     return {
          year,
          totalMovies,
          totalUsers,
          activeSubscriptions,
          totalRevenue,
     };
};

const getUserGrowth = async (year?: number) => {
     const currentYear = year || new Date().getFullYear();

     const pipeline = [
          {
               $match: {
                    role: 'USER',
                    isDeleted: false,
                    createdAt: {
                         $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                         $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
                    },
               },
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

const getTopWatchedVideos = async (year?: number) => {
     const currentYear = year || new Date().getFullYear();

     const videos = await Video.find({
          isDeleted: false,
          createdAt: {
               $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
               $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
          },
     })
          .sort({ views: -1 })
          .limit(5)
          .select('title views');

     return videos.map((v: any) => ({ title: v.title, views: v.views }));
};

const getProductionReportStats = async (year: number) => {
     const startDate = new Date(`${year}-01-01`);
     const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

     // --- Growth Calculation Logic ---
     const now = new Date();
     const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
     const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
     const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

     const calculateGrowth = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? '+100%' : '0%';
          const growth = ((current - previous) / previous) * 100;
          return (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%';
     };

     // --- Parallel Data Fetching ---
     const [pipelineData, currMonthStats, prevMonthStats, totalStats] = await Promise.all([
          // 1. Chart Data (Monthly Aggregation)
          Promise.all([
               User.aggregate([{ $match: { createdAt: { $gte: startDate, $lte: endDate }, isDeleted: false } }, { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } }]),
               // Subscription revenue (sum of amount) per month
               Subscription.aggregate([{ $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'active' } }, { $group: { _id: { $month: '$createdAt' }, count: { $sum: '$price' } } }]),
               MovieModel.aggregate([
                    { $match: { releaseDate: { $gte: startDate, $lte: endDate }, isDeleted: false } },
                    { $group: { _id: { $month: '$releaseDate' }, count: { $sum: '$totalViews' } } },
               ]),
          ]),

          // 2. Current Month Stats for Growth
          Promise.all([
               MovieModel.countDocuments({ status: 'Ongoing', createdAt: { $gte: startOfCurrentMonth } }),
               Trailer.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
               MovieModel.aggregate([{ $match: { createdAt: { $gte: startOfCurrentMonth } } }, { $group: { _id: null, total: { $sum: '$totalViews' } } }]),
               // Current month subscription revenue
               Subscription.aggregate([{ $match: { status: 'active', createdAt: { $gte: startOfCurrentMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
          ]),

          // 3. Previous Month Stats for Growth
          Promise.all([
               MovieModel.countDocuments({ status: 'Ongoing', createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } }),
               Trailer.countDocuments({ createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } }),
               MovieModel.aggregate([{ $match: { createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } } }, { $group: { _id: null, total: { $sum: '$totalViews' } } }]),
               // Previous month subscription revenue
               Subscription.aggregate([{ $match: { status: 'active', createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
          ]),

          // 4. Overall Totals
          Promise.all([
               MovieModel.countDocuments({ status: 'Ongoing', isDeleted: false }),
               Trailer.countDocuments({}),
               MovieModel.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$totalViews' } } }]),
               // Total subscription revenue (all time)
               Subscription.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
          ]),
     ]);

     // Format Chart Data
     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
     const productionPipeline = months.map((month, index) => {
          const monthNum = index + 1;
          return {
               month,
               audience: pipelineData[0].find((d) => d._id === monthNum)?.count || 0,
               subscription: pipelineData[1].find((d) => d._id === monthNum)?.count || 0, // now revenue amount
               view: pipelineData[2].find((d) => d._id === monthNum)?.count || 0,
          };
     });

     return {
          productionPipeline,
          statistics: {
               activeMovie: {
                    total: totalStats[0],
                    growth: calculateGrowth(currMonthStats[0], prevMonthStats[0]),
               },
               totalTrailer: {
                    total: totalStats[1],
                    growth: calculateGrowth(currMonthStats[1], prevMonthStats[1]),
               },
               totalView: {
                    total: totalStats[2][0]?.total || 0,
                    growth: calculateGrowth(currMonthStats[2][0]?.total || 0, prevMonthStats[2][0]?.total || 0),
               },
               // Subscription revenue instead of count
               totalRevenue: {
                    total: totalStats[3][0]?.total || 0,
                    growth: calculateGrowth(currMonthStats[3][0]?.total || 0, prevMonthStats[3][0]?.total || 0),
               },
          },
     };
};

export const DashboardService = {
     getOverview,
     getUserGrowth,
     getTopWatchedVideos,
     getProductionReportStats,
};
