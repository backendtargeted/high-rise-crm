import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Node,
  Edge
} from '@xyflow/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Building, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import '@xyflow/react/dist/style.css';

const Pipeline = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalApplications: 0,
    totalCompanies: 0,
    conversionRate: 0
  });
  
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const initialNodes: Node[] = [
    {
      id: '1',
      position: { x: 100, y: 100 },
      data: { label: 'New Leads' },
      type: 'input',
      style: { backgroundColor: '#3B82F6', color: 'white', border: '2px solid #1E40AF' }
    },
    {
      id: '2',
      position: { x: 350, y: 100 },
      data: { label: 'Applications Created' },
      style: { backgroundColor: '#6B7280', color: 'white', border: '2px solid #374151' }
    },
    {
      id: '3',
      position: { x: 650, y: 100 },
      data: { label: 'Applications Sent' },
      style: { backgroundColor: '#F59E0B', color: 'white', border: '2px solid #D97706' }
    },
    {
      id: '4',
      position: { x: 950, y: 100 },
      data: { label: 'Responses Received' },
      style: { backgroundColor: '#10B981', color: 'white', border: '2px solid #047857' }
    },
    {
      id: '5',
      position: { x: 1250, y: 100 },
      data: { label: 'Contracts Signed' },
      type: 'output',
      style: { backgroundColor: '#8B5CF6', color: 'white', border: '2px solid #7C3AED' }
    },
    {
      id: '6',
      position: { x: 650, y: 250 },
      data: { label: 'Rejected Applications' },
      style: { backgroundColor: '#EF4444', color: 'white', border: '2px solid #DC2626' }
    }
  ];

  const initialEdges: Edge[] = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      animated: true,
      style: { stroke: '#3B82F6', strokeWidth: 3 }
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      animated: true,
      style: { stroke: '#F59E0B', strokeWidth: 3 }
    },
    {
      id: 'e3-4',
      source: '3',
      target: '4',
      animated: true,
      style: { stroke: '#10B981', strokeWidth: 3 }
    },
    {
      id: 'e4-5',
      source: '4',
      target: '5',
      animated: true,
      style: { stroke: '#8B5CF6', strokeWidth: 3 }
    },
    {
      id: 'e3-6',
      source: '3',
      target: '6',
      animated: true,
      style: { stroke: '#EF4444', strokeWidth: 2 }
    }
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

      const counts = statusData?.reduce((acc: any, app) => {
        acc[app.application_status] = (acc[app.application_status] || 0) + 1;
        return acc;
      }, {});

      setStatusCounts(counts || {});

      // Update nodes with actual data
      setNodes((nds) => nds.map((node) => {
        let count = 0;
        switch (node.id) {
          case '1':
            count = totalLeads;
            break;
          case '2':
            count = counts?.created || 0;
            break;
          case '3':
            count = counts?.sent || 0;
            break;
          case '4':
            count = counts?.responded || 0;
            break;
          case '5':
            count = counts?.signed || 0;
            break;
          case '6':
            count = counts?.rejected || 0;
            break;
        }
        return {
          ...node,
          data: {
            ...node.data,
            label: `${node.data.label}: ${count}`
          }
        };
      }));

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading pipeline...</div>
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
            <h1 className="text-3xl font-bold text-white mb-2">Sales Pipeline</h1>
            <p className="text-slate-400">Visual workflow of your sales process</p>
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

          {/* Pipeline Flow */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Sales Pipeline Flow</CardTitle>
              <CardDescription className="text-slate-400">Interactive visualization of your sales process</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: '500px' }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  fitView
                  attributionPosition="top-right"
                  style={{ backgroundColor: '#0F172A' }}
                >
                  <MiniMap 
                    zoomable 
                    pannable 
                    style={{ backgroundColor: '#1E293B' }}
                    nodeColor="#3B82F6"
                  />
                  <Controls style={{ backgroundColor: '#1E293B' }} />
                  <Background color="#374151" gap={16} />
                </ReactFlow>
              </div>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Card key={status} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-bold text-white">{count}</div>
                  <p className="text-xs text-slate-400 capitalize">{status}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pipeline;