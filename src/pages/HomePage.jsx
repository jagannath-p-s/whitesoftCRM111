import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Bell,
  Search,
  LogOut,
  ShoppingBag,
  ClipboardList,
  LayoutDashboard,
  Boxes,
  Hammer,
  Users,
  Package,
  GitBranch,
  FileUp,
  History
} from 'lucide-react';
import { Alert, Snackbar } from '@mui/material';
import Activities from '../components/activities/Activities';
import Sales from '../components/contacts/Sales';
import Dashboard from '../components/dashboard/Dashboard';
import Services from '../components/services/Services';
import Stock from '../components/stock/Stock';
import Organisation from '../components/organization/Organisation';
import BatchComponent from '../components/batches/BatchComponent';
import Pipelines from '../components/pipelines/Pipelines';
import UploadFiles from '../components/fileupload/UploadFiles';
import UserTable from '../components/oldusers/UserTable';
import SearchComponent from '../components/search/SearchComponent';
import SearchBar from '../components/search/SearchBar';

const HomePage = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeComponent, setActiveComponent] = useState('Activities');
  const [previousComponent, setPreviousComponent] = useState('Activities');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const sidebarRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const session = localStorage.getItem('session');
    const permissions = localStorage.getItem('userPermissions');
    
    if (!session || !permissions) {
      window.location.href = '/login';
      return;
    }

    try {
      const sessionData = JSON.parse(session);
      const permissionsData = JSON.parse(permissions);
      
      if (new Date(sessionData.expiresAt) < new Date()) {
        localStorage.removeItem('session');
        localStorage.removeItem('userPermissions');
        window.location.href = '/login';
        return;
      }

      setUser({ ...sessionData.user, permissions: permissionsData });
    } catch (error) {
      console.error('Error parsing user data:', error);
      window.location.href = '/login';
      return;
    }
    
    setLoading(false);
  }, []);

  const handleSearchClick = (term) => {
    setPreviousComponent(activeComponent);
    setActiveComponent('SearchComponent');
    setSearchTerm(term);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { icon: <ShoppingBag size={24} />, label: "Sales", component: 'Sales', permission: 'canEditSales' },
    { icon: <ClipboardList size={24} />, label: "Activities", component: 'Activities' },
    { icon: <LayoutDashboard size={24} />, label: "Dashboard", component: 'Dashboard', permission: 'canSeePerformance' },
    { icon: <Boxes size={24} />, label: "Stock", component: 'Stock', permission: 'canEditStock' },
    { icon: <Hammer size={24} />, label: "Services", component: 'Services', permission: 'canEditServiceEnquiry' },
    { icon: <Users size={24} />, label: "Organisation", component: 'Organisation', permission: 'canEditStaff' },
    { icon: <Package size={24} />, label: "Batches", component: 'BatchComponent' },
    { icon: <GitBranch size={24} />, label: "Pipelines", component: 'Pipelines', permission: 'canEditPipeline' },
    { icon: <FileUp size={24} />, label: "Upload Files", component: 'UploadFiles', permission: 'canEditFiles' },
    { icon: <History size={24} />, label: "UserTable", component: 'UserTable', permission: 'canEditSales' }
  ];

  const renderComponent = () => {
    if (!user) return null;

    const components = {
      Sales: () => user.permissions.canEditSales ? <Sales userId={user.id} /> : null,
      Activities: () => <Activities userId={user.id} userRole={user.role} />,
      Dashboard: () => user.permissions.canSeePerformance ? <Dashboard /> : null,
      Stock: () => user.permissions.canEditStock ? <Stock userId={user.id} /> : null,
      Services: () => user.permissions.canEditServiceEnquiry ? <Services userId={user.id} /> : null,
      Organisation: () => user.permissions.canEditStaff ? <Organisation userId={user.id} /> : null,
      BatchComponent: () => <BatchComponent userId={user.id} />,
      Pipelines: () => user.permissions.canEditPipeline ? <Pipelines userId={user.id} /> : null,
      UploadFiles: () => user.permissions.canEditFiles ? <UploadFiles userId={user.id} /> : null,
      UserTable: () => user.permissions.canEditSales ? <UserTable userId={user.id} /> : null,
      SearchComponent: () => <SearchComponent searchTerm={searchTerm} userId={user.id} onBackClick={() => {
        setActiveComponent(previousComponent);
        setSearchTerm('');
      }} />
    };

    const Component = components[activeComponent];
    return Component ? <Component /> : null;
  };

  const handleLogout = () => {
    localStorage.removeItem('session');
    localStorage.removeItem('userPermissions');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div
        ref={sidebarRef}
        className={`fixed left-0 h-screen bg-white shadow-lg flex flex-col py-4 px-3 border-r border-gray-200 transition-all duration-300 z-40 ${
          isExpanded ? 'w-48' : 'w-20'
        }`}
      >
        <div className="flex items-center justify-center mt-6 mb-6">
          <img src="/haritha.svg" alt="Logo" className="w-10 h-10" />
        </div>

        <nav className="flex flex-col space-y-2">
          {navItems.map((item, index) => (
            (!item.permission || user.permissions[item.permission]) && (
              <button
                key={index}
                onClick={() => setActiveComponent(item.component)}
                className={`p-2 rounded-lg hover:bg-blue-100 transition-colors duration-200 flex items-center ${
                  isExpanded ? 'w-full' : 'justify-center'
                } ${activeComponent === item.component ? 'bg-blue-100' : ''}`}
              >
                {React.cloneElement(item.icon, { className: 'text-gray-600' })}
                {isExpanded && (
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                )}
              </button>
            )
          ))}
        </nav>
      </div>

      <div className={`flex-1 ${isExpanded ? 'ml-48' : 'ml-20'}`}>
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                  <Menu className="h-6 w-6" />
                </button>
                
                {user && <SearchBar onSearch={handleSearchClick} currentUserId={user.id} />}
              </div>

              <div className="flex items-center gap-4">
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                  <Bell className="h-6 w-6" />
                </button>
                
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold"
                  >
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white">
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={handleCloseSnackbar} 
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
          {renderComponent()}
        </div>
      </div>
    </div>
  );
};

export default HomePage;