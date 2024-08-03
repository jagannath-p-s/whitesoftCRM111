import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Checkbox,
  FormControlLabel,
  FormControl,
  Box,
  Typography,
  Select,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  FilterList as FilterListIcon,
  Storage as StorageIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  Category as CategoryIcon,
  SubdirectoryArrowRight as SubdirectoryArrowRightIcon,
} from '@mui/icons-material';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DownloadDialog from './DownloadDialog';

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productSubcategory, setProductSubcategory] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productMinStock, setProductMinStock] = useState('');
  const [productCurrentStock, setProductCurrentStock] = useState('');
  const [productSerialNumber, setProductSerialNumber] = useState('');
  const [productItemName, setProductItemName] = useState('');
  const [productItemAlias, setProductItemAlias] = useState('');
  const [productPartNumber, setProductPartNumber] = useState('');
  const [productModel, setProductModel] = useState('');
  const [productRemarks, setProductRemarks] = useState('');
  const [productStockGroup, setProductStockGroup] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStockLevel, setFilterStockLevel] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    productName: true,
    brand: true,
    category: true,
    subcategory: true,
    price: true,
    minStock: true,
    currentStock: true,
    serialNumber: true,
    itemName: true,
    itemAlias: true,
    partNumber: true,
    model: true,
    remarks: true,
    stockGroup: true,
    imageLink: true,
  });
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    const results = products.filter((product) => {
      return product.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredProducts(results);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      showSnackbar(`Error fetching products: ${error.message}`, 'error');
    } else {
      setProducts(data);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
      showSnackbar(`Error fetching categories: ${error.message}`, 'error');
    } else {
      setCategories(data);
    }
  };

  const fetchSubcategories = async () => {
    const { data, error } = await supabase.from('subcategories').select('*');
    if (error) {
      showSnackbar(`Error fetching subcategories: ${error.message}`, 'error');
    } else {
      setSubcategories(data);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsMenuOpen = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSettingsAnchorEl(null);
    setFilterAnchorEl(null);
  };

  const handleOpenProductDialog = () => {
    setSelectedProduct(null);
    resetProductFields();
    setProductDialogOpen(true);
  };

  const handleCloseProductDialog = () => {
    setProductDialogOpen(false);
  };

  const handleDeleteProduct = async (productId) => {
    const { error } = await supabase.from('products').delete().eq('product_id', productId);
    if (error) {
      showSnackbar(`Error deleting product: ${error.message}`, 'error');
    } else {
      fetchProducts();
      setDeleteDialogOpen(false);
      showSnackbar('Product deleted successfully', 'success');
    }
  };

  const handleDownloadCSV = () => {
    const visibleProducts = products.map((product) => {
      const result = {};
      if (visibleColumns.productName) result['Product Name'] = product.product_name;
      if (visibleColumns.brand) result['Brand'] = product.brand;
      if (visibleColumns.category) result['Category'] = categories.find((cat) => cat.category_id === product.category_id)?.category_name;
      if (visibleColumns.subcategory) result['Subcategory'] = subcategories.find((sub) => sub.subcategory_id === product.subcategory_id)?.subcategory_name;
      if (visibleColumns.price) result['Price'] = product.price;
      if (visibleColumns.minStock) result['Min Stock'] = product.min_stock;
      if (visibleColumns.currentStock) result['Current Stock'] = product.current_stock;
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
  
    // Title
    doc.setFontSize(18);
    doc.text('Product Data', pageWidth / 2, 30, { align: 'center' });
  
    const columns = Object.entries(visibleColumns)
      .filter(([_, visible]) => visible)
      .map(([key]) => ({
        header: key.replace(/([A-Z])/g, ' $1').trim(),
        dataKey: key
      }));
  
    const data = filteredProducts.map(product => {
      const result = {};
      if (visibleColumns.productName) result.productName = product.product_name || '';
      if (visibleColumns.brand) result.brand = product.brand || '';
      if (visibleColumns.category) result.category = categories.find(cat => cat.category_id === product.category_id)?.category_name || '';
      if (visibleColumns.subcategory) result.subcategory = subcategories.find(sub => sub.subcategory_id === product.subcategory_id)?.subcategory_name || '';
      if (visibleColumns.price) result.price = product.price ? `$${product.price.toFixed(2)}` : '';
      if (visibleColumns.minStock) result.minStock = product.min_stock || '';
      if (visibleColumns.currentStock) result.currentStock = product.current_stock || '';
      if (visibleColumns.serialNumber) result.serialNumber = product.serial_number || '';
      if (visibleColumns.itemName) result.itemName = product.item_name || '';
      if (visibleColumns.itemAlias) result.itemAlias = product.item_alias || '';
      if (visibleColumns.partNumber) result.partNumber = product.part_number || '';
      if (visibleColumns.model) result.model = product.model || '';
      if (visibleColumns.remarks) result.remarks = product.remarks || '';
      if (visibleColumns.stockGroup) result.stockGroup = product.stock_group || '';
      return result;
    });
  
    doc.autoTable({
      columns: columns,
      body: data,
      startY: 50,
      margin: { top: 50, right: 30, bottom: 40, left: 30 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [66, 135, 245],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        price: { halign: 'right' },
        minStock: { halign: 'right' },
        currentStock: { halign: 'right' }
      },
      didDrawPage: (data) => {
        // Footer
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });
  
    doc.save('products.pdf');
  };
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleViewImage = (url) => {
    setProductImageUrl(url);
    setImageDialogOpen(true);
  };

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
    setProductImageUrl('');
  };

  const handleProductMenuOpen = (event, product) => {
    setProductAnchorEl(event.currentTarget);
    setSelectedProductForMenu(product);
  };

  const handleProductMenuClose = () => {
    setProductAnchorEl(null);
    setSelectedProductForMenu(null);
  };

  const handleOpenCategoryDialog = () => {
    setCategoryDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
  };

  const handleOpenSubcategoryDialog = () => {
    setSubcategoryDialogOpen(true);
  };

  const handleCloseSubcategoryDialog = () => {
    setSubcategoryDialogOpen(false);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const confirmDeleteProduct = () => {
    if (selectedProduct) {
      handleDeleteProduct(selectedProduct.product_id);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(file);
        setProductImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async () => {
    try {
      let imageUrl = productImageUrl;

      if (productImage) {
        const fileName = `${Date.now()}-${productImage.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('files')
          .upload(fileName, productImage);

        if (uploadError) {
          showSnackbar(`Error uploading image: ${uploadError.message}`, 'error');
          return;
        }

        const { publicUrl } = supabase.storage
          .from('files')
          .getPublicUrl(fileName)
          .data;

        if (!publicUrl) {
          showSnackbar("Public URL is undefined. Check your storage settings.", 'error');
          return;
        }

        imageUrl = publicUrl;
      }

      const productData = {
        serial_number: productSerialNumber || null,
        item_name: productItemName || null,
        item_alias: productItemAlias || null,
        part_number: productPartNumber || null,
        model: productModel || null,
        remarks: productRemarks || null,
        stock_group: productStockGroup || null,
        product_name: productName || null,
        brand: brand || null,
        category_id: productCategory ? parseInt(productCategory, 10) : null,
        subcategory_id: productSubcategory ? parseInt(productSubcategory, 10) : null,
        price: productPrice ? parseFloat(productPrice) : null,
        min_stock: productMinStock ? parseInt(productMinStock, 10) : null,
        current_stock: productCurrentStock ? parseInt(productCurrentStock, 10) : null,
        image_link: imageUrl || null,
      };

      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('product_id', selectedProduct.product_id);

      if (error) {
        showSnackbar(`Error updating product: ${error.message}`, 'error');
      } else {
        showSnackbar('Product updated successfully', 'success');
        fetchProducts();
        setProductDialogOpen(false);
      }
    } catch (error) {
      showSnackbar(`Unexpected error: ${error.message}`, 'error');
    }
  };

  const resetProductFields = () => {
    setProductSerialNumber('');
    setProductItemName('');
    setProductItemAlias('');
    setProductPartNumber('');
    setProductModel('');
    setProductRemarks('');
    setProductStockGroup('');
    setProductName('');
    setBrand('');
    setProductCategory('');
    setProductSubcategory('');
    setProductPrice('');
    setProductMinStock('');
    setProductCurrentStock('');
    setProductImage(null);
    setProductImagePreview('');
    setProductImageUrl('');
  };

  const getCurrentStockColor = (current, min) => {
    if (current <= min) return 'red';
    if (current > min) return 'green';
    return 'gray';
  };

  const handleVisibleColumnChange = (event) => {
    setVisibleColumns({ ...visibleColumns, [event.target.name]: event.target.checked });
  };

  const handleFilterChange = (event) => {
    setFilterStockLevel(event.target.value);
  };

  const handleDownloadDialogOpen = () => {
    setOpenDownloadDialog(true);
  };

  const handleDownloadDialogClose = () => {
    setOpenDownloadDialog(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="bg-white shadow-md ">
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
                <IconButton onClick={handleMenuOpen} style={{ backgroundColor: '#e3f2fd', color: '#1e88e5', borderRadius: '12px' }}>
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
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleOpenProductDialog} sx={{ padding: '12px 24px' }}>
                  <ListItemIcon>
                    <AddIcon fontSize="medium" />
                  </ListItemIcon>
                  <ListItemText primary="Add Product" />
                </MenuItem>
                <MenuItem onClick={handleOpenCategoryDialog} sx={{ padding: '12px 24px' }}>
                  <ListItemIcon>
                    <CategoryIcon fontSize="medium" />
                  </ListItemIcon>
                  <ListItemText primary="Add Category" />
                </MenuItem>
                <MenuItem onClick={handleOpenSubcategoryDialog} sx={{ padding: '12px 24px' }}>
                  <ListItemIcon>
                    <SubdirectoryArrowRightIcon fontSize="medium" />
                  </ListItemIcon>
                  <ListItemText primary="Add Subcategory" />
                </MenuItem>
              </Menu>
              <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => { handleFilterChange({ target: { value: '' } }); handleMenuClose(); }}>
                  All
                </MenuItem>
                <MenuItem onClick={() => { handleFilterChange({ target: { value: 'red' } }); handleMenuClose(); }}>
                  Low Stock
                </MenuItem>
                <MenuItem onClick={() => { handleFilterChange({ target: { value: 'green' } }); handleMenuClose(); }}>
                  In Stock
                </MenuItem>
              </Menu>
              <Menu anchorEl={settingsAnchorEl} open={Boolean(settingsAnchorEl)} onClose={handleMenuClose}>
                <Box sx={{ p: 2 }}>
                  <FormControl component="fieldset" variant="standard">
                    {Object.entries(visibleColumns).map(([key, value]) => (
                      <FormControlLabel
                        key={key}
                        control={
                          <Checkbox
                            checked={value}
                            onChange={handleVisibleColumnChange}
                            name={key}
                          />
                        }
                        label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                      />
                    ))}
                  </FormControl>
                </Box>
              </Menu>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow p-4 space-x-4 overflow-x-auto">
        <TableContainer component={Paper} className="shadow-md sm:rounded-lg overflow-auto">
          <Table stickyHeader className="min-w-full">
            <TableHead>
              <TableRow>
                {Object.entries(visibleColumns).map(
                  ([key, value]) =>
                    value && (
                      <TableCell key={key} sx={{ fontWeight: 'bold', color: 'black' }}>
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                      </TableCell>
                    )
                )}
                <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product, index) => (
                <TableRow key={product.product_id} className="bg-white border-b">
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
                  {visibleColumns.serialNumber && <TableCell>{product.serial_number}</TableCell>}
                  {visibleColumns.itemName && <TableCell>{product.item_name}</TableCell>}
                  {visibleColumns.itemAlias && <TableCell>{product.item_alias}</TableCell>}
                  {visibleColumns.partNumber && <TableCell>{product.part_number}</TableCell>}
                  {visibleColumns.model && <TableCell>{product.model}</TableCell>}
                  {visibleColumns.remarks && <TableCell>{product.remarks}</TableCell>}
                  {visibleColumns.stockGroup && <TableCell>{product.stock_group}</TableCell>}
                  {visibleColumns.imageLink && (
                    <TableCell>
                      <Tooltip title="View Image">
                        <IconButton onClick={() => handleViewImage(product.image_link)}>
                          <ImageIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                  <TableCell>
                    <Tooltip title="More options">
                      <IconButton onClick={(event) => handleEditProduct(product)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEditProduct(product)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDeleteProduct(product.product_id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <Dialog open={productDialogOpen} onClose={handleCloseProductDialog} fullWidth maxWidth="sm">
        <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Serial Number"
              variant="outlined"
              fullWidth
              margin="dense"
              value={productSerialNumber}
              onChange={(e) => setProductSerialNumber(e.target.value)}
            />
            <TextField
              label="Item Name"
              variant="outlined"
              fullWidth
              margin="dense"
              value={productItemName}
              onChange={(e) => setProductItemName(e.target.value)}
            />
            <TextField
              label="Item Alias"
              variant="outlined"
              fullWidth
              margin="dense"
              value={productItemAlias}
              onChange={(e) => setProductItemAlias(e.target.value)}
            />
            <TextField
              label="Part Number"
              variant="outlined"
              fullWidth
              margin="dense"
              value={productPartNumber}
              onChange={(e) => setProductPartNumber(e.target.value)}
            />
            <TextField
              label="Model"
              variant="outlined"
              fullWidth
              margin="dense"
              value={productModel}
              onChange={(e) => setProductModel(e.target.value)}
            />
            <TextField
              label="Remarks"
              variant="outlined"
              fullWidth
              margin="dense"
              value={productRemarks}
              onChange={(e) => setProductRemarks(e.target.value)}
            />
            <TextField
              label="Stock Group"
              variant="outlined"
              fullWidth
              margin="dense"
              value={productStockGroup}
              onChange={(e) => setProductStockGroup(e.target.value)}
            />
            <TextField
              label="Product Name"
              variant="outlined"
              fullWidth
              margin="dense"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
            <TextField
              label="Brand"
              variant="outlined"
              fullWidth
              margin="dense"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Category</InputLabel>
              <Select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Subcategory</InputLabel>
              <Select
                value={productSubcategory}
                onChange={(e) => setProductSubcategory(e.target.value)}
                label="Subcategory"
              >
                {subcategories
                  .filter((sub) => sub.category_id === productCategory)
                  .map((subcategory) => (
                    <MenuItem key={subcategory.subcategory_id} value={subcategory.subcategory_id}>
                      {subcategory.subcategory_name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <TextField
              label="Price"
              variant="outlined"
              fullWidth
              margin="dense"
              type="number"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
            />
            <TextField
              label="Min Stock"
              variant="outlined"
              fullWidth
              margin="dense"
              type="number"
              value={productMinStock}
              onChange={(e) => setProductMinStock(e.target.value)}
            />
            <TextField
              label="Current Stock"
              variant="outlined"
              fullWidth
              margin="dense"
              type="number"
              value={productCurrentStock}
              onChange={(e) => setProductCurrentStock(e.target.value)}
            />
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="product-image-upload"
              type="file"
              onChange={handleImageUpload}
            />
            <label htmlFor="product-image-upload">
              <Button
                variant="contained"
                color="primary"
                component="span"
                startIcon={<CloudUploadIcon />}
                sx={{ mt: 2 }}
              >
                Upload Image
              </Button>
            </label>
            {(productImagePreview || productImageUrl) && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={productImagePreview || productImageUrl}
                  alt="Product"
                  style={{ maxWidth: '100%', maxHeight: 200 }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveProduct} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} fullWidth maxWidth="sm">
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography>Are you sure you want to delete this product?</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteProduct} color="primary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <DownloadDialog
        open={openDownloadDialog}
        handleClose={handleDownloadDialogClose}
        handleDownloadCSV={handleDownloadCSV}
        handleDownloadPDF={handleDownloadPDF}
      />

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
    </div>
  );
};

export default Stock;
