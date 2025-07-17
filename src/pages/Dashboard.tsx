import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ticketService } from "@/services/ticketService";
import { userService } from "@/services/userService";
import type { SupportTicket } from "@/types/ticket";
import { Order, ORDER_STATUS_LABELS } from "@/types/order";
import { orderService } from "@/services/orderService";
import { 
  Phone, 
  LogOut, 
  MessageCircle, 
  FileText, 
  HelpCircle, 
  Settings,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Ticket,
  Package,
  BookOpen
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPhone, setUserPhone] = useState<string>("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<Order['status'] | 'all'>('all');

  useEffect(() => {
    const user = userService.getCurrentUser();
    
    if (user) {
      setIsAuthenticated(true);
      setUserPhone(user.phone);
      setIsAdmin(user.role === 'admin');
      // Load tickets based on user role
      loadTickets();
      loadOrders();
    } else {
      navigate('/');
    }
  }, [navigate]);

  const loadTickets = () => {
    const user = userService.getCurrentUser();
    if (user) {
      const userTickets = ticketService.getTicketsForUser(user.phone, user.role === 'admin');
      setTickets(userTickets);
    }
  };

  const loadOrders = () => {
    const user = userService.getCurrentUser();
    if (user) {
      if (user.role === 'admin') {
        const allOrders = orderService.getAllOrders();
        setOrders(allOrders);
      } else {
        const userOrders = orderService.getOrdersByPhone(user.phone);
        setOrders(userOrders);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userPhone');
    navigate('/');
    toast({
      title: "Logged out successfully",
      description: "You have been logged out."
    });
  };

  const quickActions = [
    {
      title: "Start Chat Support",
      description: "Get instant help with AI assistance",
      icon: MessageCircle,
      color: "bg-primary/10 text-primary",
      action: () => navigate('/chat')
    },
    {
      title: "View All Tickets",
      description: "Check all your support requests",
      icon: FileText,
      color: "bg-blue/10 text-blue",
      action: () => toast({ title: "All tickets", description: "View all tickets in the section below" })
    },
    {
      title: "Emergency Contact",
      description: "Get immediate assistance",
      icon: Phone,
      color: "bg-destructive/10 text-destructive",
      action: () => toast({ title: "Emergency", description: "Call 1800-123-4567 for immediate help" })
    },
    {
      title: "FAQ & Help",
      description: "Find answers to common questions",
      icon: HelpCircle,
      color: "bg-warning/10 text-warning",
      action: () => toast({ title: "Help", description: "Check the FAQ section below" })
    }
  ];

  const filteredTickets = tickets.filter(ticket => {
    if (ticketFilter === 'all') return true;
    return ticket.status === ticketFilter;
  });

  const recentTickets = filteredTickets.slice(0, 5);

  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter(order => order.status === orderFilter);

  const recentOrders = filteredOrders.slice(0, 5);

  const handleStatusChange = (ticketId: string, newStatus: SupportTicket['status']) => {
    ticketService.updateTicketStatus(ticketId, newStatus);
    loadTickets();
    toast({
      title: "Ticket updated",
      description: `Status changed to ${newStatus}`
    });
  };

  const handleOrderStatusChange = (orderId: string, newStatus: Order['status']) => {
    const success = orderService.updateOrderStatus(orderId, newStatus);
    if (success) {
      loadOrders();
      toast({
        title: "Order updated",
        description: `Status changed to ${ORDER_STATUS_LABELS[newStatus]}`
      });
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-success/10 text-success border-success/20">Resolved</Badge>;
      case 'open':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Open</Badge>;
      case 'in-progress':
        return <Badge className="bg-primary/10 text-primary border-primary/20">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: SupportTicket['category']) => {
    switch (category) {
      case 'battery': return <Zap className="h-4 w-4" />;
      case 'payment': return <FileText className="h-4 w-4" />;
      case 'technical': return <Settings className="h-4 w-4" />;
      case 'account': return <Settings className="h-4 w-4" />;
      case 'rides': return <MessageCircle className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getOrderStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      shipped: { variant: 'default' as const, color: 'bg-purple-100 text-purple-800' },
      out_for_delivery: { variant: 'default' as const, color: 'bg-orange-100 text-orange-800' },
      delivered: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      cancelled: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.color}>
        {ORDER_STATUS_LABELS[status]}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">SHOLA</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Welcome, +91 {userPhone}</p>
              {isAdmin && (
                <Badge variant="destructive" className="text-xs">Admin</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/queries')}>
                  <Ticket className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/knowledge')}>
                  <BookOpen className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Emergency Contact */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Emergency Support</h3>
                <p className="text-sm text-muted-foreground">24/7 helpline for urgent issues</p>
              </div>
              <Button size="sm" variant="destructive">
                Call Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Support Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              {isAdmin ? `All Support Tickets (${tickets.length})` : `My Support Tickets (${tickets.length})`}
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Button
                variant={ticketFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTicketFilter('all')}
              >
                All
              </Button>
              <Button
                variant={ticketFilter === 'open' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTicketFilter('open')}
              >
                Open
              </Button>
              <Button
                variant={ticketFilter === 'in-progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTicketFilter('in-progress')}
              >
                In Progress
              </Button>
              <Button
                variant={ticketFilter === 'resolved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTicketFilter('resolved')}
              >
                Resolved
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getCategoryIcon(ticket.category)}
                        <p className="font-medium">{ticket.title}</p>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>ID: {ticket.id}</span>
                        <span>Category: {ticket.category}</span>
                        {isAdmin && ticket.userPhone && (
                          <span>User: +91 {ticket.userPhone}</span>
                        )}
                        <span>{ticket.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      {getStatusBadge(ticket.status)}
                      {isAdmin && ticket.status !== 'resolved' && (
                        <div className="flex gap-1">
                          {ticket.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(ticket.id, 'in-progress')}
                            >
                              Start
                            </Button>
                          )}
                          {ticket.status === 'in-progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(ticket.id, 'resolved')}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {recentTickets.length === 0 && (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {ticketFilter === 'all' ? 'No support tickets yet' : `No ${ticketFilter} tickets`}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => navigate('/chat')}
                  >
                    Start a conversation to create tickets
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {isAdmin ? `All Orders (${orders.length})` : `My Orders (${orders.length})`}
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Button
                variant={orderFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderFilter('all')}
              >
                All
              </Button>
              <Button
                variant={orderFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={orderFilter === 'shipped' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderFilter('shipped')}
              >
                Shipped
              </Button>
              <Button
                variant={orderFilter === 'delivered' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderFilter('delivered')}
              >
                Delivered
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4" />
                        <p className="font-medium">{order.id}</p>
                        <span className="text-sm text-muted-foreground">
                          ${order.orderTotal}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{order.scooterModel}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {isAdmin ? `Customer: ${order.customerName} (${order.customerPhone})` : order.shippingAddress}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Order: {order.orderDate}</span>
                        <span>Expected: {order.estimatedDelivery}</span>
                        {order.trackingNumber && (
                          <span>Tracking: {order.trackingNumber}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      {getOrderStatusBadge(order.status)}
                      {isAdmin && (
                        <div className="flex gap-1">
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOrderStatusChange(order.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                          )}
                          {order.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOrderStatusChange(order.id, 'shipped')}
                            >
                              Ship
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOrderStatusChange(order.id, 'out_for_delivery')}
                            >
                              Out for Delivery
                            </Button>
                          )}
                          {order.status === 'out_for_delivery' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOrderStatusChange(order.id, 'delivered')}
                            >
                              Mark Delivered
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {orderFilter === 'all' ? 'No orders yet' : `No ${orderFilter} orders`}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => navigate('/chat')}
                  >
                    Ask about order status in chat
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start h-auto p-3" onClick={() => toast({ title: "FAQ", description: "To start a ride, scan the QR code on the scooter and follow app instructions." })}>
                <div className="text-left">
                  <p className="font-medium">How to start a ride?</p>
                  <p className="text-sm text-muted-foreground">Learn about starting your electric scooter ride</p>
                </div>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-3" onClick={() => toast({ title: "FAQ", description: "Battery range is typically 15-25 km per charge depending on terrain and rider weight." })}>
                <div className="text-left">
                  <p className="font-medium">What's the battery range?</p>
                  <p className="text-sm text-muted-foreground">Check battery performance and range</p>
                </div>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-3" onClick={() => toast({ title: "FAQ", description: "Payment is processed automatically after each ride. You can add money to wallet or link cards." })}>
                <div className="text-left">
                  <p className="font-medium">How does payment work?</p>
                  <p className="text-sm text-muted-foreground">Understand payment processing</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;