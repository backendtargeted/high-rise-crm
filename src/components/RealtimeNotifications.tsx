import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'lead' | 'application' | 'company';
  timestamp: Date;
}

const RealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to leads changes
    const leadsChannel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          const newNotification: Notification = {
            id: `lead-${payload.new.lead_id}-${Date.now()}`,
            title: 'New Lead Added',
            message: `${payload.new.first_name} ${payload.new.last_name} has been added as a new lead`,
            type: 'lead',
            timestamp: new Date()
          };
          
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          
          toast({
            title: "New Lead",
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    // Subscribe to applications changes
    const applicationsChannel = supabase
      .channel('applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications_tracking'
        },
        (payload) => {
          let notificationData: Partial<Notification> = {
            type: 'application',
            timestamp: new Date()
          };

          if (payload.eventType === 'INSERT') {
            notificationData = {
              ...notificationData,
              id: `app-insert-${payload.new.application_id}-${Date.now()}`,
              title: 'New Application Created',
              message: `Application #${payload.new.application_id} has been created with status: ${payload.new.application_status}`
            };
          } else if (payload.eventType === 'UPDATE') {
            notificationData = {
              ...notificationData,
              id: `app-update-${payload.new.application_id}-${Date.now()}`,
              title: 'Application Updated',
              message: `Application #${payload.new.application_id} status changed to: ${payload.new.application_status}`
            };
          }

          if (notificationData.title) {
            const newNotification = notificationData as Notification;
            setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
            
            toast({
              title: notificationData.title,
              description: notificationData.message,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to companies changes
    const companiesChannel = supabase
      .channel('companies-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'companies'
        },
        (payload) => {
          const newNotification: Notification = {
            id: `company-${payload.new.company_id}-${Date.now()}`,
            title: 'New Company Added',
            message: `${payload.new.name} has been added to the companies database`,
            type: 'company',
            timestamp: new Date()
          };
          
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          
          toast({
            title: "New Company",
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(applicationsChannel);
      supabase.removeChannel(companiesChannel);
    };
  }, [toast]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead': return '👤';
      case 'application': return '📋';
      case 'company': return '🏢';
      default: return '📢';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="relative bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
      >
        <Bell className="h-4 w-4" />
        {notifications.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </Button>

      {isVisible && (
        <div className="mt-2 w-80 max-h-96 overflow-y-auto">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-medium">Notifications</h3>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="text-slate-400 hover:text-white"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-slate-400 text-sm">No new notifications</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="bg-slate-700/50 rounded-lg p-3 relative group"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNotification(notification.id)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">
                            {notification.title}
                          </p>
                          <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-slate-500 text-xs mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RealtimeNotifications;