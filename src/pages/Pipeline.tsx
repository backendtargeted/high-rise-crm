import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SalesStats {
  totalLeads: number;
  totalApplications: number;
  totalCompanies: number;
  conversionRate: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface Deal {
  application_id: number;
  application_status: string;
  type: string;
  created_at: string;
  date_application_sent?: string;
  leads: {
    first_name: string;
    last_name: string;
    email: string;
    companies: {
      name: string;
    };
  };
  users: {
    fullname: string;
  };
}

interface List {
  list_id: number;
  list_name: string;
}

const Pipeline = () => {
  const [salesStats, setSalesStats] = useState<SalesStats>({
    totalLeads: 0,
    totalApplications: 0,
    totalCompanies: 0,
    conversionRate: 0,
  });
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [selectedList, setSelectedList] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const statusColumns = [
    { id: 'created', title: 'Created', color: 'bg-muted/50 border-l-4 border-l-muted-foreground' },
    { id: 'sent', title: 'Sent', color: 'bg-accent/30 border-l-4 border-l-accent-foreground' },
    { id: 'viewed', title: 'Viewed', color: 'bg-primary/10 border-l-4 border-l-primary' },
    { id: 'signed', title: 'Signed', color: 'bg-secondary/50 border-l-4 border-l-secondary-foreground' },
    { id: 'funded', title: 'Funded', color: 'bg-accent/40 border-l-4 border-l-accent-foreground' },
    { id: 'closed', title: 'Closed', color: 'bg-destructive/10 border-l-4 border-l-destructive' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch basic counts
      const [leadsResult, applicationsResult, companiesResult] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('applications_tracking').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
      ]);

      const totalLeads = leadsResult.count || 0;
      const totalApplications = applicationsResult.count || 0;
      const totalCompanies = companiesResult.count || 0;
      const conversionRate = totalLeads > 0 ? (totalApplications / totalLeads) * 100 : 0;

      setSalesStats({
        totalLeads,
        totalApplications,
        totalCompanies,
        conversionRate: Math.round(conversionRate * 100) / 100,
      });

      // Fetch deals with relationships
      let dealsQuery = supabase
        .from('applications_tracking')
        .select(`
          *,
          leads (
            first_name,
            last_name,
            email,
            companies (
              name
            )
          ),
          users (
            fullname
          )
        `);

      if (selectedList !== 'all') {
        dealsQuery = dealsQuery.eq('list_id', parseInt(selectedList));
      }

      const { data: dealsData, error: dealsError } = await dealsQuery;

      if (dealsError) throw dealsError;

      const filteredDeals = dealsData?.filter(deal => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          deal.leads?.first_name?.toLowerCase().includes(searchLower) ||
          deal.leads?.last_name?.toLowerCase().includes(searchLower) ||
          deal.leads?.email?.toLowerCase().includes(searchLower) ||
          deal.leads?.companies?.name?.toLowerCase().includes(searchLower)
        );
      }) || [];

      setDeals(filteredDeals);

      // Calculate status counts from filtered deals
      const statusMap = filteredDeals.reduce((acc: { [key: string]: number }, deal) => {
        acc[deal.application_status] = (acc[deal.application_status] || 0) + 1;
        return acc;
      }, {});

      const statusCountsArray = Object.entries(statusMap).map(([status, count]) => ({
        status,
        count: count as number,
      }));

      setStatusCounts(statusCountsArray);

      // Fetch lists for filtering
      const { data: listsData } = await supabase
        .from('lists')
        .select('list_id, list_name')
        .order('list_name');

      setLists(listsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const dealId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    try {
      const { error } = await supabase
        .from('applications_tracking')
        .update({ application_status: newStatus })
        .eq('application_id', dealId);

      if (error) throw error;

      // Update local state
      setDeals(prevDeals => 
        prevDeals.map(deal => 
          deal.application_id === dealId 
            ? { ...deal, application_status: newStatus }
            : deal
        )
      );

      toast({
        title: "Success",
        description: "Deal status updated",
      });

    } catch (error) {
      console.error('Error updating deal status:', error);
      toast({
        title: "Error",
        description: "Failed to update deal status",
        variant: "destructive",
      });
    }
  };

  const getDealsForStatus = (status: string) => {
    return deals.filter(deal => deal.application_status === status);
  };

  useEffect(() => {
    fetchData();
  }, [selectedList, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading pipeline data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Deal Pipeline</h1>
          <p className="text-muted-foreground">Drag and drop deals to update their status</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesStats.totalLeads}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesStats.totalApplications}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesStats.totalCompanies}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesStats.conversionRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={selectedList} onValueChange={setSelectedList}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Filter by list" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lists</SelectItem>
              {lists.map((list) => (
                <SelectItem key={list.list_id} value={list.list_id.toString()}>
                  {list.list_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Kanban Board */}
        <Card className="p-6">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {statusColumns.map((column) => (
                <div key={column.id} className={`${column.color} rounded-lg p-4 min-h-[600px]`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">{column.title}</h3>
                    <Badge variant="secondary" className="bg-background text-foreground">
                      {getDealsForStatus(column.id).length}
                    </Badge>
                  </div>
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[400px] ${snapshot.isDraggingOver ? 'bg-background/50' : ''} rounded-lg transition-colors`}
                      >
                      {getDealsForStatus(column.id).map((deal, index) => (
                        <Draggable
                          key={deal.application_id}
                          draggableId={deal.application_id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-card rounded-lg p-3 mb-3 shadow-sm border border-border transition-all hover:shadow-md ${
                                snapshot.isDragging ? 'shadow-lg rotate-3 scale-105' : ''
                              }`}
                            >
                              <div className="font-medium text-sm mb-2 text-foreground">
                                {deal.leads?.first_name} {deal.leads?.last_name}
                              </div>
                              <div className="text-xs text-muted-foreground mb-1 font-medium">
                                {deal.leads?.companies?.name || 'No Company'}
                              </div>
                              <div className="text-xs text-muted-foreground mb-3 truncate">
                                {deal.leads?.email}
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {deal.type || 'Application'}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(deal.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-2 font-medium">
                                👤 {deal.users?.fullname}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
            </div>
          </DragDropContext>
        </Card>
      </main>
    </div>
  );
};

export default Pipeline;