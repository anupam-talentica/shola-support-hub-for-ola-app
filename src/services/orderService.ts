import { Order } from '@/types/order';

// Mock order data
const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    customerPhone: '+1234567890',
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    scooterModel: 'EcoRide Pro 2024',
    orderDate: '2024-01-15',
    status: 'shipped',
    trackingNumber: 'TRK123456789',
    estimatedDelivery: '2024-01-20',
    shippingAddress: '123 Main St, New York, NY 10001',
    orderTotal: 1299.99,
    paymentStatus: 'paid'
  },
  {
    id: 'ORD-002',
    customerPhone: '+1234567891',
    customerName: 'Jane Smith',
    customerEmail: 'jane.smith@example.com',
    scooterModel: 'EcoRide Lite 2024',
    orderDate: '2024-01-18',
    status: 'out_for_delivery',
    trackingNumber: 'TRK987654321',
    estimatedDelivery: '2024-01-19',
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90210',
    orderTotal: 899.99,
    paymentStatus: 'paid'
  },
  {
    id: 'ORD-003',
    customerPhone: '+1234567892',
    customerName: 'Mike Johnson',
    customerEmail: 'mike.johnson@example.com',
    scooterModel: 'EcoRide Max 2024',
    orderDate: '2024-01-16',
    status: 'delivered',
    trackingNumber: 'TRK456789123',
    estimatedDelivery: '2024-01-18',
    shippingAddress: '789 Pine St, Chicago, IL 60601',
    orderTotal: 1599.99,
    paymentStatus: 'paid'
  },
  {
    id: 'ORD-004',
    customerPhone: '+1234567893',
    customerName: 'Sarah Wilson',
    customerEmail: 'sarah.wilson@example.com',
    scooterModel: 'EcoRide Pro 2024',
    orderDate: '2024-01-19',
    status: 'confirmed',
    estimatedDelivery: '2024-01-25',
    shippingAddress: '321 Elm St, Miami, FL 33101',
    orderTotal: 1299.99,
    paymentStatus: 'paid'
  },
  {
    id: 'ORD-005',
    customerPhone: '+1234567894',
    customerName: 'Tom Brown',
    customerEmail: 'tom.brown@example.com',
    scooterModel: 'EcoRide Lite 2024',
    orderDate: '2024-01-20',
    status: 'pending',
    estimatedDelivery: '2024-01-28',
    shippingAddress: '654 Maple Dr, Seattle, WA 98101',
    orderTotal: 899.99,
    paymentStatus: 'pending'
  }
];

let orders: Order[] = [...MOCK_ORDERS];

export const orderService = {
  // Get all orders
  getAllOrders: (): Order[] => {
    return orders;
  },

  // Get orders by customer phone
  getOrdersByPhone: (phone: string): Order[] => {
    return orders.filter(order => order.customerPhone === phone);
  },

  // Get order by ID
  getOrderById: (orderId: string): Order | null => {
    return orders.find(order => order.id === orderId) || null;
  },

  // Update order status
  updateOrderStatus: (orderId: string, status: Order['status']): boolean => {
    const orderIndex = orders.findIndex(order => order.id === orderId);
    if (orderIndex !== -1) {
      orders[orderIndex] = { ...orders[orderIndex], status };
      return true;
    }
    return false;
  },

  // Search orders by various criteria
  searchOrders: (query: string): Order[] => {
    const lowerQuery = query.toLowerCase();
    return orders.filter(order => 
      order.id.toLowerCase().includes(lowerQuery) ||
      order.customerName.toLowerCase().includes(lowerQuery) ||
      order.customerEmail.toLowerCase().includes(lowerQuery) ||
      order.trackingNumber?.toLowerCase().includes(lowerQuery) ||
      order.scooterModel.toLowerCase().includes(lowerQuery)
    );
  },

  // Get order status message for chat
  getOrderStatusMessage: (order: Order): string => {
    const statusMessages = {
      pending: `Your order ${order.id} for ${order.scooterModel} is pending confirmation. Expected delivery: ${order.estimatedDelivery}`,
      confirmed: `Great news! Your order ${order.id} for ${order.scooterModel} has been confirmed. Expected delivery: ${order.estimatedDelivery}`,
      shipped: `Your order ${order.id} has been shipped! Tracking number: ${order.trackingNumber}. Expected delivery: ${order.estimatedDelivery}`,
      out_for_delivery: `Your order ${order.id} is out for delivery! You should receive it today.`,
      delivered: `Your order ${order.id} for ${order.scooterModel} has been delivered. We hope you enjoy your new scooter!`,
      cancelled: `Your order ${order.id} has been cancelled. If you have questions, please contact our support team.`
    };
    return statusMessages[order.status];
  }
};