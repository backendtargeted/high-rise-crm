import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Target, Building } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalApplications: 0,
    totalCompanies: 0,
    conversionRate: 0
  });
  
  const [statusData, setStatusData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      // Fetch basic stats
      const [leadsRes, appsRes, companiesRes] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('applications_tracking').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true })
      ]);

      const totalLeads = leadsRes.count || 0;
      const totalApplications = appsRes.count || 0;
      const totalCompanies = companiesRes.count || 0;
      const conversionRate = totalLeads > 0 ? (totalApplications / totalLeads) * 100 : 0;

      setStats({
        totalLeads,
        totalApplications,
        totalCompanies,
        conversionRate
      });

      // Fetch application status distribution
      const { data: statusData } = await supabase
        .from('applications_tracking')
        .select('application_status');

      const statusCounts = statusData?.reduce((acc: any, app) => {
        acc[app.application_status] = (acc[app.application_status] || 0) + 1;
        return acc;
      }, {});

      const statusChartData = Object.entries(statusCounts || {}).map(([status, count]) => ({
        name: status,
        value: count,
        color: getStatusColor(status)
      }));

      setStatusData(statusChartData);

      // Fetch application type distribution
      const { data: typeData } = await supabase
        .from('applications_tracking')
        .select('type');

      const typeCounts = typeData?.reduce((acc: any, app) => {
        acc[app.type] = (acc[app.type] || 0) + 1;
        return acc;
      }, {});

      const typeChartData = Object.entries(typeCounts || {}).map(([type, count]) => ({
        name: type,
        count
      }));

      setTypeData(typeChartData);

      // Fetch monthly application data
      const { data: monthlyData } = await supabase
        .from('applications_tracking')
        .select('created_at')
        .order('created_at');

      const monthlyCounts = monthlyData?.reduce((acc: any, app) => {
        const month = new Date(app.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const monthlyChartData = Object.entries(monthlyCounts || {}).map(([month, count]) => ({
        month,
        applications: count
      }));

      setMonthlyData(monthlyChartData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return '#6B7280';
      case 'sent': return '#3B82F6';
      case 'responded': return '#10B981';
      case 'signed': return '#8B5CF6';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading analytics...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-slate-400">Track your CRM performance and insights</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-200">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalLeads}</div>
                <p className="text-xs text-slate-400">Prospects in database</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-200">Applications</CardTitle>
                <Target className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalApplications}</div>
                <p className="text-xs text-slate-400">Total applications sent</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-200">Companies</CardTitle>
                <Building className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalCompanies}</div>
                <p className="text-xs text-slate-400">Companies tracked</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-200">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-slate-400">Leads to applications</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Application Status Distribution</CardTitle>
                <CardDescription className="text-slate-400">Breakdown of application statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Application Types</CardTitle>
                <CardDescription className="text-slate-400">Distribution by communication method</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151', 
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }} 
                    />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Monthly Application Trend</CardTitle>
              <CardDescription className="text-slate-400">Applications created over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151', 
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="applications" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;