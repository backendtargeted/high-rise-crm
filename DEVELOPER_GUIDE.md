# CRM Application Developer Guide

## Table of Contents
1. [Application Overview](#application-overview)
2. [Features & Modules](#features--modules)
3. [Technical Architecture](#technical-architecture)
4. [Database Schema](#database-schema)
5. [Development Conventions](#development-conventions)
6. [Integration Guidelines](#integration-guidelines)
7. [Deployment Information](#deployment-information)

## Application Overview

This is a comprehensive Customer Relationship Management (CRM) application built for sales teams to manage leads, track applications, and monitor performance metrics. The application features role-based access control with three user types: Admin, Manager, and User.

### Core Purpose
- Lead management and tracking
- Application lifecycle management
- Company and contact organization
- Sales pipeline visualization
- Performance analytics
- Real-time notifications

### User Roles & Permissions

**Admin**
- Full system access
- User management and creation
- All data access across the organization
- System configuration

**Manager** 
- Team management capabilities
- Access to their team's data and their own data
- List and company management
- Analytics for their team

**User**
- Access to their own assigned leads and applications
- Can create and update their own records
- View companies and lists
- Personal analytics

## Features & Modules

### 1. Authentication Module (`/auth`)
- **Features**: Login, signup, role-based redirection
- **Components**: `Auth.tsx`, `useAuth` hook
- **Security**: Supabase Auth with email/password
- **Access Control**: Automatic role-based routing after login

### 2. Dashboard (`/`)
- **Features**: Overview metrics, recent activity, quick actions
- **Components**: `Index.tsx`
- **Data**: Real-time stats, notifications
- **Role-based**: Different views based on user permissions

### 3. Companies Management (`/companies`, `/companies/:id`)
- **Features**: Company CRUD operations, industry categorization, website tracking
- **Components**: `Companies.tsx`, `CompanyDetails.tsx`
- **Data**: Company profiles, associated leads, list assignments
- **Permissions**: All users can view, Managers+ can modify

### 4. Leads Management (`/leads/:id`)
- **Features**: Lead details, contact information, application history
- **Components**: `LeadDetails.tsx`
- **Data**: Lead profiles, application tracking, company associations
- **Access Control**: Users see only their assigned leads

### 5. Pipeline Management (`/pipeline`)
- **Features**: Visual pipeline, drag-and-drop, status tracking
- **Components**: `Pipeline.tsx`
- **Data**: Application status flow, deal progression
- **Visualization**: Kanban-style board with status columns

### 6. Analytics (`/analytics`)
- **Features**: Performance metrics, conversion rates, team statistics
- **Components**: `Analytics.tsx`
- **Data**: Application analytics, user performance, ROI tracking
- **Role-based**: Managers see team data, Users see personal data

### 7. Real-time Notifications
- **Features**: Live updates, application status changes, system notifications
- **Components**: `RealtimeNotifications.tsx`
- **Technology**: Supabase real-time subscriptions
- **Events**: Application updates, new assignments, status changes

## Technical Architecture

### Technology Stack
- **Frontend**: React 18.3.1 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router DOM 6.30.1
- **State Management**: React Query (@tanstack/react-query)
- **Backend**: Supabase (Database + Auth + Real-time)
- **Edge Functions**: Deno serverless functions
- **Build Tool**: Vite
- **Package Manager**: npm

### Project Structure
```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── Navbar.tsx         # Navigation component
│   ├── ProtectedRoute.tsx # Auth route protection
│   ├── AdminRoute.tsx     # Admin-only route protection
│   └── RealtimeNotifications.tsx
├── pages/                 # Route components
│   ├── Index.tsx         # Dashboard
│   ├── Auth.tsx          # Authentication
│   ├── Companies.tsx     # Company listing
│   ├── CompanyDetails.tsx
│   ├── LeadDetails.tsx
│   ├── Pipeline.tsx
│   ├── Analytics.tsx
│   └── NotFound.tsx
├── hooks/                # Custom React hooks
│   ├── useAuth.tsx       # Authentication state
│   ├── useUserProfile.tsx # User profile data
│   └── use-toast.ts      # Toast notifications
├── integrations/
│   └── supabase/         # Supabase client & types
└── lib/
    └── utils.ts          # Utility functions
```

### Design System
- **CSS Variables**: Semantic color tokens in `index.css`
- **Theme**: Dark/light mode support via `next-themes`
- **Components**: Customized shadcn/ui components
- **Responsive**: Mobile-first design approach
- **Accessibility**: ARIA compliant components

## Database Schema

### Core Tables

**users**
- `id` (Primary Key): User identifier
- `fullname`: User's full name
- `email`: Unique email address
- `role`: User role (admin/manager/user)
- `vicidialuser`: VICIdial system username
- `opensignapikey`: OpenSign API integration key
- `opensignpass`: OpenSign password
- `templateid`: Default template ID
- `opensign_webhook`: Webhook URL for OpenSign
- `manager_id`: Foreign key to manager user

**companies**
- `company_id` (Primary Key): Company identifier
- `name`: Company name
- `industry`: Industry classification
- `website`: Company website URL
- `created_at`: Record creation timestamp

**leads**
- `lead_id` (Primary Key): Lead identifier
- `company_id`: Foreign key to companies table
- `first_name`: Lead's first name
- `last_name`: Lead's last name
- `email`: Lead's email address
- `phone`: Lead's phone number
- `created_at`: Record creation timestamp

**applications_tracking**
- `application_id` (Primary Key): Application identifier
- `lead_id`: Foreign key to leads table
- `user_id`: Foreign key to users table (assigned user)
- `list_id`: Foreign key to lists table
- `application_status`: Current status (created/sent/signed/etc.)
- `type`: Application type
- `date_application_sent`: When application was sent
- `date_signed`: When application was signed
- `opensign_objectid`: OpenSign document ID
- `created_at`, `updated_at`: Timestamps

**lists**
- `list_id` (Primary Key): List identifier
- `list_name`: Name of the list
- `list_provider`: Provider/source of the list
- `list_type`: Type classification
- `status`: Active/inactive status
- `initial_lead_count`: Number of leads at purchase
- `cost`: List purchase cost
- `purchase_date`: When list was purchased
- `created_at`: Record creation timestamp

**list_companies**
- `list_id`: Foreign key to lists table
- `company_id`: Foreign key to companies table
- Junction table for list-company relationships

**profiles**
- `id`: UUID linked to auth.users
- `user_id`: Reference to users table
- `created_at`, `updated_at`: Timestamps

### Security Implementation

**Row Level Security (RLS)**
- All tables have RLS enabled
- Access controlled via `can_access_user_data()` function
- Users can only access their own data or data they manage
- Admins have full access to all data

**Database Functions**
- `get_current_user_data()`: Gets current user's profile and role
- `can_access_user_data(target_user_id)`: Determines data access permissions
- `auto_assign_list_id()`: Automatically assigns list_id based on company

## Development Conventions

### Code Organization
- **Components**: PascalCase, one component per file
- **Hooks**: camelCase starting with "use"
- **Pages**: PascalCase, represent route components
- **Utils**: camelCase, pure functions in `lib/utils.ts`

### Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase
- **Database**: snake_case (follows PostgreSQL conventions)

### State Management
- **Local State**: useState for component-specific state
- **Server State**: React Query for API data fetching
- **Global State**: Context providers for auth and theme
- **Form State**: react-hook-form for form management

### Error Handling
- **Toast Notifications**: Use `useToast` hook for user feedback
- **Try-Catch**: Wrap async operations in try-catch blocks
- **Loading States**: Show skeleton/spinner during data fetching
- **Error Boundaries**: Implement for component error isolation

### Database Operations
- **Automatic Triggers**: 
  - `updated_at` columns auto-update on record changes
  - `auto_assign_list_id` trigger assigns list based on company
- **Validation**: Server-side validation via RLS policies
- **Transactions**: Use Supabase transactions for multi-table operations

## Integration Guidelines

### Supabase Client Usage
```typescript
import { supabase } from "@/integrations/supabase/client";

// Standard query pattern
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);

// Handle errors consistently
if (error) {
  console.error('Database error:', error);
  toast({
    title: "Error",
    description: "Failed to load data",
    variant: "destructive",
  });
  return;
}
```

### Error Handling Patterns
```typescript
// Standard error handling
try {
  const result = await apiCall();
  toast({
    title: "Success",
    description: "Operation completed successfully",
  });
} catch (error) {
  console.error('Error:', error);
  toast({
    title: "Error", 
    description: "Operation failed",
    variant: "destructive",
  });
}
```

### Real-time Subscriptions
```typescript
// Subscribe to table changes
useEffect(() => {
  const subscription = supabase
    .channel('table_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'table_name' },
      (payload) => {
        // Handle real-time updates
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### API Integration Patterns
- **Edge Functions**: Located in `supabase/functions/`
- **CORS Handling**: All functions include CORS headers
- **Authentication**: JWT validation in edge functions
- **Error Responses**: Consistent JSON error format

## Deployment Information

### Environment Configuration
- **Supabase URL**: `https://miazocmpwkglhpkslkuh.supabase.co`
- **Anon Key**: Configured in `src/integrations/supabase/client.ts`
- **No .env files**: All configuration is hardcoded (Lovable convention)

### Build Process
- **Development**: `npm run dev` (Vite dev server)
- **Production**: `npm run build` (Static build output)
- **Preview**: `npm run preview` (Local production preview)

### Key Integrations
- **OpenSign**: Document signing integration via API keys
- **VICIdial**: User mapping via `vicidialuser` field
- **Real-time**: Supabase real-time for live updates

### Security Considerations
- **RLS Policies**: Enforce data access at database level
- **JWT Validation**: All API routes validate authentication
- **CORS Configuration**: Proper CORS headers on all endpoints
- **Input Validation**: Client and server-side validation

---

## Quick Start for New Developers

1. **Setup**: Clone repository, run `npm install`
2. **Database**: Review schema in Supabase dashboard
3. **Authentication**: Test login with existing user credentials
4. **Development**: Use `npm run dev` and start with existing components
5. **Debugging**: Check browser console and Supabase logs for issues
6. **Testing**: Create test data through the UI to understand workflows

## Common Development Tasks

- **Adding new tables**: Use Supabase migration tool
- **Creating components**: Follow shadcn/ui patterns
- **Adding routes**: Update `App.tsx` routing configuration
- **Implementing features**: Start with UI, then add backend logic
- **Debugging**: Use browser dev tools and Supabase dashboard

This guide should provide comprehensive information for any AI developer working on this CRM application.