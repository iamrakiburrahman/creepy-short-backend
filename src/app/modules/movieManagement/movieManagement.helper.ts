export const buildCategoryFilter = (query: TMovieQuery): Record<string, unknown> => {
     const filter: Record<string, unknown> = {};
     const rawCat = query?.categories;
     if (rawCat) {
          const categories = (Array.isArray(rawCat) ? rawCat : [rawCat])
               .flatMap((c) => String(c).split(','))
               .map((c) => c.trim())
               .filter(Boolean);

          if (categories.length === 1) {
               filter.categories = categories[0];
          } else if (categories.length > 1) {
               filter.categories = { $in: categories };
          }
     }
     const rawSub = query?.subCategories;
     if (rawSub) {
          const subCategories = (Array.isArray(rawSub) ? rawSub : [rawSub])
               .flatMap((s) => String(s).split(','))
               .map((s) => s.trim())
               .filter(Boolean);

          if (subCategories.length === 1) {
               filter.subCategories = subCategories[0];
          } else if (subCategories.length > 1) {
               filter.subCategories = { $in: subCategories };
          }
     }

     return filter;
};

export const getPaginationParams = (query: TMovieQuery) => {
     const page = Math.max(1, Number(query.page) || 1);
     const limit = Math.max(1, Number(query.limit) || 10);
     const skip = (page - 1) * limit;
     return { page, limit, skip };
};

// e.g. "-releaseDate,totalViews" → { releaseDate: -1, totalViews: 1 }
export const getSortParam = (query: TMovieQuery): Record<string, 1 | -1> => {
     const sort = query.sort as string;
     if (!sort) return { createdAt: -1 };

     return sort.split(',').reduce<Record<string, 1 | -1>>((acc, field) => {
          const trimmed = field.trim();
          if (trimmed.startsWith('-')) {
               acc[trimmed.slice(1)] = -1;
          } else {
               acc[trimmed] = 1;
          }
          return acc;
     }, {});
};

// e.g. "title,thumbnail,rating" → { title: 1, thumbnail: 1, rating: 1 }
export const getFieldsParam = (query: TMovieQuery): Record<string, 1> | null => {
     const fields = query.fields as string;
     if (!fields) return null;

     return fields.split(',').reduce<Record<string, 1>>((acc, field) => {
          acc[field.trim()] = 1;
          return acc;
     }, {});
};

export const buildMeta = (page: number, limit: number, total: number): TMeta => {
     const totalPage = Math.max(1, Math.ceil(total / limit));
     return {
          page,
          limit,
          total,
          totalPage,
     };
};
export type TMeta = {
     limit: number;
     page: number;
     total: number;
     totalPage: number;
};

export type TMovieQuery = {
     page?: string | number;
     limit?: string | number;
     sort?: string;
     fields?: string;
     searchTerm?: string;
     categories?: string | string[];
     subCategories?: string | string[]; // ← new
     filter?: 'today' | 'week' | 'month';
     [key: string]: unknown;
};
