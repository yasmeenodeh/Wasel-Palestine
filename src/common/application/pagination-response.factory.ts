export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T;
  meta: PaginationMeta;
};

export class PaginationResponseFactory {
  static create<T>(data: T, page: number, limit: number, total: number): PaginatedResponse<T> {
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
