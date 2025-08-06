import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Deal {
  application_id: number;
  application_status: string;
  type: string;
  created_at: string;
  date_application_sent?: string;
  leads: {
    lead_id: number;
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

const Pipeline = () => {
  // Clean pipeline component without filters
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const { toast } = useToast();

  const statusColumns = [
    { id: 'created', title: 'Created', color: 'bg-muted/50 border-l-4 border-l-muted-foreground' },
    { id: 'viewed', title: 'Viewed', color: 'bg-primary/10 border-l-4 border-l-primary' },
    { id: 'signed', title: 'Signed', color: 'bg-secondary/50 border-l-4 border-l-secondary-foreground' },
    { id: 'funded', title: 'Funded', color: 'bg-accent/40 border-l-4 border-l-accent-foreground' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch deals with relationships
      const { data: dealsData, error: dealsError } = await supabase
        .from('applications_tracking')
        .select(`
          *,
          leads (
            lead_id,
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

      if (dealsError) throw dealsError;

      setDeals(dealsData || []);

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
  }, []);

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


        {/* Kanban Board */}
        <Card className="p-6">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                               className={`bg-card rounded-lg p-3 mb-3 shadow-sm border border-border transition-all hover:shadow-md cursor-pointer ${
                                 snapshot.isDragging ? 'shadow-lg rotate-3 scale-105' : ''
                               }`}
                               onClick={(e) => {
                                 // Only navigate if not dragging
                                 if (!snapshot.isDragging) {
                                   e.stopPropagation();
                                   const leadId = deal.leads?.lead_id;
                                   if (leadId) {
                                     navigate(`/leads/${leadId}`);
                                   }
                                 }
                               }}
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