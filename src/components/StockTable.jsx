import React, { useState, useEffect, useCallback } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {
  TextField,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  FormControl,
  Box,
  Typography,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  FilterList as FilterListIcon,
  Storage as StorageIcon,
  Download as DownloadIcon,
  Category as CategoryIcon,
  SubdirectoryArrowRight as SubcategoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import DownloadDialog from './DownloadDialog';
import AddStockOptions from './AddStockOptions';
import ManageCategoriesDialog from './ManageCategoriesDialog';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const StockTable = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [manageCategoriesDialogOpen, setManageCategoriesDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    index: true,
    serialNumber: true,
    productName: true,
    brand: true,
    category: true,
    subcategory: true,
    price: true,
    minStock: true,
    currentStock: true,
    itemName: true,
    itemAlias: true,
    partNumber: true,
    model: true,
    remarks: true,
    stockGroup: true,
    imageLink: true,
  });
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [optionsAnchorEl, setOptionsAnchorEl] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState('');
  const [unsupportedFile, setUnsupportedFile] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  const fetchSubcategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('subcategories').select('*');
      if (error) throw error;
      setSubcategories(data);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubcategories();
  }, [fetchProducts, fetchCategories, fetchSubcategories]);

  useEffect(() => {
    const filterProducts = () => {
      const results = products.filter((product) => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          product.product_name?.toLowerCase().includes(searchTermLower) ||
          product.brand?.toLowerCase().includes(searchTermLower) ||
          categories.find((cat) => cat.category_id === product.category_id)?.category_name?.toLowerCase().includes(searchTermLower) ||
          subcategories.find((sub) => sub.subcategory_id === product.subcategory_id)?.subcategory_name?.toLowerCase().includes(searchTermLower) ||
          product.serial_number?.toLowerCase().includes(searchTermLower) ||
          product.item_name?.toLowerCase().includes(searchTermLower) ||
          product.item_alias?.toLowerCase().includes(searchTermLower) ||
          product.part_number?.toLowerCase().includes(searchTermLower) ||
          product.model?.toLowerCase().includes(searchTermLower) ||
          product.remarks?.toLowerCase().includes(searchTermLower) ||
          product.stock_group?.toLowerCase().includes(searchTermLower)
        );
      });

      if (filter === 'lowStock') {
        setFilteredProducts(results.filter((product) => product.current_stock <= product.min_stock));
      } else {
        setFilteredProducts(results);
      }
    };

    filterProducts();
  }, [products, searchTerm, filter, categories, subcategories]);

  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleSettingsMenuOpen = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleAddMenuOpen = (event) => {
    setAddAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setFilterAnchorEl(null);
    setSettingsAnchorEl(null);
    setAddAnchorEl(null);
    setOptionsAnchorEl(null);
  };

  const handleOpenProductDialog = () => {
    setProductDialogOpen(true);
    handleMenuClose();
  };

  const handleOpenCategoryDialog = () => {
    setCategoryDialogOpen(true);
    handleMenuClose();
  };

  const handleOpenSubcategoryDialog = () => {
    setSubcategoryDialogOpen(true);
    handleMenuClose();
  };

  const handleOpenManageCategoriesDialog = () => {
    setManageCategoriesDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseProductDialog = () => {
    setProductDialogOpen(false);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
  };

  const handleCloseSubcategoryDialog = () => {
    setSubcategoryDialogOpen(false);
  };

  const handleCloseManageCategoriesDialog = () => {
    setManageCategoriesDialogOpen(false);
  };

  const handleDownloadDialogOpen = () => {
    setOpenDownloadDialog(true);
  };

  const handleDownloadDialogClose = () => {
    setOpenDownloadDialog(false);
  };

  const handleDownloadCSV = () => {
    const visibleProducts = filteredProducts.map((product, index) => {
      const result = {};
      result['Index'] = page * rowsPerPage + index + 1;
      if (visibleColumns.serialNumber) result['Serial Number'] = product.serial_number;
      if (visibleColumns.productName) result['Product Name'] = product.product_name;
      if (visibleColumns.brand) result['Brand'] = product.brand;
      if (visibleColumns.category) result['Category'] = categories.find((cat) => cat.category_id === product.category_id)?.category_name;
      if (visibleColumns.subcategory) result['Subcategory'] = subcategories.find((sub) => sub.subcategory_id === product.subcategory_id)?.subcategory_name;
      if (visibleColumns.price) result['Price'] = product.price;
      if (visibleColumns.minStock) result['Min Stock'] = product.min_stock;
      if (visibleColumns.currentStock) result['Current Stock'] = product.current_stock;
      if (visibleColumns.itemName) result['Item Name'] = product.item_name;
      if (visibleColumns.itemAlias) result['Item Alias'] = product.item_alias;
      if (visibleColumns.partNumber) result['Part Number'] = product.part_number;
      if (visibleColumns.model) result['Model'] = product.model;
      if (visibleColumns.remarks) result['Remarks'] = product.remarks;
      if (visibleColumns.stockGroup) result['Stock Group'] = product.stock_group;
      if (visibleColumns.imageLink) result['Image Link'] = product.image_link;
      return result;
    });

    const csv = Papa.unparse(visibleProducts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(18);
    doc.text('Product Data', pageWidth / 2, 30, { align: 'center' });

    const columns = [
      { header: 'Index', dataKey: 'index' },
      ...Object.entries(visibleColumns)
        .filter(([key, visible]) => visible && key !== 'imageLink')
        .map(([key]) => ({
          header: key.replace(/([A-Z])/g, ' \$1').trim(),
          dataKey: key,
        }))
    ];

    const data = filteredProducts.map((product, index) => {
      const result = {};
      result.index = page * rowsPerPage + index + 1;
      if (visibleColumns.serialNumber) result.serialNumber = product.serial_number || '';
      if (visibleColumns.productName) result.productName = product.product_name || '';
      if (visibleColumns.brand) result.brand = product.brand || '';
      if (visibleColumns.category) result.category = categories.find((cat) => cat.category_id === product.category_id)?.category_name || '';
      if (visibleColumns.subcategory) result.subcategory = subcategories.find((sub) => sub.subcategory_id === product.subcategory_id)?.subcategory_name || '';
      if (visibleColumns.price) result.price = product.price !== undefined ? product.price.toFixed(2) : '';
      if (visibleColumns.minStock) result.minStock = product.min_stock || '';
      if (visibleColumns.currentStock) result.currentStock = product.current_stock || '';
      if (visibleColumns.itemName) result.itemName = product.item_name || '';
      if (visibleColumns.itemAlias) result.itemAlias = product.item_alias || '';
      if (visibleColumns.partNumber) result.partNumber = product.part_number || '';
      if (visibleColumns.model) result.model = product.model || '';
      if (visibleColumns.remarks) result.remarks = product.remarks || '';
      if (visibleColumns.stockGroup) result.stockGroup = product.stock_group || '';
      return result;
    });

    doc.autoTable({
      columns,
      body: data,
      startY: 50,
      margin: { top: 50, right: 30, bottom: 40, left: 30 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [66, 135, 245],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      columnStyles: {
        price: { halign: 'right' },
        minStock: { halign: 'right' },
        currentStock: { halign: 'right' },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      },
    });

    doc.save('products.pdf');
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getCurrentStockColor = (current, min) => {
    if (current <= min) return 'red';
    if (current > min) return 'green';
    return 'gray';
  };

  const handleOptionsMenuOpen = (event, product) => {
    setOptionsAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleDeleteProduct = async () => {
    try {
      const { error } = await supabase.from('products').delete().eq('product_id', selectedProduct.product_id);
      if (error) throw error;
      showSnackbar('Product deleted successfully', 'success');
      fetchProducts();
    } catch (error) {
      setError(error.message);
      showSnackbar(error.message, 'error');
    }
    handleMenuClose();
  };

  const handleEditProduct = () => {
    setProductDialogOpen(true);
    handleMenuClose();
  };

  const handleFilterChange = (filterType) => {
    setFilter(filterType);
    handleMenuClose();
  };

  const handleFilePreview = async (filePath) => {
    const { data, error } = await supabase.storage.from('files').download(filePath);
    if (error) {
      showSnackbar(`Error fetching file: ${error.message}`, 'error');
    } else {
      const url = URL.createObjectURL(data);
      const fileType = data.type;
      setUnsupportedFile(false);

      if (fileType === 'application/pdf') {
        setUnsupportedFile(true);
        setSelectedFileUrl('');
      } else if (fileType.startsWith('image/')) {
        setSelectedFileUrl(url);
      } else {
        setUnsupportedFile(true);
        setSelectedFileUrl('');
      }
      setFileDialogOpen(true);
    }
  };

  const getFileIcon = (filePath) => {
    const extension = filePath.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return <ImageIcon />;
    } else if (extension === 'pdf') {
      return <PdfIcon />;
    } else {
      return <FileIcon />;
    }
  };

  const handleCloseFileDialog = () => {
    setFileDialogOpen(false);
    setSelectedFileUrl('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <StorageIcon className="text-blue-500" style={{ fontSize: '1.75rem' }} />
              <h1 className="text-xl font-semibold ml-2">Stock</h1>
            </div>
            <div className="flex items-center space-x-4">
              <TextField
                variant="outlined"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                size="small"
              />
              <Tooltip title="Download">
                <IconButton
                  onClick={handleDownloadDialogOpen}
                  style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}
                >
                  <DownloadIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add">
                <IconButton onClick={handleAddMenuOpen} style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}>
                  <AddIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filter">
                <IconButton onClick={handleFilterMenuOpen} style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}>
                  <FilterListIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton onClick={handleSettingsMenuOpen} style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}>
                  <SettingsIcon style={{ fontSize: '1.75rem' }} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow p-4 space-x-4 overflow-x-auto">
        <TableContainer component={Paper} className="shadow-md sm:rounded-lg overflow-auto">
          <Table stickyHeader className="min-w-full">
            <TableHead>
              <TableRow>
                {visibleColumns.index && <TableCell align="center" sx={{ fontWeight: 'bold', color: 'black' }}>No</TableCell>}
                {visibleColumns.serialNumber && <TableCell align="center" sx={{ fontWeight: 'bold', color: 'black' }}>Serial Number</TableCell>}
                {Object.entries(visibleColumns).map(
                  ([key, value]) =>
                    value && key !== 'index' && key !== 'serialNumber' && key !== 'imageLink' && (
                      <TableCell key={key} sx={{ fontWeight: 'bold', color: 'black' }}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                      </TableCell>
                    )
                )}
                {visibleColumns.imageLink && <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Image</TableCell>}
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Options</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((product, index) => (
                <TableRow key={product.product_id} className="bg-white border-b">
                  {visibleColumns.index && <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>}
                  {visibleColumns.serialNumber && <TableCell align="center">{product.serial_number}</TableCell>}
                  {visibleColumns.productName && <TableCell>{product.product_name}</TableCell>}
                  {visibleColumns.brand && <TableCell>{product.brand}</TableCell>}
                  {visibleColumns.category && (
                    <TableCell>
                      {categories.find((cat) => cat.category_id === product.category_id)?.category_name}
                    </TableCell>
                  )}
                  {visibleColumns.subcategory && (
                    <TableCell>
                      {subcategories.find((sub) => sub.subcategory_id === product.subcategory_id)
                        ?.subcategory_name}
                    </TableCell>
                  )}
                  {visibleColumns.price && <TableCell>{product.price}</TableCell>}
                  {visibleColumns.minStock && <TableCell>{product.min_stock}</TableCell>}
                  {visibleColumns.currentStock && (
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        color: getCurrentStockColor(product.current_stock, product.min_stock),
                      }}
                    >
                      {product.current_stock}
                    </TableCell>
                  )}
                  {visibleColumns.itemName && <TableCell>{product.item_name}</TableCell>}
                  {visibleColumns.itemAlias && <TableCell>{product.item_alias}</TableCell>}
                  {visibleColumns.partNumber && <TableCell>{product.part_number}</TableCell>}
                  {visibleColumns.model && <TableCell>{product.model}</TableCell>}
                  {visibleColumns.remarks && <TableCell>{product.remarks}</TableCell>}
                  {visibleColumns.stockGroup && <TableCell>{product.stock_group}</TableCell>}
                  {visibleColumns.imageLink && (
                    <TableCell>
                      {product.image_link ? (
                        <Tooltip title="Preview file">
                          <IconButton onClick={() => handleFilePreview(product.image_link)}>
                            {getFileIcon(product.image_link)}
                          </IconButton>
                        </Tooltip>
                      ) : (
                        'No image'
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Tooltip title="More options">
                      <IconButton onClick={(event) => handleOptionsMenuOpen(event, product)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredProducts.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        <div className="flex justify-end mt-4">
          <Typography variant="body2" color="textSecondary">
            Total entries: {filteredProducts.length}
          </Typography>
        </div>
      </div>

      <Menu anchorEl={addAnchorEl} open={Boolean(addAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleOpenProductDialog}>
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>
          <ListItemText primary="Add Product" />
        </MenuItem>
        <MenuItem onClick={handleOpenCategoryDialog}>
          <ListItemIcon>
            <CategoryIcon />
          </ListItemIcon>
          <ListItemText primary="Add Category" />
        </MenuItem>
        <MenuItem onClick={handleOpenSubcategoryDialog}>
          <ListItemIcon>
            <SubcategoryIcon />
          </ListItemIcon>
          <ListItemText primary="Add Subcategory" />
        </MenuItem>
        <MenuItem onClick={handleOpenManageCategoriesDialog}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Manage Categories" />
        </MenuItem>
      </Menu>

      <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleFilterChange('all')}>
          All
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('lowStock')}>
          Low Stock
        </MenuItem>
      </Menu>

      <Menu anchorEl={settingsAnchorEl} open={Boolean(settingsAnchorEl)} onClose={handleMenuClose}>
        <Box sx={{ p: 2 }}>
          <FormControl component="fieldset" variant="standard">
            {Object.entries(visibleColumns).map(([key, value]) => (
              <MenuItem key={key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={value}
                      onChange={(event) => setVisibleColumns({ ...visibleColumns, [key]: event.target.checked })}
                      name={key}
                    />
                  }
                  label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                />
              </MenuItem>
            ))}
          </FormControl>
        </Box>
      </Menu>

      <Menu anchorEl={optionsAnchorEl} open={Boolean(optionsAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditProduct}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={handleDeleteProduct}>
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      <AddStockOptions
        fetchProducts={fetchProducts}
        productDialogOpen={productDialogOpen}
        setProductDialogOpen={setProductDialogOpen}
        categoryDialogOpen={categoryDialogOpen}
        setCategoryDialogOpen={setCategoryDialogOpen}
        subcategoryDialogOpen={subcategoryDialogOpen}
        setSubcategoryDialogOpen={setSubcategoryDialogOpen}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
      />

      <ManageCategoriesDialog
        open={manageCategoriesDialogOpen}
        handleClose={handleCloseManageCategoriesDialog}
      />

      <DownloadDialog
        open={openDownloadDialog}
        handleClose={handleDownloadDialogClose}
        handleDownloadCSV={handleDownloadCSV}
        handleDownloadPDF={handleDownloadPDF}
      />

      <Dialog open={fileDialogOpen} onClose={handleCloseFileDialog} maxWidth="sm" fullWidth>
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          {unsupportedFile ? (
            <Typography variant="body1">
              Unsupported file type for preview. Download it to view.
            </Typography>
          ) : selectedFileUrl ? (
            <img src={selectedFileUrl} alt="Preview" style={{ width: '100%', maxHeight: '600px', objectFit: 'contain' }} />
          ) : (
            <Typography variant="body1">
              Unsupported file type for preview. Download it to view.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFileDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {error && (
        <Snackbar
          open={true}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </div>
  );
};

export default StockTable;
