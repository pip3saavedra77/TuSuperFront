import { User } from './auth.models';

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY_FOR_DISPATCH = 'READY_FOR_DISPATCH',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface Order {
  id: number;
  customerId: number;
  customer: User;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  deliveryNotes: string | null;
  totalAmount: number;
  deliveryFee: number;
  contactPhone: string;
  cashChangeRequested: number | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaginationParams {
  [key: string]: string | number | undefined;
  limit?: number;
  offset?: number;
}

export interface OrderFilterParams extends PaginationParams {
  status?: OrderStatus;
  customerId?: number;
  startDate?: string;
  endDate?: string;
}

export const ORDER_TRANSITIONS: ReadonlyMap<OrderStatus, readonly OrderStatus[]> =
  new Map<OrderStatus, readonly OrderStatus[]>([
    [OrderStatus.PENDING, [OrderStatus.PREPARING, OrderStatus.CANCELLED]],
    [OrderStatus.PREPARING, [OrderStatus.READY_FOR_DISPATCH, OrderStatus.CANCELLED]],
    [OrderStatus.READY_FOR_DISPATCH, [OrderStatus.DISPATCHED, OrderStatus.CANCELLED]],
    [OrderStatus.DISPATCHED, [OrderStatus.DELIVERED, OrderStatus.CANCELLED]],
    [OrderStatus.DELIVERED, []],
    [OrderStatus.CANCELLED, []],
  ]);

export const ORDER_STATUS_LABELS: Readonly<Record<OrderStatus, string>> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.READY_FOR_DISPATCH]: 'Listo para despacho',
  [OrderStatus.DISPATCHED]: 'Despachado',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado',
};

export function getValidTransitions(status: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS.get(status) ?? [];
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return getValidTransitions(status).length === 0;
}
