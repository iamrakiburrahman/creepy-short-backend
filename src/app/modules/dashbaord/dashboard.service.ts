import moment from 'moment';
import { PipelineStage } from 'mongoose';
import { MovieModel } from '../movieManagement/movieManagement.model';
import { Subscription } from '../subscription/subscription.model';
import { Trailer } from '../trailer/trailer.model';
import { User } from '../user/user.model';
import { ViewHistory } from '../viewHistory/viewHistory.model';

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

// ─── Updated getDateRange ─────────────────────────────────────────────────────
// Day view:  year + monthIndex + day → specific day; defaults to today
// Week view: year + monthIndex + day → week containing that day; defaults to current week

function getDateRange(
     view: ViewType,
     year: number,
     monthIndex: number,
     day?: number, // specific day of the month (1-31)
): DateRange {
     switch (view) {
          case 'year':
               return {
                    startDate: moment([year]).utc().startOf('year').toDate(),
                    endDate: moment([year]).utc().endOf('year').toDate(),
               };

          case 'month':
               return {
                    startDate: moment([year, monthIndex]).utc().startOf('month').toDate(),
                    endDate: moment([year, monthIndex]).utc().endOf('month').toDate(),
               };

          case 'week': {
               // If day is provided → use year/month/day to find the week that contains it
               // Otherwise → use current week
               const anchor = day ? moment([year, monthIndex, day]).utc() : moment().utc();
               return {
                    startDate: anchor.clone().startOf('week').toDate(),
                    endDate: anchor.clone().endOf('week').toDate(),
               };
          }

          case 'day': {
               // If day is provided → use year/month/day
               // Otherwise → use today
               const target = day ? moment([year, monthIndex, day]).utc() : moment().utc();
               return {
                    startDate: target.clone().startOf('day').toDate(),
                    endDate: target.clone().endOf('day').toDate(),
               };
          }
     }
}

// ─── Original parseQueryParams (for getProductionReportStats) ──────────────────
// Now also parses `day` from query string

function parseOriginalQueryParams(query: Record<string, unknown>) {
     const view = ((query.view as string) || 'year') as ViewType;
     const year = Number(query.year) || moment().year();
     const monthIndex = resolveMonthIndex(String(query.month || ''));
     // `day` is optional — undefined means "use current"
     const day = query.day ? Number(query.day) : undefined;
     return { view, year, monthIndex, day };
}

// ─── Original buildFilter (for getProductionReportStats) ──────────────────────────
function buildOriginalFilter(view: ViewType, year: number, monthIndex: number, day?: number) {
     const { startDate, endDate } = getDateRange(view, year, monthIndex, day);
     return {
          startDate,
          endDate,
          dateFilter: { createdAt: { $gte: startDate, $lte: endDate } },
          filterMeta: {
               view,
               year,
               month: moment([year, monthIndex]).format('MMMM'),
               day: day ?? null,
               range: { start: startDate, end: endDate },
          },
     };
}

// ─── parseQueryParams (for getRevenueData) ──────────────────────────────────────
function parseQueryParams(query: Record<string, unknown>) {
     const view = ((query.view as string) || 'year') as ViewType;
     const year = Number(query.year) || moment().year();
     const monthIndex = resolveMonthIndex(String(query.month || ''));
     // `day` is optional — undefined means "use current"
     const day = query.day ? Number(query.day) : undefined;
     const startDate = query.startDate ? moment(String(query.startDate)).toDate() : undefined;
     const endDate = query.endDate ? moment(String(query.endDate)).toDate() : undefined;
     return { view, year, monthIndex, day, startDate, endDate };
}

// ─── buildFilter (for getRevenueData) ─────────────────────────────────────────
function buildFilter(
     view: ViewType,
     year: number,
     monthIndex: number,
     day?: number,
     customStartDate?: Date,
     customEndDate?: Date,
) {
     let startDate, endDate;
     if (customStartDate && customEndDate) {
          startDate = customStartDate;
          endDate = customEndDate;
     } else {
          ({ startDate, endDate } = getDateRange(view, year, monthIndex, day));
     }
     return {
          startDate,
          endDate,
          dateFilter: { createdAt: { $gte: startDate, $lte: endDate } },
          filterMeta: {
               view,
               year,
               month: moment([year, monthIndex]).format('MMMM'),
               day: day ?? null,
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
     const { view, year, monthIndex, day } = parseOriginalQueryParams(query);
     const { dateFilter, filterMeta } = buildOriginalFilter(view, year, monthIndex, day);

     const [totalMovies, totalUsers, activeSubscriptions, revenueAgg] = await Promise.all([
          MovieModel.countDocuments({ isDeleted: false, ...dateFilter }),
          User.countDocuments({ role: 'USER', isDeleted: false, ...dateFilter }),
          Subscription.countDocuments({ status: 'active', ...dateFilter }),
          Subscription.aggregate([
               { $match: { ...dateFilter } },
               { $group: { _id: null, total: { $sum: '$price' } } },
          ]),
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
     const { view, year, monthIndex, day } = parseOriginalQueryParams(query);
     const {
          startDate: finalStartDate,
          endDate: finalEndDate,
          filterMeta,
     } = buildOriginalFilter(view, year, monthIndex, day);

     let groupFormat: PipelineStage.Group['$group']['_id'];
     let labelArray: string[];

     switch (view) {
          case 'year':
               groupFormat = { $month: '$createdAt' };
               labelArray = [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
               ];
               break;
          case 'month':
               groupFormat = { $dayOfMonth: '$createdAt' };
               labelArray = Array.from({ length: moment(finalStartDate).daysInMonth() }, (_, i) =>
                    String(i + 1),
               );
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
                    createdAt: { $gte: finalStartDate, $lte: finalEndDate },
               },
          },
          {
               $group: {
                    _id: groupFormat,
                    count: { $sum: 1 },
               },
          },
          { $sort: { _id: 1 as const } },
     ];

     const data = await User.aggregate(pipeline);

     const growthData = labelArray.map((label, index) => {
          const lookupId = view === 'day' ? index : index + 1;
          const found = data.find((d: { _id: number; count: number }) => d._id === lookupId);
          return { label, count: found?.count ?? 0 };
     });

     return { filter: filterMeta, growthData };
};

const getTopWatchedVideos = async (query: Record<string, unknown>) => {
     const { view, year, monthIndex, day } = parseOriginalQueryParams(query);
     const {
          startDate: finalStartDate,
          endDate: finalEndDate,
          filterMeta,
     } = buildOriginalFilter(view, year, monthIndex, day);

     const videos = await MovieModel.find({
          isDeleted: false,
          createdAt: { $gte: finalStartDate, $lte: finalEndDate },
     })
          .sort({ totalViews: -1 })
          .limit(5)
          .select('title totalViews')
          .lean();

     return {
          filter: filterMeta,
          data: videos.map((v: any) => ({ title: v.title, views: v.totalViews })),
     };
};

interface PeriodStat {
     period: string;
     revenue: number;
     views: number;
     movies: number;
     trailers: number;
}

// ─── STEP 1: getYearlyBreakdown ───────────────────────────────────────────────
async function getYearlyBreakdown(year: number): Promise<PeriodStat[]> {
     const months = Array.from({ length: 12 }, (_, i) => i);

     const ranges = months.map((monthIndex) => ({
          label: moment([year, monthIndex]).utc().format('MMMM'),
          start: moment([year, monthIndex]).utc().startOf('month').toDate(),
          end: moment([year, monthIndex]).utc().endOf('month').toDate(),
     }));

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Promise.all([
                    Subscription.aggregate([
                         { $match: { createdAt: range } },
                         { $group: { _id: null, total: { $sum: '$price' } } },
                    ]),
                    ViewHistory.aggregate([
                         { $match: { date: range } },
                         { $group: { _id: null, total: { $sum: '$count' } } },
                    ]),
                    MovieModel.countDocuments({
                         status: 'Ongoing',
                         createdAt: range,
                         isDeleted: false,
                    }),
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
     const daysInMonth = moment([year, monthIndex]).utc().daysInMonth();
     const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

     const ranges = days.map((day) => ({
          label: moment([year, monthIndex, day]).utc().format('YYYY-MM-DD'),
          start: moment([year, monthIndex, day]).utc().startOf('day').toDate(),
          end: moment([year, monthIndex, day]).utc().endOf('day').toDate(),
     }));

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Promise.all([
                    Subscription.aggregate([
                         { $match: { createdAt: range } },
                         { $group: { _id: null, total: { $sum: '$price' } } },
                    ]),
                    ViewHistory.aggregate([
                         { $match: { date: range } },
                         { $group: { _id: null, total: { $sum: '$count' } } },
                    ]),
                    MovieModel.countDocuments({
                         status: 'Ongoing',
                         createdAt: range,
                         isDeleted: false,
                    }),
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
// Now accepts an optional anchor date (year + monthIndex + day)
// If provided → show the week containing that date
// If not → show current week

async function getWeeklyBreakdown(
     year?: number,
     monthIndex?: number,
     day?: number,
): Promise<PeriodStat[]> {
     const anchor =
          year !== undefined && monthIndex !== undefined && day !== undefined
               ? moment([year, monthIndex, day]).utc()
               : moment().utc();

     const weekStart = anchor.clone().startOf('week');

     const days = Array.from({ length: 7 }, (_, i) => i);

     const ranges = days.map((i) => ({
          label: weekStart.clone().add(i, 'days').format('dddd'),
          start: weekStart.clone().add(i, 'days').startOf('day').toDate(),
          end: weekStart.clone().add(i, 'days').endOf('day').toDate(),
     }));

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Promise.all([
                    Subscription.aggregate([
                         { $match: { createdAt: range } },
                         { $group: { _id: null, total: { $sum: '$price' } } },
                    ]),
                    ViewHistory.aggregate([
                         { $match: { date: range } },
                         { $group: { _id: null, total: { $sum: '$count' } } },
                    ]),
                    MovieModel.countDocuments({
                         status: 'Ongoing',
                         createdAt: range,
                         isDeleted: false,
                    }),
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
// Now accepts an optional specific date (year + monthIndex + day)
// If provided → show 24 hours of that day
// If not → show today's hours

async function getDailyBreakdown(
     year?: number,
     monthIndex?: number,
     day?: number,
): Promise<PeriodStat[]> {
     const target =
          year !== undefined && monthIndex !== undefined && day !== undefined
               ? moment([year, monthIndex, day]).utc()
               : moment().utc();

     const dayStart = target.clone().startOf('day');
     const hours = Array.from({ length: 24 }, (_, i) => i);

     const ranges = hours.map((hour) => ({
          label: dayStart.clone().add(hour, 'hours').format('HH:00'),
          start: dayStart.clone().add(hour, 'hours').toDate(),
          end: dayStart.clone().add(hour, 'hours').endOf('hour').toDate(),
     }));

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Promise.all([
                    Subscription.aggregate([
                         { $match: { createdAt: range } },
                         { $group: { _id: null, total: { $sum: '$price' } } },
                    ]),
                    ViewHistory.aggregate([
                         { $match: { date: range } },
                         { $group: { _id: null, total: { $sum: '$count' } } },
                    ]),
                    MovieModel.countDocuments({
                         status: 'Ongoing',
                         createdAt: range,
                         isDeleted: false,
                    }),
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

// ─── Original getBreakdown (for getProductionReportStats) ─────────────────────
function getOriginalBreakdown(
     view: ViewType,
     year: number,
     monthIndex: number,
     day?: number,
): Promise<PeriodStat[]> {
     switch (view) {
          case 'year':
               return getYearlyBreakdown(year);
          case 'month':
               return getMonthlyBreakdown(year, monthIndex);
          case 'week':
               // Pass day so breakdown uses the correct week anchor
               return getWeeklyBreakdown(year, monthIndex, day);
          case 'day':
               // Pass day so breakdown shows the correct day's hours
               return getDailyBreakdown(year, monthIndex, day);
     }
}

// ─── STEP 5: getBreakdown router (for getRevenueData) ──────────────────────────
function getBreakdown(
     view: ViewType,
     year: number,
     monthIndex: number,
     day?: number,
     customStartDate?: Date,
     customEndDate?: Date,
): Promise<PeriodStat[]> {
     if (customStartDate && customEndDate) {
          return getCustomRangeBreakdown(view, customStartDate, customEndDate);
     }
     switch (view) {
          case 'year':
               return getYearlyBreakdown(year);
          case 'month':
               return getMonthlyBreakdown(year, monthIndex);
          case 'week':
               // Pass day so breakdown uses the correct week anchor
               return getWeeklyBreakdown(year, monthIndex, day);
          case 'day':
               // Pass day so breakdown shows the correct day's hours
               return getDailyBreakdown(year, monthIndex, day);
     }
}

// ─── STEP 6: getProductionReportStats (main) ──────────────────────────────────
const getProductionReportStats = async (query: Record<string, unknown>) => {
     const { view, year, monthIndex, day } = parseOriginalQueryParams(query);
     const { startDate, endDate, filterMeta } = buildOriginalFilter(view, year, monthIndex, day);

     const unit =
          view === 'year' ? 'year' : view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
     const prevStartDate = moment(startDate).subtract(1, unit).toDate();
     const prevEndDate = moment(endDate).subtract(1, unit).toDate();

     const currRange = { $gte: startDate, $lte: endDate };
     const prevRange = { $gte: prevStartDate, $lte: prevEndDate };

     const sumViews = (match: object) =>
          ViewHistory.aggregate([
               { $match: { date: match } },
               { $group: { _id: null, total: { $sum: '$count' } } },
          ]);

     const sumRevenue = (match: object) =>
          Subscription.aggregate([
               { $match: { ...match } },
               { $group: { _id: null, total: { $sum: '$price' } } },
          ]);

     const [currPeriodData, prevPeriodStats, totalStats, breakdown] = await Promise.all([
          Promise.all([
               sumRevenue({ createdAt: currRange }),
               sumViews(currRange),
               MovieModel.countDocuments({
                    status: 'Ongoing',
                    createdAt: currRange,
                    isDeleted: false,
               }),
               Trailer.countDocuments({ createdAt: currRange }),
          ]),
          Promise.all([
               MovieModel.countDocuments({
                    status: 'Ongoing',
                    createdAt: prevRange,
                    isDeleted: false,
               }),
               Trailer.countDocuments({ createdAt: prevRange }),
               sumViews(prevRange),
               sumRevenue({ createdAt: prevRange }),
          ]),
          Promise.all([
               MovieModel.countDocuments({ status: 'Ongoing', isDeleted: false }),
               Trailer.countDocuments({}),
               ViewHistory.aggregate([{ $group: { _id: null, total: { $sum: '$count' } } }]),
               sumRevenue({}),
          ]),
          getOriginalBreakdown(view, year, monthIndex, day),
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

// ─── Revenue Specific Functions ───────────────────────────────────────────────

async function getRevenueYearlyBreakdown(year: number) {
     const months = Array.from({ length: 12 }, (_, i) => i);

     const ranges = months.map((monthIndex) => ({
          label: moment([year, monthIndex]).utc().format('MMMM'),
          start: moment([year, monthIndex]).utc().startOf('month').toDate(),
          end: moment([year, monthIndex]).utc().endOf('month').toDate(),
     }));

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Subscription.aggregate([
                    { $match: { createdAt: range } },
                    { $group: { _id: null, total: { $sum: '$price' } } },
               ]);
          }),
     );

     return ranges.map(({ label }, i) => ({
          period: label,
          revenue: results[i][0]?.total ?? 0,
     }));
}

async function getRevenueMonthlyBreakdown(year: number, monthIndex: number) {
     const daysInMonth = moment([year, monthIndex]).utc().daysInMonth();
     const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

     const ranges = days.map((day) => ({
          label: moment([year, monthIndex, day]).utc().format('YYYY-MM-DD'),
          start: moment([year, monthIndex, day]).utc().startOf('day').toDate(),
          end: moment([year, monthIndex, day]).utc().endOf('day').toDate(),
     }));

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Subscription.aggregate([
                    { $match: { createdAt: range } },
                    { $group: { _id: null, total: { $sum: '$price' } } },
               ]);
          }),
     );

     return ranges.map(({ label }, i) => ({
          period: label,
          revenue: results[i][0]?.total ?? 0,
     }));
}

async function getRevenueWeeklyBreakdown(year?: number, monthIndex?: number, day?: number) {
     const anchor =
          year !== undefined && monthIndex !== undefined && day !== undefined
               ? moment([year, monthIndex, day]).utc()
               : moment().utc();

     const weekStart = anchor.clone().startOf('week');

     const days = Array.from({ length: 7 }, (_, i) => i);

     const ranges = days.map((i) => ({
          label: weekStart.clone().add(i, 'days').format('dddd'),
          start: weekStart.clone().add(i, 'days').startOf('day').toDate(),
          end: weekStart.clone().add(i, 'days').endOf('day').toDate(),
     }));

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Subscription.aggregate([
                    { $match: { createdAt: range } },
                    { $group: { _id: null, total: { $sum: '$price' } } },
               ]);
          }),
     );

     return ranges.map(({ label }, i) => ({
          period: label,
          revenue: results[i][0]?.total ?? 0,
     }));
}

async function getRevenueDailyBreakdown(year?: number, monthIndex?: number, day?: number) {
     const target =
          year !== undefined && monthIndex !== undefined && day !== undefined
               ? moment([year, monthIndex, day]).utc()
               : moment().utc();

     const dayStart = target.clone().startOf('day');
     const hours = Array.from({ length: 24 }, (_, i) => i);

     const ranges = hours.map((hour) => ({
          label: dayStart.clone().add(hour, 'hours').format('HH:00'),
          start: dayStart.clone().add(hour, 'hours').toDate(),
          end: dayStart.clone().add(hour, 'hours').endOf('hour').toDate(),
     }));

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Subscription.aggregate([
                    { $match: { createdAt: range } },
                    { $group: { _id: null, total: { $sum: '$price' } } },
               ]);
          }),
     );

     return ranges.map(({ label }, i) => ({
          period: label,
          revenue: results[i][0]?.total ?? 0,
     }));
}

async function getCustomRangeBreakdown(
     view: ViewType,
     startDate: Date,
     endDate: Date,
): Promise<PeriodStat[]> {
     const startMoment = moment(startDate).utc();
     const endMoment = moment(endDate).utc();
     const ranges: { label: string; start: Date; end: Date }[] = [];
     let current = startMoment.clone();

     while (current.isSameOrBefore(endMoment)) {
          let startOfPeriod, endOfPeriod, label;

          switch (view) {
               case 'year':
                    startOfPeriod = current.startOf('month');
                    endOfPeriod = current.endOf('month');
                    label = startOfPeriod.format('MMMM');
                    current = endOfPeriod.clone().add(1, 'day');
                    break;
               case 'month':
                    startOfPeriod = current.startOf('day');
                    endOfPeriod = current.endOf('day');
                    label = startOfPeriod.format('YYYY-MM-DD');
                    current = endOfPeriod.clone().add(1, 'day');
                    break;
               case 'week':
                    startOfPeriod = current.startOf('day');
                    endOfPeriod = current.endOf('day');
                    label = startOfPeriod.format('YYYY-MM-DD');
                    current.add(1, 'day');
                    break;
               case 'day':
               default:
                    startOfPeriod = current.startOf('hour');
                    endOfPeriod = current.endOf('hour');
                    label = startOfPeriod.format('HH:00');
                    current.add(1, 'hour');
                    break;
          }

          // Avoid duplicate ranges
          if (
               ranges.length > 0 &&
               ranges[ranges.length - 1].start.getTime() === startOfPeriod.toDate().getTime()
          ) {
               continue;
          }

          ranges.push({
               label,
               start: startOfPeriod.toDate(),
               end: endOfPeriod.toDate(),
          });
     }

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Promise.all([
                    Subscription.aggregate([
                         { $match: { createdAt: range } },
                         { $group: { _id: null, total: { $sum: '$price' } } },
                    ]),
                    ViewHistory.aggregate([
                         { $match: { date: range } },
                         { $group: { _id: null, total: { $sum: '$count' } } },
                    ]),
                    MovieModel.countDocuments({
                         status: 'Ongoing',
                         createdAt: range,
                         isDeleted: false,
                    }),
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

async function getRevenueCustomRangeBreakdown(view: ViewType, startDate: Date, endDate: Date) {
     const startMoment = moment(startDate).utc();
     const endMoment = moment(endDate).utc();
     const ranges: { label: string; start: Date; end: Date }[] = [];
     let current = startMoment.clone();

     while (current.isSameOrBefore(endMoment)) {
          let startOfPeriod, endOfPeriod, label;

          switch (view) {
               case 'year':
                    startOfPeriod = current.startOf('month');
                    endOfPeriod = current.endOf('month');
                    label = startOfPeriod.format('MMMM');
                    current = endOfPeriod.clone().add(1, 'day');
                    break;
               case 'month':
                    startOfPeriod = current.startOf('day');
                    endOfPeriod = current.endOf('day');
                    label = startOfPeriod.format('YYYY-MM-DD');
                    current = endOfPeriod.clone().add(1, 'day');
                    break;
               case 'week':
                    startOfPeriod = current.startOf('day');
                    endOfPeriod = current.endOf('day');
                    label = startOfPeriod.format('YYYY-MM-DD');
                    current.add(1, 'day');
                    break;
               case 'day':
               default:
                    startOfPeriod = current.startOf('hour');
                    endOfPeriod = current.endOf('hour');
                    label = startOfPeriod.format('HH:00');
                    current.add(1, 'hour');
                    break;
          }

          // Avoid duplicate ranges
          if (
               ranges.length > 0 &&
               ranges[ranges.length - 1].start.getTime() === startOfPeriod.toDate().getTime()
          ) {
               continue;
          }

          ranges.push({
               label,
               start: startOfPeriod.toDate(),
               end: endOfPeriod.toDate(),
          });
     }

     const results = await Promise.all(
          ranges.map(({ start, end }) => {
               const range = { $gte: start, $lte: end };
               return Subscription.aggregate([
                    { $match: { createdAt: range } },
                    { $group: { _id: null, total: { $sum: '$price' } } },
               ]);
          }),
     );

     return ranges.map(({ label }, i) => ({
          period: label,
          revenue: results[i][0]?.total ?? 0,
     }));
}

function getRevenueBreakdown(
     view: ViewType,
     year: number,
     monthIndex: number,
     day?: number,
     customStartDate?: Date,
     customEndDate?: Date,
) {
     if (customStartDate && customEndDate) {
          return getRevenueCustomRangeBreakdown(view, customStartDate, customEndDate);
     }
     switch (view) {
          case 'year':
               return getRevenueYearlyBreakdown(year);
          case 'month':
               return getRevenueMonthlyBreakdown(year, monthIndex);
          case 'week':
               return getRevenueWeeklyBreakdown(year, monthIndex, day);
          case 'day':
               return getRevenueDailyBreakdown(year, monthIndex, day);
     }
}

const getRevenueData = async (query: Record<string, unknown>) => {
     const { view, year, monthIndex, day, startDate, endDate } = parseQueryParams(query);
     const {
          startDate: finalStartDate,
          endDate: finalEndDate,
          filterMeta,
     } = buildFilter(view, year, monthIndex, day, startDate, endDate);

     const unit =
          view === 'year' ? 'year' : view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
     const prevStartDate = moment(finalStartDate).subtract(1, unit).toDate();
     const prevEndDate = moment(finalEndDate).subtract(1, unit).toDate();

     const currRange = { $gte: finalStartDate, $lte: finalEndDate };
     const prevRange = { $gte: prevStartDate, $lte: prevEndDate };

     const [currRevenueRes, prevRevenueRes, totalRevenueRes, breakdown, packageWiseRevenue] =
          await Promise.all([
               Subscription.aggregate([
                    { $match: { createdAt: currRange } },
                    { $group: { _id: null, total: { $sum: '$price' } } },
               ]),
               Subscription.aggregate([
                    { $match: { createdAt: prevRange } },
                    { $group: { _id: null, total: { $sum: '$price' } } },
               ]),
               Subscription.aggregate([{ $group: { _id: null, total: { $sum: '$price' } } }]),
               getRevenueBreakdown(view, year, monthIndex, day, startDate, endDate),
               Subscription.aggregate([
                    { $match: { createdAt: currRange } },
                    {
                         $lookup: {
                              from: 'packages', // mongoose default collection name (lowercase + plural)
                              localField: 'package',
                              foreignField: '_id',
                              as: 'packageInfo',
                         },
                    },
                    { $unwind: { path: '$packageInfo', preserveNullAndEmptyArrays: true } },
                    {
                         $group: {
                              _id: {
                                   packageId: '$package',
                                   packageName: { $ifNull: ['$packageInfo.name', '$packageName'] },
                                   paymentType: '$packageInfo.paymentType', // Weekly / Monthly / Yearly
                              },
                              totalRevenue: { $sum: '$price' },
                              totalSubscriptions: { $sum: 1 },
                         },
                    },
                    {
                         $project: {
                              _id: 0,
                              packageId: '$_id.packageId',
                              packageName: '$_id.packageName',
                              paymentType: '$_id.paymentType',
                              totalRevenue: 1,
                              totalSubscriptions: 1,
                         },
                    },
                    { $sort: { totalRevenue: -1 } },
               ]),
          ]);

     // const currentRevenue = currRevenueRes[0]?.total ?? 0;
     // const previousRevenue = prevRevenueRes[0]?.total ?? 0;
     // const totalRevenue = totalRevenueRes[0]?.total ?? 0;

     return {
          filter: filterMeta,
          breakdown,
          packageWiseRevenue,
     };
};

export const DashboardService = {
     getOverview,
     getUserGrowth,
     getTopWatchedVideos,
     getProductionReportStats,
     getRevenueData,
};
