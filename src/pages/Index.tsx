import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Send, FileSignature, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Index = () => {
  const [dashboardData, setDashboardData] = useState({
    fundedDeals: 0,
    appsSent: 0,
    appsSigned: 0,
    pendingApps: 0,
    loading: true
  });

  const fetchDashboardData = async () => {
    try {
      // Fetch applications data
      const { data: applications } = await supabase
        .from('applications_tracking')
        .select('application_status, date_application_sent, date_signed');

      const appsSent = applications?.filter(app => app.date_application_sent).length || 0;
      const appsSigned = applications?.filter(app => app.application_status === 'signed').length || 0;
      
      // Calculate pending apps (sent in last 7 days but not signed)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const pendingApps = applications?.filter(app => 
        app.date_application_sent && 
        new Date(app.date_application_sent) >= sevenDaysAgo && 
        app.application_status !== 'signed'
      ).length || 0;

      // For now, set funded deals to 0 as we don't have this data yet
      const fundedDeals = 0;

      setDashboardData({
        fundedDeals,
        appsSent,
        appsSigned,
        pendingApps,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Today's tasks - Large left card */}
          <Card className="lg:col-span-1 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-card-foreground">
                Today's tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
              <div className="text-muted-foreground text-sm">
                No tasks scheduled
              </div>
            </CardContent>
          </Card>

          {/* Right side metrics */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top row metrics */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Funded Deals $$
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">
                  {dashboardData.loading ? '...' : `$${dashboardData.fundedDeals.toLocaleString()}`}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Apps Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">
                  {dashboardData.loading ? '...' : dashboardData.appsSent}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
                  <FileSignature className="h-4 w-4" />
                  Apps Signed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">
                  {dashboardData.loading ? '...' : dashboardData.appsSigned}
                </div>
              </CardContent>
            </Card>

            {/* Bottom larger card spanning 3 columns */}
            <Card className="md:col-span-3 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-card-foreground flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Sent last 7 days not signed
                </CardTitle>
              </CardHeader>
              <CardContent className="h-32 flex items-center justify-center">
                {dashboardData.loading ? (
                  <div className="text-muted-foreground text-sm">Loading...</div>
                ) : dashboardData.pendingApps > 0 ? (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-card-foreground mb-2">
                      {dashboardData.pendingApps}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      applications pending signature
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    No pending applications
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
