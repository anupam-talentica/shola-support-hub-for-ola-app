export interface Order {
  id: string;
  customerPhone: string;
  customerName: string;
  customerEmail: string;
  scooterModel: string;
  orderDate: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  estimatedDelivery: string;
  shippingAddress: string;
  orderTotal: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

export const ORDER_STATUS_LABELS = {
  pending: 'Order Pending',
  confirmed: 'Order Confirmed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export const PAYMENT_STATUS_LABELS = {
  pending: 'Payment Pending',
  paid: 'Paid',
  refunded: 'Refunded'
};