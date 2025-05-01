import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import { supabase } from '../../supabaseClient';

// Extend dayjs with plugins
dayjs.extend(isBetween);
dayjs.extend(quarterOfYear);

// Color palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6'];

const Dashboard = () => {
  // State management
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'days').toDate());
  const [endDate, setEndDate] = useState(dayjs().toDate());
  const [timeFrame, setTimeFrame] = useState('daily');
  const [salesData, setSalesData] = useState([]);
  const [topEnquiredProducts, setTopEnquiredProducts] = useState([]);
  const [topSoldProducts, setTopSoldProducts] = useState([]);
  const [salesmanPerformance, setSalesmanPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leadSources, setLeadSources] = useState([]);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [wonDeals, setWonDeals] = useState(0);
  const [lostDeals, setLostDeals] = useState(0);
  const [pendingDeals, setPendingDeals] = useState(0);
  const [salesmanFilter, setSalesmanFilter] = useState('all');
  const [salespeople, setSalespeople] = useState([]);

  // Clear all filters
  const clearAllFilters = () => {
    setStartDate(dayjs().subtract(30, 'days').toDate());
    setEndDate(dayjs().toDate());
    setTimeFrame('daily');
    setSalesmanFilter('all');
  };

  // Handle time frame change
  const handleTimeFrameChange = (e) => {
    const newTimeFrame = e.target.value;
    setTimeFrame(newTimeFrame);
    
    // Adjust date range based on time frame
    const now = dayjs();
    if (newTimeFrame === 'daily') {
      setStartDate(now.subtract(30, 'days').toDate());
      setEndDate(now.toDate());
    } else if (newTimeFrame === 'weekly') {
      setStartDate(now.subtract(12, 'weeks').toDate());
      setEndDate(now.toDate());
    } else if (newTimeFrame === 'monthly') {
      setStartDate(now.subtract(6, 'months').toDate());
      setEndDate(now.toDate());
    } else if (newTimeFrame === 'quarterly') {
      setStartDate(now.subtract(4, 'quarters').toDate());
      setEndDate(now.toDate());
    }
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    
    // Reset time frame when manually selecting dates
    setTimeFrame('custom');
  };

  // Handle exporting data to CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(','));
    const csvContent = [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process enquiries data based on selected time frame
  const processEnquiriesData = (enquiries, timeFrame) => {
    const salesByTime = {};
    
    enquiries.forEach(enquiry => {
      if (!enquiry.created_at) return;
      
      const date = dayjs(enquiry.created_at);
      let key;
      
      if (timeFrame === 'daily') {
        key = date.format('YYYY-MM-DD');
      } else if (timeFrame === 'weekly') {
        // Get the start of the week (Sunday)
        key = date.startOf('week').format('YYYY-MM-DD');
      } else if (timeFrame === 'monthly') {
        key = date.format('YYYY-MM');
      } else if (timeFrame === 'quarterly') {
        const quarter = date.quarter();
        key = `Q${quarter} ${date.year()}`;
      }

      if (!salesByTime[key]) {
        salesByTime[key] = {
          date: key,
          sales: 0,
          won: 0,
          lost: 0,
          pending: 0
        };
      }

      salesByTime[key].sales++;
      
      if (enquiry.stage === 'Customer Won') {
        salesByTime[key].won++;
      } else if (enquiry.stage === 'Lost/Rejected') {
        salesByTime[key].lost++;
      } else {
        salesByTime[key].pending++;
      }
    });

    // Convert to array and sort by date
    return Object.values(salesByTime)
      .sort((a, b) => {
        // Handle quarterly format (Q1 2023)
        if (a.date.startsWith('Q') && b.date.startsWith('Q')) {
          const [aQ, aYear] = a.date.split(' ');
          const [bQ, bYear] = b.date.split(' ');
          if (aYear !== bYear) return aYear - bYear;
          return aQ.substring(1) - bQ.substring(1);
        }
        // Handle standard date formats
        return a.date.localeCompare(b.date);
      });
  };

  // Get product ID consistently
  const getProductId = (product) => {
    if (!product) return null;
    console.log('Debug - Getting product ID from:', product);
    
    // Try to get the ID from different possible fields
    const id = product.product_id || product.id || product.barcode_number || product.model_number;
    console.log('Debug - Found product ID:', id);
    return id;
  };

  // Get product display name with fallback to barcode
  const getProductDisplayName = (product) => {
    if (!product) return 'Unknown Product';
    
    // Try to get the name from different possible fields
    const name = product.item_name || product.name;
    if (name) return name;
    
    // If no name, try to get barcode
    const barcode = product.barcode_number;
    if (barcode) return `Product (${barcode})`;
    
    // If no barcode, try to get model number
    const modelNumber = product.model_number;
    if (modelNumber) return `Product (${modelNumber})`;
    
    // If no model number, try to get item alias
    const itemAlias = product.item_alias;
    if (itemAlias) return `Product (${itemAlias})`;
    
    // If no item alias, try to get company name
    const companyName = product.company_name;
    if (companyName) return `Product (${companyName})`;
    
    // If no company name, try to get product ID
    const productId = product.product_id;
    if (productId) return `Product #${productId}`;
    
    return 'Unknown Product';
  };

  // Find product in database using multiple fields
  const findProductInDatabase = (prod, products) => {
    if (!prod || !products) return null;
    
    return products.find(p => {
      // Try matching by product_id
      if (String(p.product_id) === String(prod.product_id)) return true;
      
      // Try matching by barcode
      if (p.barcode_number && String(p.barcode_number) === String(prod.barcode_number)) return true;
      
      // Try matching by model number
      if (p.model_number && String(p.model_number) === String(prod.model_number)) return true;
      
      // Try matching by item name
      if (p.item_name && String(p.item_name) === String(prod.item_name)) return true;
      
      return false;
    });
  };

  // Process top enquired products
  const processTopEnquiredProducts = (enquiries, products) => {
    try {
      const productCounts = {};
      
      enquiries.forEach(enquiry => {
        if (!enquiry.products) return;
        
        let enquiryProducts;
        try {
          enquiryProducts = typeof enquiry.products === 'string' 
            ? JSON.parse(enquiry.products) 
            : enquiry.products;
        } catch (error) {
          console.error('Error parsing products:', error);
          return;
        }

        // Handle different product data structures
        if (Array.isArray(enquiryProducts)) {
          enquiryProducts.forEach(prod => {
            if (!prod) return;
            const product = findProductInDatabase(prod, products);
            if (product) {
              const productId = product.product_id;
              if (productId) {
                productCounts[productId] = (productCounts[productId] || 0) + 1;
              }
            }
          });
        } else if (enquiryProducts && typeof enquiryProducts === 'object') {
          Object.values(enquiryProducts).forEach(prod => {
            if (!prod) return;
            const product = findProductInDatabase(prod, products);
            if (product) {
              const productId = product.product_id;
              if (productId) {
                productCounts[productId] = (productCounts[productId] || 0) + 1;
              }
            }
          });
        }
      });

      // Map product IDs to names and sort by count
      return Object.entries(productCounts)
        .map(([productId, count]) => {
          const product = products.find(p => p.product_id === parseInt(productId));
          return {
            id: productId,
            name: getProductDisplayName(product),
            count
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } catch (error) {
      console.error('Error processing enquired products:', error);
      return [];
    }
  };

  // Process top sold products
  const processTopSoldProducts = (enquiries, products) => {
    try {
      const productQuantities = {};
      
      // Filter won deals
      const wonEnquiries = enquiries.filter(e => e.stage === 'Customer Won');
      
      wonEnquiries.forEach(sale => {
        if (!sale.products) return;
        
        let saleProducts;
        try {
          saleProducts = typeof sale.products === 'string' 
            ? JSON.parse(sale.products) 
            : sale.products;
        } catch (error) {
          console.error('Error parsing sale products:', error);
          return;
        }

        if (Array.isArray(saleProducts)) {
          saleProducts.forEach(prod => {
            if (!prod) return;
            const product = findProductInDatabase(prod, products);
            if (product) {
              const productId = product.product_id;
              const quantity = parseInt(prod.quantity) || 1;
              if (productId) {
                productQuantities[productId] = (productQuantities[productId] || 0) + quantity;
              }
            }
          });
        } else if (saleProducts && typeof saleProducts === 'object') {
          Object.values(saleProducts).forEach(prod => {
            if (!prod) return;
            const product = findProductInDatabase(prod, products);
            if (product) {
              const productId = product.product_id;
              const quantity = parseInt(prod.quantity) || 1;
              if (productId) {
                productQuantities[productId] = (productQuantities[productId] || 0) + quantity;
              }
            }
          });
        }
      });

      return Object.entries(productQuantities)
        .map(([productId, quantity]) => {
          const product = products.find(p => p.product_id === parseInt(productId));
          return {
            id: productId,
            name: getProductDisplayName(product),
            quantity
          };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    } catch (error) {
      console.error('Error processing sold products:', error);
      return [];
    }
  };

  // Process salesman performance data
  const processSalesmanPerformance = (enquiries, points, users) => {
    const performance = {};
    
    // Initialize performance for all users
    users.filter(user => user.role === 'salesman' || user.can_edit_enquiries).forEach(user => {
      performance[user.id] = {
        id: user.id,
        name: user.username,
        totalDeals: 0,
        wonDeals: 0,
        lostDeals: 0,
        pendingDeals: 0,
        points: 0,
        conversionRate: 0
      };
    });

    // Process enquiries
    enquiries.forEach(enquiry => {
      if (enquiry.assignedto && performance[enquiry.assignedto]) {
        const salesman = performance[enquiry.assignedto];
        salesman.totalDeals++;
        if (enquiry.stage === 'Customer Won') {
          salesman.wonDeals++;
        } else if (enquiry.stage === 'Lost/Rejected') {
          salesman.lostDeals++;
        } else {
          salesman.pendingDeals++;
        }
      }
    });

    // Add points from points table
    points.forEach(point => {
      if (performance[point.user_id]) {
        performance[point.user_id].points += point.points || 0;
      }
    });

    // Calculate conversion rates
    Object.values(performance).forEach(salesman => {
      if (salesman.totalDeals > 0) {
        salesman.conversionRate = ((salesman.wonDeals / salesman.totalDeals) * 100).toFixed(1);
      }
    });

    // Convert to array and sort by points
    return Object.values(performance)
      .filter(salesman => salesman.totalDeals > 0)
      .sort((a, b) => b.points - a.points);
  };

  // Calculate conversion rates between stages
  const calculateConversionRates = (enquiries) => {
    const stages = ['Lead', 'Prospect', 'Opportunity', 'Customer Won', 'Lost/Rejected'];
    const stageCount = {};
    const rates = {};
    
    // Count enquiries in each stage
    stages.forEach(stage => {
      stageCount[stage] = enquiries.filter(e => e.stage === stage).length;
    });

    // Calculate overall conversion rate
    const totalOpportunities = stageCount['Lead'] + stageCount['Prospect'] + stageCount['Opportunity'];
    rates['Overall Win Rate'] = totalOpportunities > 0 
      ? ((stageCount['Customer Won'] / totalOpportunities) * 100).toFixed(1)
      : '0.0';
    
    // Calculate stage-to-stage conversion rates
    stages.forEach((stage, index) => {
      if (index < stages.length - 2) { // Exclude Lost/Rejected for stage progression
        const currentStageCount = stageCount[stage];
        const nextStageCount = stageCount[stages[index + 1]];
        rates[`${stage} to ${stages[index + 1]}`] = currentStageCount > 0 
          ? ((nextStageCount / currentStageCount) * 100).toFixed(1) 
          : '0.0';
      }
    });

    // Calculate loss rates
    stages.forEach((stage, index) => {
      if (index < stages.length - 1) { // All stages can have losses
        const stageEnquiries = enquiries.filter(e => e.stage === stage || e.stage === 'Lost/Rejected' && e.current_stage_id === index);
        const stageLost = enquiries.filter(e => e.stage === 'Lost/Rejected' && e.current_stage_id === index).length;
        rates[`${stage} Loss Rate`] = stageEnquiries.length > 0 
          ? ((stageLost / stageEnquiries.length) * 100).toFixed(1) 
          : '0.0';
      }
    });

    return rates;
  };

  // Process lead sources with time frame consideration
  const processLeadSources = (enquiries, timeFrame) => {
    console.log('Debug - Processing lead sources with time frame:', timeFrame);

    const sources = {};
    
    // First, count all lead sources
    enquiries.forEach(enquiry => {
      if (!enquiry.leadsource) return;
      
      const source = enquiry.leadsource.trim();
      if (!source) return;

      // Check if the enquiry falls within the selected time frame
      const enquiryDate = dayjs(enquiry.created_at);
      const startDateObj = dayjs(startDate);
      const endDateObj = dayjs(endDate);
      
      if (!enquiryDate.isBetween(startDateObj, endDateObj, 'day', '[]')) {
        return;
      }
      
      if (!sources[source]) {
        sources[source] = {
          name: source,
          count: 0,
          won: 0,
          lost: 0,
          pending: 0,
          totalValue: 0
        };
      }
      
      sources[source].count++;
      
      // Track deal status
      if (enquiry.stage === 'Customer Won') {
        sources[source].won++;
        // Add value if available
        if (enquiry.total_value) {
          sources[source].totalValue += parseFloat(enquiry.total_value) || 0;
        }
      } else if (enquiry.stage === 'Lost/Rejected') {
        sources[source].lost++;
      } else {
        sources[source].pending++;
      }
    });

    console.log('Debug - Processed lead sources:', {
      totalSources: Object.keys(sources).length,
      sources: Object.values(sources)
    });

    // Calculate metrics and sort by effectiveness
    const processedSources = Object.values(sources)
      .map(source => {
        const totalDeals = source.count;
        const wonDeals = source.won;
        const lostDeals = source.lost;
        const pendingDeals = source.pending;
        
        return {
          ...source,
          winRate: totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) : '0.0',
          lossRate: totalDeals > 0 ? ((lostDeals / totalDeals) * 100).toFixed(1) : '0.0',
          pendingRate: totalDeals > 0 ? ((pendingDeals / totalDeals) * 100).toFixed(1) : '0.0',
          avgValue: wonDeals > 0 ? (source.totalValue / wonDeals).toFixed(2) : '0.00'
        };
      })
      .sort((a, b) => {
        // Sort by win rate first, then by total deals
        const aWinRate = parseFloat(a.winRate);
        const bWinRate = parseFloat(b.winRate);
        if (aWinRate !== bWinRate) return bWinRate - aWinRate;
        return b.count - a.count;
      });

    console.log('Debug - Final lead sources data:', processedSources);
    return processedSources;
  };

  // Process region data
  const processRegionData = (enquiries) => {
    const regions = {};
    
    enquiries.forEach(enquiry => {
      if (enquiry.state) {
        const region = enquiry.state;
        if (!regions[region]) {
          regions[region] = {
            name: region,
            count: 0,
            won: 0
          };
        }
        regions[region].count++;
        if (enquiry.stage === 'Customer Won') {
          regions[region].won++;
        }
      }
    });

    return Object.values(regions)
      .map(region => ({
        ...region,
        conversionRate: region.count > 0 ? ((region.won / region.count) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Main data fetching function
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Format dates for query
      const formattedStartDate = dayjs(startDate).format('YYYY-MM-DD');
      const formattedEndDate = dayjs(endDate).add(1, 'day').format('YYYY-MM-DD');
      
      console.log('Debug - Fetching data with date range:', {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        timeFrame: timeFrame
      });
      
      // Fetch enquiries within date range
      let query = supabase
        .from('enquiries')
        .select('*')
        .gte('created_at', formattedStartDate)
        .lt('created_at', formattedEndDate);
      
      // Apply salesman filter if not 'all'
      if (salesmanFilter !== 'all') {
        query = query.eq('assignedto', salesmanFilter);
      }
      
      const { data: enquiries, error: enquiriesError } = await query;
      
      if (enquiriesError) throw enquiriesError;

      // Process lead sources first to debug
      const leadSourcesData = processLeadSources(enquiries, timeFrame);
      setLeadSources(leadSourcesData);

      // Fetch all salesman points
      const { data: points, error: pointsError } = await supabase
        .from('salesman_points')
        .select('*');
      
      console.log('Debug - Salesman Points Data:', {
        count: points?.length,
        sample: points?.slice(0, 3),
        error: pointsError,
        fields: points?.[0] ? Object.keys(points[0]) : []
      });

      if (pointsError) throw pointsError;

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');
      
      console.log('Debug - Products Data:', {
        count: products?.length,
        sample: products?.slice(0, 3),
        error: productsError,
        fields: products?.[0] ? Object.keys(products[0]) : []
      });

      if (productsError) throw productsError;

      // Fetch users (for salesman data)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');
      
      console.log('Debug - Users Data:', {
        count: users?.length,
        sample: users?.slice(0, 3),
        error: usersError,
        fields: users?.[0] ? Object.keys(users[0]) : []
      });

      if (usersError) throw usersError;

      // Store salespeople for filtering
      const salespeople = users.filter(user => 
        user.role === 'salesman' || user.can_edit_enquiries || user.can_edit_sales
      );
      setSalespeople(salespeople);

      // Process all data
      const processedSalesData = processEnquiriesData(enquiries, timeFrame);
      const topEnquired = processTopEnquiredProducts(enquiries, products);
      const topSold = processTopSoldProducts(enquiries, products);
      const salesmanData = processSalesmanPerformance(enquiries, points, users);

      console.log('Debug - Processed Data:', {
        processedSalesData: processedSalesData?.slice(0, 3),
        topEnquired: topEnquired?.slice(0, 3),
        topSold: topSold?.slice(0, 3),
        salesmanData: salesmanData?.slice(0, 3)
      });

      // Update state with processed data
      setSalesData(processedSalesData);
      setTopEnquiredProducts(topEnquired);
      setTopSoldProducts(topSold);
      setSalesmanPerformance(salesmanData);
      
      // Calculate summary statistics
      setTotalEnquiries(enquiries.length);
      setWonDeals(enquiries.filter(e => e.stage === 'Customer Won').length);
      setLostDeals(enquiries.filter(e => e.stage === 'Lost/Rejected').length);
      setPendingDeals(enquiries.filter(e => 
        e.stage !== 'Customer Won' && e.stage !== 'Lost/Rejected'
      ).length);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on component mount and when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate, timeFrame, salesmanFilter]);

  // Add a function to fetch product details by ID
  const getProductNameById = (productId, productsData) => {
    console.log('Debug - getProductNameById called with:', {
      productId,
      productsData,
      productIdType: typeof productId,
      productsDataLength: productsData?.length
    });

    // Try different ID fields
    const product = productsData.find(product => {
      const matches = [
        product.product_id === productId,
        product.id === productId,
        product.barcode_number === productId
      ];
      console.log('Debug - Product match attempt:', {
        product,
        matches,
        productId
      });
      return matches.some(match => match);
    });

    console.log('Debug - Found product:', product);
    return product ? (product.item_name || product.name || 'Unknown Product') : 'Unknown Product';
  };

  // When displaying enquiry data with products
  const renderEnquiryProducts = (enquiry, productsData) => {
    if (!enquiry.products) return 'No products';
    
    try {
      let productIds = enquiry.products;
      
      // If it's a string, try to parse it as JSON
      if (typeof productIds === 'string') {
        try {
          productIds = JSON.parse(productIds);
        } catch (e) {
          // If not valid JSON, it might be comma-separated IDs
          productIds = productIds.split(',').map(id => id.trim());
        }
      }
      
      // Ensure productIds is an array
      if (!Array.isArray(productIds)) {
        productIds = [productIds];
      }
      
      // Map product IDs to product names
      const productNames = productIds.map(id => {
        const product = findProductInDatabase({ product_id: id }, productsData);
        return getProductDisplayName(product);
      });
      
      return productNames.join(', ');
    } catch (error) {
      console.error('Error parsing product data:', error);
      return 'Error displaying products';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={fetchDashboardData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <DashboardIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
              <h1 className="text-2xl font-bold text-gray-900">Sales Performance Dashboard</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ClearIcon className="mr-2 h-5 w-5 text-gray-500" />
                Clear Filters
              </button>
              <button
                onClick={() => fetchDashboardData()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshIcon className="mr-2 h-5 w-5 text-gray-500" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <FilterAltIcon className="text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Dashboard Filters</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Time Frame</label>
                <select
                  value={timeFrame}
                  onChange={handleTimeFrameChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Salesperson</label>
                <select
                  value={salesmanFilter}
                  onChange={(e) => setSalesmanFilter(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Salespeople</option>
                  {salespeople.map(person => (
                    <option key={person.id} value={person.id}>{person.username}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <DatePicker
                      selected={startDate}
                      onChange={handleDateRangeChange}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      placeholderText="Start Date"
                    />
                  </div>
                  <div className="w-1/2">
                    <DatePicker
                      selected={endDate}
                      onChange={handleDateRangeChange}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      placeholderText="End Date"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-blue-500 p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Deals</dt>
                    <dd>
                      <div className="text-lg font-bold text-gray-900">{pendingDeals}</div>
                      <div className="text-sm text-gray-500">
                        {totalEnquiries > 0 ? ((pendingDeals / totalEnquiries) * 100).toFixed(1) : 0}% of total
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Performance Chart */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Sales Performance Over Time</h2>
                <button 
                  onClick={() => exportToCSV(salesData, 'sales_performance')}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (timeFrame === 'monthly' && value.includes('-')) {
                          // Convert YYYY-MM to MMM YYYY
                          const [year, month] = value.split('-');
                          return `${new Date(year, month - 1).toLocaleString('default', { month: 'short' })} ${year}`;
                        }
                        return value;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'sales') return [`${value} Total`, 'Enquiries'];
                        if (name === 'won') return [`${value} Won`, 'Deals'];
                        if (name === 'lost') return [`${value} Lost`, 'Deals'];
                        if (name === 'pending') return [`${value} Pending`, 'Deals'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" name="Total Enquiries" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="won" stroke="#10b981" name="Won Deals" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="lost" stroke="#ef4444" name="Lost Deals" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="Pending Deals" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Products and Conversion Rates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Enquired Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Top Enquired Products</h2>
                <button 
                  onClick={() => exportToCSV(topEnquiredProducts, 'top_enquired_products')}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="h-96 p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={topEnquiredProducts} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={150}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 22)}...` : value}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Enquiries">
                      {topEnquiredProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Sold Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Top Sold Products</h2>
                <button 
                  onClick={() => exportToCSV(topSoldProducts, 'top_sold_products')}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="h-96 p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={topSoldProducts} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={150}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 22)}...` : value}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" fill="#10b981" name="Units Sold">
                      {topSoldProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Salesperson Performance and Lead Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Salesperson Performance */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Salesperson Performance</h2>
                <button 
                  onClick={() => exportToCSV(salesmanPerformance, 'salesperson_performance')}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salesperson
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Deals
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Won
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lost
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Win Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesmanPerformance.map((person) => (
                    <tr key={person.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {person.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.totalDeals}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {person.wonDeals}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {person.lostDeals}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {person.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.conversionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lead Sources */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Lead Sources Effectiveness</h2>
                <button 
                  onClick={() => exportToCSV(leadSources, 'lead_sources')}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Leads
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Won
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lost
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Win Rate
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leadSources.map((source) => (
                      <tr key={source.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {source.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {source.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {source.won}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {source.lost}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {source.pending}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {source.winRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{source.avgValue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
                 