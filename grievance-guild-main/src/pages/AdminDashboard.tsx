import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, FileText, Clock, CheckCircle2, Users, LogOut, Search, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { GrievanceStatus } from "@/lib/supabase";

interface Grievance {
  id: string;
  grievance_id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
    user_id_number: string;
    department: string;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, signOut, loading } = useAuth();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loadingGrievances, setLoadingGrievances] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && (!user || userRole !== "admin")) {
      navigate("/auth");
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && userRole === "admin") {
      fetchGrievances();
    }
  }, [user, userRole]);

  const fetchGrievances = async () => {
    try {
      const { data, error } = await supabase
        .from("grievances")
        .select(`
          *,
          profiles!grievances_submitted_by_fkey (
            full_name,
            user_id_number,
            department
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGrievances(data || []);
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

  const updateGrievanceStatus = async (grievanceId: string, newStatus: GrievanceStatus) => {
    try {
      const { error } = await supabase
        .from("grievances")
        .update({ status: newStatus })
        .eq("id", grievanceId);

      if (error) throw error;

      // Update local state
      setGrievances(prev =>
        prev.map(g =>
          g.id === grievanceId ? { ...g, status: newStatus } : g
        )
      );

      toast({
        title: "Status updated",
        description: `Grievance status changed to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
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

  const filteredGrievances = grievances.filter((g) => {
    const matchesCategory = filterCategory === "all" || g.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesStatus = filterStatus === "all" || g.status.toLowerCase().replace(" ", "-") === filterStatus;
    const matchesSearch = searchQuery === "" || 
      g.grievance_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const stats = {
    total: grievances.length,
    pending: grievances.filter(g => g.status === "Submitted").length,
    inProgress: grievances.filter(g => g.status === "In Progress").length,
    resolved: grievances.filter(g => g.status === "Resolved").length,
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
      <header className="bg-gradient-primary text-primary-foreground shadow-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-primary-foreground/80 mt-1">Grievance Management System</p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="grievances" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="grievances">Grievances</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Grievances Tab */}
          <TabsContent value="grievances" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Grievances</CardDescription>
                  <CardTitle className="text-3xl">{stats.total}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Pending</CardDescription>
                  <CardTitle className="text-3xl text-warning">{stats.pending}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>In Progress</CardDescription>
                  <CardTitle className="text-3xl text-accent">{stats.inProgress}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Resolved</CardDescription>
                  <CardTitle className="text-3xl text-success">{stats.resolved}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>All Grievances</CardTitle>
                <CardDescription>Manage and resolve student and faculty grievances</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by ID, title, or name..." 
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="facility">Facility</SelectItem>
                      <SelectItem value="examination">Examination</SelectItem>
                      <SelectItem value="placement">Placement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Grievances List */}
                <div className="space-y-3">
                  {filteredGrievances.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No grievances found</p>
                    </div>
                  ) : (
                    filteredGrievances.map((grievance) => (
                      <div
                        key={grievance.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-sm font-semibold text-primary">
                                {grievance.grievance_id}
                              </span>
                              <Badge className={getStatusColor(grievance.status)}>
                                {grievance.status}
                              </Badge>
                              <Badge variant="outline">{grievance.category}</Badge>
                            </div>
                            <h3 className="font-semibold text-lg mb-1">{grievance.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>By: {grievance.profiles?.full_name} ({grievance.profiles?.user_id_number})</span>
                              <span>•</span>
                              <span>{grievance.profiles?.department}</span>
                              <span>•</span>
                              <span>{new Date(grievance.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {/* Status Change Dropdown */}
                          <div className="flex items-center gap-2">
                            <Select
                              value={grievance.status}
                              onValueChange={(value: GrievanceStatus) => updateGrievanceStatus(grievance.id, value)}
                            >
                              <SelectTrigger className="w-40">
                                <div className="flex items-center gap-2">
                                  <RefreshCw className="w-4 h-4" />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Submitted">Submitted</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Grievances by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["Academic", "Facility", "Examination", "Placement", "Other"].map(cat => {
                      const count = grievances.filter(g => g.category === cat).length;
                      return (
                        <div key={cat} className="flex justify-between items-center">
                          <span className="text-sm">{cat}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Average Resolution Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2">4.5 days</div>
                  <p className="text-sm text-muted-foreground">
                    Based on resolved grievances
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Resolution Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2">
                    {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Grievances resolved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Total Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2">{stats.total}</div>
                  <p className="text-sm text-muted-foreground">
                    All time grievances
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>Manage students, faculty, and admin accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  User management interface - coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
