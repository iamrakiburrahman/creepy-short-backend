import { User } from '../user/user.model';
import { Subscription } from '../subscription/subscription.model';
import { Video } from '../videoManagement/videoManagement.model';
import { MovieModel } from '../movieManagement/movieManagement.model';
import { Trailer } from '../trailer/trailer.model';
import moment from 'moment';
import { PipelineStage } from 'mongoose';

// ─── Shared Helpers ──────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
     january: 0,
     jan: 0,
     february: 1,
     feb: 1,
     march: 2,
     mar: 2,
     april: 3,
     apr: 3,
     may: 4,
     june: 5,
     jun: 5,
     july: 6,
     jul: 6,
     august: 7,
     aug: 7,
     september: 8,
     sep: 8,
     october: 9,
     oct: 9,
     november: 10,
     nov: 10,
     december: 11,
     dec: 11,
};

type ViewType = 'year' | 'month' | 'week' | 'day';

interface DateRange {
     startDate: Date;
     endDate: Date;
}

function resolveMonthIndex(monthInput: string): number {
     const key = monthInput.trim().toLowerCase();
     return MONTH_MAP[key] !== undefined ? MONTH_MAP[key] : moment().month();
}

function getDateRange(view: ViewType, year: number, monthIndex: number): DateRange {
     switch (view) {
          case 'year':
               return {
                    startDate: moment([year]).startOf('year').toDate(),
                    endDate: moment([year]).endOf('year').toDate(),
               };
          case 'month':
               return {
                    startDate: moment([year, monthIndex]).startOf('month').toDate(),
                    endDate: moment([year, monthIndex]).endOf('month').toDate(),
               };
          case 'week':
               return {
                    startDate: moment().startOf('week').toDate(),
                    endDate: moment().endOf('week').toDate(),
               };
          case 'day':
               return {
                    startDate: moment().startOf('day').toDate(),
                    endDate: moment().endOf('day').toDate(),
               };
     }
}

function parseQueryParams(query: Record<string, unknown>) {
     const view = ((query.view as string) || 'year') as ViewType;
     const year = Number(query.year) || moment().year();
     const monthIndex = resolveMonthIndex(String(query.month || ''));
     return { view, year, monthIndex };
}

function buildFilter(view: ViewType, year: number, monthIndex: number) {
     const { startDate, endDate } = getDateRange(view, year, monthIndex);
     return {
          startDate,
          endDate,
          dateFilter: { createdAt: { $gte: startDate, $lte: endDate } },
          filterMeta: {
               view,
               year,
               month: moment(startDate).format('MMMM'),
               range: { start: startDate, end: endDate },
          },
     };
}

function calculateGrowth(current: number, previous: number): string {
     if (previous === 0) return current > 0 ? '+100%' : '0%';
     const growth = ((current - previous) / previous) * 100;
     return (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%';
}

// ─── Service Functions ────────────────────────────────────────────────────────

const getOverview = async (query: Record<string, unknown>) => {
     const { view, year, monthIndex } = parseQueryParams(query);
     const { dateFilter, filterMeta } = buildFilter(view, year, monthIndex);

     const [totalMovies, totalUsers, activeSubscriptions, revenueAgg] = await Promise.all([
          Video.countDocuments({ isDeleted: false, ...dateFilter }),
          User.countDocuments({ role: 'USER', isDeleted: false, ...dateFilter }),
          Subscription.countDocuments({ status: 'active', ...dateFilter }),
          Subscription.aggregate([{ $match: { status: 'active', ...dateFilter } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
     ]);

     return {
          filter: filterMeta,
          totalMovies,
          totalUsers,
          activeSubscriptions,
          totalRevenue: revenueAgg[0]?.total || 0,
     };
};

const getUserGrowth = async (query: Record<string, unknown>) => {
     const { view, year, monthIndex } = parseQueryParams(query);
     const { startDate, endDate, filterMeta } = buildFilter(view, year, monthIndex);

     // Build group format and label array per view
     let groupFormat: PipelineStage.Group['$group']['_id'];
     let labelArray: string[];

     switch (view) {
          case 'year':
               groupFormat = { $month: '$createdAt' };
               labelArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
               break;
          case 'month':
               groupFormat = { $dayOfMonth: '$createdAt' };
               labelArray = Array.from({ length: moment(startDate).daysInMonth() }, (_, i) => String(i + 1));
               break;
          case 'week':
               groupFormat = { $dayOfWeek: '$createdAt' };
               labelArray = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
               break;
          case 'day':
               groupFormat = { $hour: '$createdAt' };
               labelArray = Array.from({ length: 24 }, (_, i) => `${i}:00`);
               break;
     }

     const pipeline: PipelineStage[] = [
          {
               $match: {
                    role: 'USER',
                    isDeleted: false,
                    createdAt: { $gte: startDate, $lte: endDate },
               },
          },
          {
               $group: {
                    _id: groupFormat,
                    count: { $sum: 1 },
               },
          },
          { $sort: { _id: 1 as const } }, // ← fix: literal type
     ];

     const data = await User.aggregate(pipeline);

     const growthData = labelArray.map((label, index) => {
          // MongoDB $month/$dayOfMonth/$dayOfWeek are 1-based; $hour is 0-based
          const lookupId = view === 'day' ? index : index + 1;
          const found = data.find((d: { _id: number; count: number }) => d._id === lookupId);
          return { label, count: found?.count ?? 0 };
     });

     return { filter: filterMeta, growthData };
};

const getTopWatchedVideos = async (query: Record<string, unknown>) => {
     const { view, year, monthIndex } = parseQueryParams(query);
     const { startDate, endDate, filterMeta } = buildFilter(view, year, monthIndex);

     const videos = await Video.find({
          isDeleted: false,
          createdAt: { $gte: startDate, $lte: endDate },
     })
          .sort({ views: -1 })
          .limit(5)
          .select('title views')
          .lean();

     return {
          filter: filterMeta,
          data: videos.map((v: any) => ({ title: v.title, views: v.views })),
     };
};
interface PeriodStat {
     period: string; // e.g. "January", "2024-01-15", "Week 1"
     revenue: number;
     views: number;
     movies: number;
     trailers: number;
}
// ─── STEP 1: getYearlyBreakdown ───────────────────────────────────────────────
async function getYearlyBreakdown(year: number): Promise<PeriodStat[]> {
     const months = Array.from({ length: 12 }, (_, i) => i);

     const ranges = months.map((monthIndex) => ({
          label: moment([year, monthIndex]).format('MMMM'),
          start: moment([year, monthIndex]).startOf('month').toDate(),
          end: moment([year, monthIndex]).endOf('month').toDate(),
     }));

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Promise.all([
                    Subscription.aggregate([{ $match: { status: 'active', createdAt: range } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
                    MovieModel.aggregate([{ $match: { createdAt: range, isDeleted: false } }, { $group: { _id: null, total: { $sum: '$totalViews' } } }]),
                    MovieModel.countDocuments({ status: 'Ongoing', createdAt: range, isDeleted: false }),
                    Trailer.countDocuments({ createdAt: range }),
               ]);
          }),
     );

     return ranges.map(({ label }, i) => {
          const [revenueRes, viewsRes, movieCount, trailerCount] = results[i];
          return {
               period: label,
               revenue: revenueRes[0]?.total ?? 0,
               views: viewsRes[0]?.total ?? 0,
               movies: movieCount ?? 0,
               trailers: trailerCount ?? 0,
          };
     });
}

// ─── STEP 2: getMonthlyBreakdown ──────────────────────────────────────────────
async function getMonthlyBreakdown(year: number, monthIndex: number): Promise<PeriodStat[]> {
     const daysInMonth = moment([year, monthIndex]).daysInMonth();
     const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

     const ranges = days.map((day) => ({
          label: moment([year, monthIndex, day]).format('YYYY-MM-DD'),
          start: moment([year, monthIndex, day]).startOf('day').toDate(),
          end: moment([year, monthIndex, day]).endOf('day').toDate(),
     }));

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Promise.all([
                    Subscription.aggregate([{ $match: { status: 'active', createdAt: range } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
                    MovieModel.aggregate([{ $match: { createdAt: range, isDeleted: false } }, { $group: { _id: null, total: { $sum: '$totalViews' } } }]),
                    MovieModel.countDocuments({ status: 'Ongoing', createdAt: range, isDeleted: false }),
                    Trailer.countDocuments({ createdAt: range }),
               ]);
          }),
     );

     return ranges.map(({ label }, i) => {
          const [revenueRes, viewsRes, movieCount, trailerCount] = results[i];
          return {
               period: label,
               revenue: revenueRes[0]?.total ?? 0,
               views: viewsRes[0]?.total ?? 0,
               movies: movieCount ?? 0,
               trailers: trailerCount ?? 0,
          };
     });
}

// ─── STEP 3: getWeeklyBreakdown ───────────────────────────────────────────────
async function getWeeklyBreakdown(): Promise<PeriodStat[]> {
     const days = Array.from({ length: 7 }, (_, i) => i);

     const ranges = days.map((i) => ({
          label: moment().startOf('week').add(i, 'days').format('dddd'),
          start: moment().startOf('week').add(i, 'days').startOf('day').toDate(),
          end: moment().startOf('week').add(i, 'days').endOf('day').toDate(),
     }));

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Promise.all([
                    Subscription.aggregate([{ $match: { status: 'active', createdAt: range } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
                    MovieModel.aggregate([{ $match: { createdAt: range, isDeleted: false } }, { $group: { _id: null, total: { $sum: '$totalViews' } } }]),
                    MovieModel.countDocuments({ status: 'Ongoing', createdAt: range, isDeleted: false }),
                    Trailer.countDocuments({ createdAt: range }),
               ]);
          }),
     );

     return ranges.map(({ label }, i) => {
          const [revenueRes, viewsRes, movieCount, trailerCount] = results[i];
          return {
               period: label,
               revenue: revenueRes[0]?.total ?? 0,
               views: viewsRes[0]?.total ?? 0,
               movies: movieCount ?? 0,
               trailers: trailerCount ?? 0,
          };
     });
}

// ─── STEP 4: getDailyBreakdown ────────────────────────────────────────────────
async function getDailyBreakdown(): Promise<PeriodStat[]> {
     const hours = Array.from({ length: 24 }, (_, i) => i);

     const ranges = hours.map((hour) => ({
          label: moment().startOf('day').add(hour, 'hours').format('HH:00'),
          start: moment().startOf('day').add(hour, 'hours').toDate(),
          end: moment().startOf('day').add(hour, 'hours').endOf('hour').toDate(),
     }));

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Promise.all([
                    Subscription.aggregate([{ $match: { status: 'active', createdAt: range } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
                    MovieModel.aggregate([{ $match: { createdAt: range, isDeleted: false } }, { $group: { _id: null, total: { $sum: '$totalViews' } } }]),
                    MovieModel.countDocuments({ status: 'Ongoing', createdAt: range, isDeleted: false }),
                    Trailer.countDocuments({ createdAt: range }),
               ]);
          }),
     );

     return ranges.map(({ label }, i) => {
          const [revenueRes, viewsRes, movieCount, trailerCount] = results[i];
          return {
               period: label,
               revenue: revenueRes[0]?.total ?? 0,
               views: viewsRes[0]?.total ?? 0,
               movies: movieCount ?? 0,
               trailers: trailerCount ?? 0,
          };
     });
}

// ─── STEP 5: getBreakdown router ──────────────────────────────────────────────
function getBreakdown(view: ViewType, year: number, monthIndex: number): Promise<PeriodStat[]> {
     switch (view) {
          case 'year':
               return getYearlyBreakdown(year);
          case 'month':
               return getMonthlyBreakdown(year, monthIndex);
          case 'week':
               return getWeeklyBreakdown();
          case 'day':
               return getDailyBreakdown();
     }
}

// ─── STEP 6: getProductionReportStats (main) ──────────────────────────────────
const getProductionReportStats = async (query: Record<string, unknown>) => {
     const { view, year, monthIndex } = parseQueryParams(query);
     const { startDate, endDate, filterMeta } = buildFilter(view, year, monthIndex);

     const unit = view === 'year' ? 'year' : view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
     const prevStartDate = moment(startDate).subtract(1, unit).toDate();
     const prevEndDate = moment(endDate).subtract(1, unit).toDate();

     const currRange = { $gte: startDate, $lte: endDate };
     const prevRange = { $gte: prevStartDate, $lte: prevEndDate };

     const sumViews = (match: object) => MovieModel.aggregate([{ $match: { ...match, isDeleted: false } }, { $group: { _id: null, total: { $sum: '$totalViews' } } }]);

     const sumRevenue = (match: object) => Subscription.aggregate([{ $match: { status: 'active', ...match } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);

     const [currPeriodData, prevPeriodStats, totalStats, breakdown] = await Promise.all([
          Promise.all([
               sumRevenue({ createdAt: currRange }),
               sumViews({ createdAt: currRange }),
               MovieModel.countDocuments({ status: 'Ongoing', createdAt: currRange, isDeleted: false }),
               Trailer.countDocuments({ createdAt: currRange }),
          ]),
          Promise.all([
               MovieModel.countDocuments({ status: 'Ongoing', createdAt: prevRange, isDeleted: false }),
               Trailer.countDocuments({ createdAt: prevRange }),
               sumViews({ createdAt: prevRange }),
               sumRevenue({ createdAt: prevRange }),
          ]),
          Promise.all([MovieModel.countDocuments({ status: 'Ongoing', isDeleted: false }), Trailer.countDocuments({}), sumViews({}), sumRevenue({})]),
          getBreakdown(view, year, monthIndex),
     ]);

     const currentRevenue = currPeriodData[0][0]?.total ?? 0;
     const currentViews = currPeriodData[1][0]?.total ?? 0;
     const previousRevenue = prevPeriodStats[3][0]?.total ?? 0;
     const previousViews = prevPeriodStats[2][0]?.total ?? 0;

     return {
          filter: filterMeta,
          statistics: {
               activeMovie: {
                    total: totalStats[0] ?? 0,
                    periodCount: currPeriodData[2] ?? 0,
                    growth: calculateGrowth(currPeriodData[2] ?? 0, prevPeriodStats[0] ?? 0),
               },
               totalTrailer: {
                    total: totalStats[1] ?? 0,
                    periodCount: currPeriodData[3] ?? 0,
                    growth: calculateGrowth(currPeriodData[3] ?? 0, prevPeriodStats[1] ?? 0),
               },
               totalView: {
                    total: totalStats[2][0]?.total ?? 0,
                    periodCount: currentViews,
                    growth: calculateGrowth(currentViews, previousViews),
               },
               totalRevenue: {
                    total: totalStats[3][0]?.total ?? 0,
                    periodAmount: currentRevenue,
                    growth: calculateGrowth(currentRevenue, previousRevenue),
               },
          },
          breakdown,
     };
};
export const DashboardService = {
     getOverview,
     getUserGrowth,
     getTopWatchedVideos,
     getProductionReportStats,
};
