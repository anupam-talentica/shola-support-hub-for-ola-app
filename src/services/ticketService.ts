import { SupportTicket, TicketFilters } from '@/types/ticket';

class TicketService {
  private readonly STORAGE_KEY = 'supportTickets';

  generateTicketId(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `SCT-${dateStr}-${random}`;
  }

  categorizeFromMessage(message: string): SupportTicket['category'] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('battery') || lowerMessage.includes('charge') || lowerMessage.includes('power')) {
      return 'battery';
    }
    if (lowerMessage.includes('payment') || lowerMessage.includes('money') || lowerMessage.includes('refund') || lowerMessage.includes('billing')) {
      return 'payment';
    }
    if (lowerMessage.includes('app') || lowerMessage.includes('technical') || lowerMessage.includes('bug') || lowerMessage.includes('error')) {
      return 'technical';
    }
    if (lowerMessage.includes('account') || lowerMessage.includes('profile') || lowerMessage.includes('login')) {
      return 'account';
    }
    if (lowerMessage.includes('ride') || lowerMessage.includes('trip') || lowerMessage.includes('unlock') || lowerMessage.includes('scooter')) {
      return 'rides';
    }
    
    return 'other';
  }

  determinePriority(message: string): SupportTicket['priority'] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('urgent') || lowerMessage.includes('emergency') || lowerMessage.includes('stuck') || lowerMessage.includes('accident')) {
      return 'high';
    }
    if (lowerMessage.includes('important') || lowerMessage.includes('asap') || lowerMessage.includes('quickly')) {
      return 'medium';
    }
    
    return 'low';
  }

  createTicket(data: Partial<SupportTicket>): SupportTicket {
    const ticket: SupportTicket = {
      id: this.generateTicketId(),
      title: data.title || 'Support Request',
      description: data.description || '',
      status: 'open',
      priority: data.priority || 'medium',
      category: data.category || 'other',
      createdAt: new Date(),
      updatedAt: new Date(),
      userEmail: data.userEmail || '',
      userPhone: data.userPhone,
      originalMessage: data.originalMessage
    };

    const tickets = this.getAllTickets();
    tickets.unshift(ticket);
    this.saveTickets(tickets);

    return ticket;
  }

  getAllTickets(): SupportTicket[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      return JSON.parse(stored).map((ticket: any) => ({
        ...ticket,
        createdAt: new Date(ticket.createdAt),
        updatedAt: new Date(ticket.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading tickets:', error);
      return [];
    }
  }

  getTicketById(id: string): SupportTicket | undefined {
    return this.getAllTickets().find(ticket => ticket.id === id);
  }

  updateTicketStatus(id: string, status: SupportTicket['status']): void {
    const tickets = this.getAllTickets();
    const ticketIndex = tickets.findIndex(ticket => ticket.id === id);
    
    if (ticketIndex !== -1) {
      tickets[ticketIndex].status = status;
      tickets[ticketIndex].updatedAt = new Date();
      this.saveTickets(tickets);
    }
  }

  filterTickets(tickets: SupportTicket[], filters: TicketFilters): SupportTicket[] {
    return tickets.filter(ticket => {
      if (filters.status && ticket.status !== filters.status) return false;
      if (filters.category && ticket.category !== filters.category) return false;
      if (filters.priority && ticket.priority !== filters.priority) return false;
      return true;
    });
  }

  getTicketStats(): { total: number; open: number; inProgress: number; resolved: number } {
    const tickets = this.getAllTickets();
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length
    };
  }

  private saveTickets(tickets: SupportTicket[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tickets));
  }

  // Migration function to convert old UnresolvedQuery format
  migrateFromUnresolvedQueries(): void {
    try {
      const oldQueries = localStorage.getItem('unresolvedQueries');
      if (!oldQueries) return;

      const queries = JSON.parse(oldQueries);
      const existingTickets = this.getAllTickets();
      
      // Only migrate if no tickets exist yet
      if (existingTickets.length === 0) {
        const migratedTickets = queries.map((query: any) => ({
          id: this.generateTicketId(),
          title: query.query?.substring(0, 50) + '...' || 'Migrated Query',
          description: query.query || query.originalMessage || '',
          status: 'open' as const,
          priority: 'medium' as const,
          category: this.categorizeFromMessage(query.query || query.originalMessage || ''),
          createdAt: new Date(query.timestamp || Date.now()),
          updatedAt: new Date(query.timestamp || Date.now()),
          userEmail: query.userEmail || '',
          originalMessage: query.originalMessage
        }));

        this.saveTickets(migratedTickets);
        
        // Clear old storage
        localStorage.removeItem('unresolvedQueries');
      }
    } catch (error) {
      console.error('Error migrating queries:', error);
    }
  }
}

export const ticketService = new TicketService();