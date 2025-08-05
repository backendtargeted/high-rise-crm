import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Phone, Mail, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';

interface Lead {
  lead_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: number;
  created_at: string;
  companies?: {
    name: string;
    industry: string;
  };
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newLead, setNewLead] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_id: ''
  });

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          companies (
            name,
            industry
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching leads",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead =>
    lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.companies?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('leads')
        .insert([{
          ...newLead,
          company_id: newLead.company_id ? parseInt(newLead.company_id) : null
        }]);

      if (error) throw error;

      toast({
        title: "Lead created",
        description: "Lead has been successfully created.",
      });

      setNewLead({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_id: ''
      });
      setIsDialogOpen(false);
      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error creating lead",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
         <div className="p-4">
           <div className="max-w-7xl mx-auto">
             <div className="flex items-center justify-center h-64">
               <div className="text-white">Loading leads...</div>
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
            <h1 className="text-3xl font-bold text-white mb-2">Leads Management</h1>
            <p className="text-slate-400">Manage your prospect database</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Lead</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateLead} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name" className="text-slate-200">First Name</Label>
                    <Input
                      id="first_name"
                      value={newLead.first_name}
                      onChange={(e) => setNewLead({...newLead, first_name: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name" className="text-slate-200">Last Name</Label>
                    <Input
                      id="last_name"
                      value={newLead.last_name}
                      onChange={(e) => setNewLead({...newLead, last_name: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-slate-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-slate-200">Phone</Label>
                  <Input
                    id="phone"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="company_id" className="text-slate-200">Company ID (optional)</Label>
                  <Input
                    id="company_id"
                    type="number"
                    value={newLead.company_id}
                    onChange={(e) => setNewLead({...newLead, company_id: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Create Lead
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <Card key={lead.lead_id} className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {lead.first_name} {lead.last_name}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {lead.companies?.name || 'No company'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-slate-300">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">{lead.email}</span>
                </div>
                {lead.phone && (
                  <div className="flex items-center text-slate-300">
                    <Phone className="h-4 w-4 mr-2" />
                    <span className="text-sm">{lead.phone}</span>
                  </div>
                )}
                {lead.companies?.industry && (
                  <div className="flex items-center text-slate-300">
                    <Building className="h-4 w-4 mr-2" />
                    <span className="text-sm">{lead.companies.industry}</span>
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-2">
                  Added: {new Date(lead.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-white mb-2">No leads found</h3>
            <p className="text-slate-400">
              {searchTerm ? 'Try adjusting your search terms.' : 'Start by adding your first lead.'}
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Leads;