import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Building, Globe, ExternalLink, Edit, Save, X, Users, FileText, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

interface Company {
  company_id: number;
  name: string;
  industry: string;
  website: string;
  created_at: string;
}

interface Lead {
  lead_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
}

interface Application {
  application_id: number;
  application_status: string;
  date_application_sent: string;
  date_signed: string;
  created_at: string;
  leads: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [company, setCompany] = useState<Company | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCompany, setEditedCompany] = useState<Partial<Company>>({});

  const fetchCompanyData = async () => {
    if (!id) return;

    try {
      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('company_id', parseInt(id))
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);
      setEditedCompany(companyData);

      // Fetch leads for this company
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('company_id', parseInt(id))
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

      // Fetch applications for this company's leads
      const leadIds = leadsData?.map(lead => lead.lead_id) || [];
      if (leadIds.length > 0) {
        const { data: applicationsData, error: applicationsError } = await supabase
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
              email
            )
          `)
          .in('lead_id', leadIds)
          .order('created_at', { ascending: false });

        if (applicationsError) throw applicationsError;
        setApplications(applicationsData || []);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching company data",
        description: error.message,
        variant: "destructive",
      });
      navigate('/companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [id]);

  const handleSaveChanges = async () => {
    if (!company) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update(editedCompany)
        .eq('company_id', company.company_id);

      if (error) throw error;

      setCompany({ ...company, ...editedCompany });
      setIsEditing(false);
      toast({
        title: "Company updated",
        description: "Company information has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating company",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedCompany(company || {});
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
              <div className="text-foreground">Loading company details...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-foreground mb-2">Company not found</h3>
              <p className="text-muted-foreground mb-4">The company you're looking for doesn't exist.</p>
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
                  <Building className="h-8 w-8" />
                  {company.name}
                </h1>
                <p className="text-muted-foreground">Company Details & Analytics</p>
              </div>
            </div>
            {/* Allow all authenticated users to edit, but restrict certain fields based on role */}
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
                  Edit Company
                </Button>
              )}
            </div>
          </div>

          {/* Company Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Company Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editedCompany.name || ''}
                      onChange={(e) => setEditedCompany({...editedCompany, name: e.target.value})}
                    />
                  ) : (
                    <p className="text-foreground font-medium">{company.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  {isEditing ? (
                    <Input
                      id="industry"
                      value={editedCompany.industry || ''}
                      onChange={(e) => setEditedCompany({...editedCompany, industry: e.target.value})}
                    />
                  ) : (
                    <p className="text-foreground">{company.industry || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  {isEditing ? (
                    <Input
                      id="website"
                      type="url"
                      value={editedCompany.website || ''}
                      onChange={(e) => setEditedCompany({...editedCompany, website: e.target.value})}
                    />
                  ) : company.website ? (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {company.website}
                      </a>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Not provided</p>
                  )}
                </div>
                <div>
                  <Label>Added Date</Label>
                  <p className="text-foreground">{new Date(company.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{leads.length}</div>
                </CardContent>
              </Card>
              
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
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {leads.length > 0 ? ((applications.length / leads.length) * 100).toFixed(1) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Leads Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Company Leads ({leads.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {leads.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Added Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.lead_id}>
                        <TableCell className="font-medium">
                          {lead.first_name && lead.last_name 
                            ? `${lead.first_name} ${lead.last_name}`
                            : 'Name not provided'
                          }
                        </TableCell>
                        <TableCell>{lead.email || '-'}</TableCell>
                        <TableCell>{lead.phone || '-'}</TableCell>
                        <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No leads found</h3>
                  <p className="text-muted-foreground">This company doesn't have any leads yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

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
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Signed Date</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.application_id}>
                        <TableCell className="font-medium">
                          {app.leads?.first_name && app.leads?.last_name 
                            ? `${app.leads.first_name} ${app.leads.last_name}`
                            : app.leads?.email || 'Unknown Contact'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(app.application_status)}>
                            {app.application_status}
                          </Badge>
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
                  <p className="text-muted-foreground">No applications have been created for this company's leads yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;