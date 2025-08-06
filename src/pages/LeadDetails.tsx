import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Mail, Phone, Building, Edit, Save, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

interface Lead {
  lead_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: number;
  created_at: string;
  companies: {
    company_id: number;
    name: string;
    industry: string;
    website: string;
  };
}

interface Application {
  application_id: number;
  application_status: string;
  type: string;
  date_application_sent: string;
  date_signed: string;
  created_at: string;
  list_id: number;
  lists?: {
    list_id: number;
    list_name: string;
    list_type: string;
    list_provider: string;
  };
}

interface Company {
  company_id: number;
  name: string;
}

const LeadDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [lead, setLead] = useState<Lead | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});

  const fetchLeadData = async () => {
    if (!id) return;

    try {
      // Fetch lead details with company information
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select(`
          *,
          companies (
            company_id,
            name,
            industry,
            website
          )
        `)
        .eq('lead_id', parseInt(id))
        .single();

      if (leadError) throw leadError;
      setLead(leadData);
      setEditedLead(leadData);

      // Fetch applications for this lead with list information
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications_tracking')
        .select(`
          *,
          lists (
            list_id,
            list_name,
            list_type,
            list_provider
          )
        `)
        .eq('lead_id', parseInt(id))
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;
      setApplications(applicationsData || []);

      // Fetch all companies for dropdown
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('company_id, name')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

    } catch (error: any) {
      toast({
        title: "Error fetching lead data",
        description: error.message,
        variant: "destructive",
      });
      navigate('/pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
  }, [id]);

  const handleSaveChanges = async () => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update(editedLead)
        .eq('lead_id', lead.lead_id);

      if (error) throw error;

      // Refetch data to get updated company info
      await fetchLeadData();
      setIsEditing(false);
      toast({
        title: "Lead updated",
        description: "Lead information has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating lead",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedLead(lead || {});
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-muted text-muted-foreground';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'responded': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'signed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-foreground">Loading lead details...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-foreground mb-2">Lead not found</h3>
              <p className="text-muted-foreground mb-4">The lead you're looking for doesn't exist.</p>
              <Button onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <User className="h-8 w-8" />
                  {lead.first_name} {lead.last_name}
                </h1>
                <p className="text-muted-foreground">Lead Details & Applications</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSaveChanges} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Lead
                </Button>
              )}
            </div>
          </div>

          {/* Lead Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Lead Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="first_name"
                        value={editedLead.first_name || ''}
                        onChange={(e) => setEditedLead({...editedLead, first_name: e.target.value})}
                      />
                    ) : (
                      <p className="text-foreground font-medium">{lead.first_name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="last_name"
                        value={editedLead.last_name || ''}
                        onChange={(e) => setEditedLead({...editedLead, last_name: e.target.value})}
                      />
                    ) : (
                      <p className="text-foreground font-medium">{lead.last_name}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedLead.email || ''}
                      onChange={(e) => setEditedLead({...editedLead, email: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <p className="text-foreground">{lead.email}</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editedLead.phone || ''}
                      onChange={(e) => setEditedLead({...editedLead, phone: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <p className="text-foreground">{lead.phone || 'Not provided'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  {isEditing ? (
                    <Select
                      value={editedLead.company_id?.toString() || ''}
                      onValueChange={(value) => setEditedLead({...editedLead, company_id: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.company_id} value={company.company_id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <p className="text-foreground">{lead.companies?.name || 'No company assigned'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Created Date</Label>
                  <p className="text-foreground">{new Date(lead.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{applications.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {lead.companies?.name || 'No company'}
                  </div>
                  {lead.companies?.industry && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {lead.companies.industry}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Applications History ({applications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>List</TableHead>
                        <TableHead>Sent Date</TableHead>
                        <TableHead>Signed Date</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.application_id}>
                          <TableCell>
                            <Badge className={getStatusColor(app.application_status)}>
                              {app.application_status}
                            </Badge>
                          </TableCell>
                          <TableCell>{app.type || 'Application'}</TableCell>
                          <TableCell>
                            {app.lists ? (
                              <div>
                                <div className="font-medium text-sm">{app.lists.list_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {app.lists.list_type} • {app.lists.list_provider}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No list assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {app.date_application_sent 
                              ? new Date(app.date_application_sent).toLocaleDateString()
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {app.date_signed 
                              ? new Date(app.date_signed).toLocaleDateString()
                              : '-'
                            }
                          </TableCell>
                          <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No applications found</h3>
                  <p className="text-muted-foreground">No applications have been created for this lead yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;