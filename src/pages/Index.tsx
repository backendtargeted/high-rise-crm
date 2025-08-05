import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Send, FileSignature, CheckCircle, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Index = () => {
  const [dashboardData, setDashboardData] = useState({
    fundedDeals: 0,
    appsSent: 0,
    appsSigned: 0,
    pendingApps: [],
    loading: true
  });
  
  const [selectedCompany, setSelectedCompany] = useState(null);

  const fetchDashboardData = async () => {
    try {
      // Fetch applications data with company and lead information
      const { data: applications } = await supabase
        .from('applications_tracking')
        .select(`
          application_id,
          application_status, 
          date_application_sent, 
          date_signed,
          created_at,
          leads (
            first_name,
            last_name,
            email,
            company_id,
            companies (
              name,
              industry,
              website
            )
          )
        `);

      const appsSent = applications?.filter(app => app.date_application_sent).length || 0;
      const appsSigned = applications?.filter(app => app.application_status === 'signed').length || 0;
      
      // Calculate pending apps (sent in last 7 days but not signed)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const pendingApps = applications?.filter(app => 
        app.date_application_sent && 
        new Date(app.date_application_sent) >= sevenDaysAgo && 
        app.application_status !== 'signed'
      ) || [];

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
              <CardContent className="p-0">
                {dashboardData.loading ? (
                  <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                    Loading...
                  </div>
                ) : dashboardData.pendingApps.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Sent Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData.pendingApps.map((app) => (
                          <TableRow 
                            key={app.application_id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedCompany(app.leads?.companies)}
                          >
                            <TableCell className="font-medium">
                              {app.leads?.companies?.name || 'Unknown Company'}
                            </TableCell>
                            <TableCell>
                              {app.leads?.first_name && app.leads?.last_name 
                                ? `${app.leads.first_name} ${app.leads.last_name}`
                                : app.leads?.email || 'Unknown Contact'
                              }
                            </TableCell>
                            <TableCell>
                              {app.date_application_sent 
                                ? new Date(app.date_application_sent).toLocaleDateString()
                                : 'N/A'
                              }
                            </TableCell>
                            <TableCell>
                              <span className="capitalize px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                                {app.application_status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                    No pending applications
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Company Details Modal */}
        <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {selectedCompany?.name || 'Company Details'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                  <p className="text-card-foreground">{selectedCompany?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Industry</label>
                  <p className="text-card-foreground">{selectedCompany?.industry || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Website</label>
                {selectedCompany?.website ? (
                  <p className="text-card-foreground">
                    <a 
                      href={selectedCompany.website.startsWith('http') 
                        ? selectedCompany.website 
                        : `https://${selectedCompany.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedCompany.website}
                    </a>
                  </p>
                ) : (
                  <p className="text-card-foreground">N/A</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
