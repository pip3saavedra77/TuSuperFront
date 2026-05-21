export interface CategoryDistributionItem {
  name: string;
  value: number;
}

export interface DashboardStats {
  pendingOrders: number;
  totalProducts: number;
  lowStock: number;
  salesFlow: number[];
  categoryDistribution: CategoryDistributionItem[];
}
