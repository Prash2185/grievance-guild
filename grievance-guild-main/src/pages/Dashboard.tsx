import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, Clock, CheckCircle2, XCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Grievance {
  id: string;
  grievance_id: string;
  title: string;
  category: string;
  subcategory: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, signOut, loading } = useAuth();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loadingGrievances, setLoadingGrievances] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    if (!loading && (!user || userRole === "admin")) {
      navigate("/auth");
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchGrievances();
    }
  }, [user]);

  const fetchGrievances = async () => {
    try {
      const { data, error } = await supabase
        .from("grievances")
        .select("*")
        .eq("submitted_by", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setGrievances(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const inProgress = data?.filter(g => g.status === "In Progress").length || 0;
      const resolved = data?.filter(g => g.status === "Resolved").length || 0;
      
      setStats({ total, inProgress, resolved });
    } catch (error: any) {
      toast({
        title: "Error fetching grievances",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingGrievances(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Submitted":
        return <Clock className="w-4 h-4" />;
      case "In Progress":
        return <FileText className="w-4 h-4" />;
      case "Resolved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "Closed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading || loadingGrievances) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {userRole || 'User'}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Grievances</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl text-warning">{stats.inProgress}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Resolved</CardDescription>
              <CardTitle className="text-3xl text-success">{stats.resolved}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg. Resolution</CardDescription>
              <CardTitle className="text-3xl">5 days</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate("/submit-grievance")}
            size="lg"
            className="w-full sm:w-auto"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Submit New Grievance
          </Button>
        </div>

        {/* Grievances List */}
        <Card>
          <CardHeader>
            <CardTitle>My Grievances</CardTitle>
            <CardDescription>Track the status of your submitted grievances</CardDescription>
          </CardHeader>
          <CardContent>
            {grievances.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No grievances yet</h3>
                <p className="text-muted-foreground mb-4">Submit your first grievance to get started</p>
                <Button onClick={() => navigate("/submit-grievance")}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Submit Grievance
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {grievances.map((grievance) => (
                  <div
                    key={grievance.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-semibold text-primary">
                            {grievance.grievance_id}
                          </span>
                          <Badge className={getStatusColor(grievance.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(grievance.status)}
                              {grievance.status}
                            </span>
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{grievance.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Category: {grievance.category}</span>
                          <span>•</span>
                          <span>{new Date(grievance.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
