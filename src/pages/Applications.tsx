import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Calendar, User, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';

interface Application {
  application_id: number;
  lead_id: number;
  user_id: number;
  list_id?: number;
  application_status: string;
  type: string;
  date_application_sent?: string;
  date_signed?: string;
  created_at: string;
  leads?: {
    first_name: string;
    last_name: string;
    email: string;
    companies?: {
      name: string;
    };
  };
  users?: {
    fullname: string;
  };
  lists?: {
    list_name: string;
  };
}

const Applications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newApplication, setNewApplication] = useState({
    lead_id: '',
    user_id: '',
    list_id: '',
    application_status: 'created',
    type: 'email',
    date_application_sent: ''
  });

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
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
          ),
          lists (
            list_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching applications",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [leadsRes, usersRes, listsRes] = await Promise.all([
        supabase.from('leads').select('lead_id, first_name, last_name, email'),
        supabase.from('users').select('id, fullname'),
        supabase.from('lists').select('list_id, list_name')
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (listsRes.error) throw listsRes.error;

      setLeads(leadsRes.data || []);
      setUsers(usersRes.data || []);
      setLists(listsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchApplications(), fetchDropdownData()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.leads?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.leads?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.leads?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.leads?.companies?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.users?.fullname.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.application_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('applications_tracking')
        .insert([{
          ...newApplication,
          lead_id: parseInt(newApplication.lead_id),
          user_id: parseInt(newApplication.user_id),
          list_id: newApplication.list_id ? parseInt(newApplication.list_id) : null,
          date_application_sent: newApplication.date_application_sent || null
        }]);

      if (error) throw error;

      toast({
        title: "Application created",
        description: "Application has been successfully created.",
      });

      setNewApplication({
        lead_id: '',
        user_id: '',
        list_id: '',
        application_status: 'created',
        type: 'email',
        date_application_sent: ''
      });
      setIsDialogOpen(false);
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error creating application",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-gray-500';
      case 'sent': return 'bg-blue-500';
      case 'responded': return 'bg-green-500';
      case 'signed': return 'bg-purple-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading applications...</div>
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Applications Tracking</h1>
              <p className="text-slate-400">Monitor your application pipeline</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Application
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Application</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateApplication} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lead_id" className="text-slate-200">Lead</Label>
                      <Select value={newApplication.lead_id} onValueChange={(value) => setNewApplication({...newApplication, lead_id: value})}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select lead" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {leads.map((lead) => (
                            <SelectItem key={lead.lead_id} value={lead.lead_id.toString()}>
                              {lead.first_name} {lead.last_name} ({lead.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="user_id" className="text-slate-200">Assigned User</Label>
                      <Select value={newApplication.user_id} onValueChange={(value) => setNewApplication({...newApplication, user_id: value})}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="list_id" className="text-slate-200">List (Optional)</Label>
                      <Select value={newApplication.list_id} onValueChange={(value) => setNewApplication({...newApplication, list_id: value})}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select list" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {lists.map((list) => (
                            <SelectItem key={list.list_id} value={list.list_id.toString()}>
                              {list.list_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="type" className="text-slate-200">Application Type</Label>
                      <Select value={newApplication.type} onValueChange={(value) => setNewApplication({...newApplication, type: value})}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="in-person">In Person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status" className="text-slate-200">Status</Label>
                      <Select value={newApplication.application_status} onValueChange={(value) => setNewApplication({...newApplication, application_status: value})}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="created">Created</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="responded">Responded</SelectItem>
                          <SelectItem value="signed">Signed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date_sent" className="text-slate-200">Date Sent (Optional)</Label>
                      <Input
                        id="date_sent"
                        type="date"
                        value={newApplication.date_application_sent}
                        onChange={(e) => setNewApplication({...newApplication, date_application_sent: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    Create Application
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredApplications.map((app) => (
              <Card key={app.application_id} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-white text-lg">
                      {app.leads?.first_name} {app.leads?.last_name}
                    </CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(app.application_status)}`}>
                      {app.application_status}
                    </span>
                  </div>
                  <CardDescription className="text-slate-400">
                    {app.leads?.companies?.name || 'No company'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-slate-300">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm">{app.users?.fullname}</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <Building className="h-4 w-4 mr-2" />
                    <span className="text-sm capitalize">{app.type}</span>
                  </div>
                  {app.lists && (
                    <div className="flex items-center text-slate-300">
                      <span className="text-sm">List: {app.lists.list_name}</span>
                    </div>
                  )}
                  {app.date_application_sent && (
                    <div className="flex items-center text-slate-300">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">Sent: {new Date(app.date_application_sent).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="text-xs text-slate-500">
                    Created: {new Date(app.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-2">No applications found</h3>
              <p className="text-slate-400">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Start by creating your first application.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;