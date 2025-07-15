export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  category: 'battery' | 'payment' | 'technical' | 'account' | 'rides' | 'other';
  createdAt: Date;
  updatedAt: Date;
  userEmail: string;
  userPhone?: string;
  originalMessage?: string;
}

export interface TicketFilters {
  status?: SupportTicket['status'];
  category?: SupportTicket['category'];
  priority?: SupportTicket['priority'];
}