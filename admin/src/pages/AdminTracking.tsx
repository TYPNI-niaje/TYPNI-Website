import { useEffect, useState } from 'react';
import Card from '../components/Card/Card';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface AdminAction {
  id: string;
  admin_id: string | null;
  action: string;
  details: any;
  created_at: string;
  admin_name?: string;
}

interface FilterOptions {
  action: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  search: string;
}

const AdminTracking = () => {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [filteredActions, setFilteredActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    action: 'all',
    dateRange: 'all',
    search: ''
  });

  // Get unique action types for filter dropdown
  const actionTypes = ['all', ...new Set(actions.map(action => action.action))];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const exportToCSV = () => {
    const headers = ['Admin', 'Action', 'Details', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...filteredActions.map(action => [
        action.admin_name,
        action.action,
        JSON.stringify(action.details).replace(/,/g, ';'),
        new Date(action.created_at).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-actions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchActions = async () => {
      setLoading(true);
      setError(null);
      // Join admin_actions with profiles to get admin name
      const { data, error } = await supabase
        .from('admin_actions')
        .select('id, admin_id, action, details, created_at, profiles(full_name)')
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Map admin_name from joined profiles
      const formatted = data.map((row: any) => ({
        ...row,
        admin_name: row.profiles?.full_name || 'Unknown Admin',
      }));
      setActions(formatted);
      setFilteredActions(formatted);
      setLoading(false);
    };
    fetchActions();
  }, []);

  useEffect(() => {
    let filtered = [...actions];

    // Apply action filter
    if (filters.action !== 'all') {
      filtered = filtered.filter(action => action.action === filters.action);
    }

    // Apply date range filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    switch (filters.dateRange) {
      case 'today':
        filtered = filtered.filter(action => new Date(action.created_at) >= today);
        break;
      case 'week':
        filtered = filtered.filter(action => new Date(action.created_at) >= week);
        break;
      case 'month':
        filtered = filtered.filter(action => new Date(action.created_at) >= month);
        break;
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(action =>
        action.admin_name?.toLowerCase().includes(searchLower) ||
        action.action.toLowerCase().includes(searchLower) ||
        JSON.stringify(action.details).toLowerCase().includes(searchLower)
      );
    }

    setFilteredActions(filtered);
  }, [filters, actions]);

  const getActionStyle = (action: string): { rowClass: string; icon: JSX.Element | null } => {
    switch (action) {
      case 'failed_login':
        return {
          rowClass: 'bg-red-100',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'login':
        return {
          rowClass: 'bg-green-50',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707a1 1 0 00-1.414-1.414L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'logout':
        return {
          rowClass: 'bg-blue-50',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          rowClass: '',
          icon: null
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Tracking</h1>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Export to CSV
        </button>
      </div>

      <Card>
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 space-x-4 flex items-center">
          <select
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            {actionTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Actions' : type}
              </option>
            ))}
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as FilterOptions['dateRange'] }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>

          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary flex-1"
          />
        </div>

        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-700">Error loading admin actions: {error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Copy</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActions.length > 0 ? (
                  filteredActions.map((action) => {
                    const { rowClass, icon } = getActionStyle(action.action);
                    return (
                      <tr key={action.id} className={rowClass}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            {icon}
                            {action.admin_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{action.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-w-xs">{JSON.stringify(action.details, null, 2)}</pre>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(action.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => copyToClipboard(JSON.stringify({
                              admin: action.admin_name,
                              action: action.action,
                              details: action.details,
                              timestamp: new Date(action.created_at).toLocaleString()
                            }, null, 2))}
                            className="text-primary hover:text-primary-dark"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No admin actions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminTracking; 