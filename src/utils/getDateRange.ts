export const getDateRange = (filter: 'today' | 'week' | 'month') => {
     const now = new Date();
     let startDate: Date;

     switch (filter) {
          case 'today':
               startDate = new Date(now.setHours(0, 0, 0, 0));
               const endDate = new Date(now.setHours(23, 59, 59, 999));
               return { $gte: startDate, $lte: endDate };

          case 'week':
               startDate = new Date();
               startDate.setDate(startDate.getDate() - 7);
               return { $gte: startDate };

          case 'month':
               startDate = new Date();
               startDate.setMonth(startDate.getMonth() - 1);
               return { $gte: startDate };

          default:
               return {};
     }
};
