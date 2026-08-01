export interface DashboardSummary {
  totalBooks: number;
  stockAvailable: number;
  lowStockCount: number;
  salesToday: number;
  salesThisMonth: number;
}

export interface SalesByDate {
  period: string;
  total: number;
  salesCount: number;
}

export interface TopSellingBook {
  bookId: number;
  bookTitle: string;
  bookIsbn: string;
  quantitySold: number;
  totalRevenue: number;
}
