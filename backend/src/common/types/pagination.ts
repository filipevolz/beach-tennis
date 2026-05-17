export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DiscoveryQuery {
  latitude: number;
  longitude: number;
  radiusKm: number;
  page?: number;
  pageSize?: number;
}
