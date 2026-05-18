export const buildCategoryFilter = (query: TMovieQuery): Record<string, unknown> => {
     const raw = query?.category;
     if (!raw) return {};

     const categories = (Array.isArray(raw) ? raw : [raw])
          .flatMap((c) => String(c).split(','))
          .map((c) => c.trim())
          .filter(Boolean);

     if (categories.length === 0) return {};
     if (categories.length === 1) return { category: categories[0] };
     return { category: { $in: categories } };
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
     search?: string;
     category?: string | string[];
     filter?: 'today' | 'week' | 'month';
     [key: string]: unknown;
};
