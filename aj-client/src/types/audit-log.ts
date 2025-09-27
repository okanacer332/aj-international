export type AuditLog = {
  id: string;
  timestamp: string; // Backend'den ISO formatında string olarak gelecek
  username: string;
  action: string;
  details: string;
  ipAddress: string;
};

// Backend'in Pageable yanıtına uygun bir tip
export type PaginatedResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};