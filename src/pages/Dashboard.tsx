import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  FileText, 
  MapPin, 
  Phone, 
  Settings, 
  LogOut,
  AlertCircle,
  CheckCircle,
  Clock,
  Headphones
} from "lucide-react";

const Dashboard = () => {
  const [userPhone, setUserPhone] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    const phone = localStorage.getItem('userPhone');
    
    if (!isAuth) {
      navigate('/login');
      return;
    }
    
    if (phone) {
      setUserPhone(phone);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userPhone');
    navigate('/');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const quickActions = [
    {
      title: "Report an Issue",
      description: "Report a problem with your ride or service",
      icon: AlertCircle,
      color: "bg-destructive/10 text-destructive",
      action: () => toast({ title: "Feature Coming Soon", description: "Issue reporting will be available soon" })
    },
    {
      title: "Track Service Request",
      description: "Check the status of your support tickets",
      icon: Clock,
      color: "bg-warning/10 text-warning",
      action: () => toast({ title: "Feature Coming Soon", description: "Service tracking will be available soon" })
    },
    {
      title: "Find Service Center",
      description: "Locate nearest OLA service center",
      icon: MapPin,
      color: "bg-success/10 text-success",
      action: () => toast({ title: "Feature Coming Soon", description: "Service center locator will be available soon" })
    },
    {
      title: "Live Chat Support",
      description: "Chat with our support team",
      icon: Headphones,
      color: "bg-primary/10 text-primary",
      action: () => navigate('/chat')
    }
  ];

  const recentTickets = [
    {
      id: "TICKET-001",
      title: "Payment Issue",
      status: "resolved",
      date: "2 days ago"
    },
    {
      id: "TICKET-002", 
      title: "Ride Cancellation",
      status: "pending",
      date: "5 days ago"
    },
    {
      id: "TICKET-003",
      title: "App Not Working",
      status: "in-progress",
      date: "1 week ago"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-success/10 text-success border-success/20">Resolved</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case 'in-progress':
        return <Badge className="bg-primary/10 text-primary border-primary/20">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">SHOLA</h1>
            <p className="text-sm text-muted-foreground">Welcome, +91 {userPhone}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/queries')}>
              <Settings className="h-4 w-4" />
            </Button>
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

        {/* Recent Support Tickets */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Support Tickets</h2>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{ticket.title}</h3>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>{ticket.id}</span>
                        <span>•</span>
                        <span>{ticket.date}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start h-auto p-3" onClick={() => toast({ title: "FAQ", description: "How to cancel a ride: Go to your ride history and select cancel" })}>
                <div className="text-left">
                  <p className="font-medium">How to cancel a ride?</p>
                  <p className="text-sm text-muted-foreground">Learn about ride cancellation policy</p>
                </div>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-3" onClick={() => toast({ title: "FAQ", description: "Refunds are processed within 3-5 business days" })}>
                <div className="text-left">
                  <p className="font-medium">When will I get my refund?</p>
                  <p className="text-sm text-muted-foreground">Check refund processing times</p>
                </div>
              </Button>
              <Button variant="ghost" className="w-full justify-start h-auto p-3" onClick={() => toast({ title: "FAQ", description: "Update your profile in the app settings" })}>
                <div className="text-left">
                  <p className="font-medium">How to update my profile?</p>
                  <p className="text-sm text-muted-foreground">Manage your account information</p>
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