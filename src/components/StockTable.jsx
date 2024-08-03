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
  Inventory as InventoryIcon,
  Download as DownloadIcon,
  Category as CategoryIcon,
  SubdirectoryArrowRight as SubdirectoryArrowRightIcon,
  Storage as StorageIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

const StockTable = () => {
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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubcategories();
  }, []);

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

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setProductName(product.product_name);
    setBrand(product.brand);
    setProductCategory(product.category_id);
    setProductSubcategory(product.subcategory_id);
    setProductPrice(product.price);
    setProductMinStock(product.min_stock);
    setProductCurrentStock(product.current_stock);
    setProductSerialNumber(product.serial_number);
    setProductItemName(product.item_name);
    setProductItemAlias(product.item_alias);
    setProductPartNumber(product.part_number);
    setProductModel(product.model);
    setProductRemarks(product.remarks);
    setProductStockGroup(product.stock_group);
    setProductImageUrl(product.image_link);
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      let imageUrl = productImageUrl; // Keep the existing image URL if provided

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

  const handleDeleteProduct = (product_id) => {
    setSelectedProduct(product_id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    const { error } = await supabase.from('products').delete().eq('product_id', selectedProduct);
    if (error) {
      showSnackbar(`Error deleting product: ${error.message}`, 'error');
    } else {
      showSnackbar('Product deleted successfully', 'success');
      fetchProducts();
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleCloseProductDialog = () => {
    setSelectedProduct(null);
    setProductName('');
    setBrand('');
    setProductCategory('');
    setProductSubcategory('');
    setProductPrice('');
    setProductMinStock('');
    setProductCurrentStock('');
    setProductSerialNumber('');
    setProductItemName('');
    setProductItemAlias('');
    setProductPartNumber('');
    setProductModel('');
    setProductRemarks('');
    setProductStockGroup('');
    setProductImageUrl('');
    setProductImage(null);
    setProductImagePreview('');
    setProductDialogOpen(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setProductImage(file);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const getCurrentStockColor = (current, min) => {
    if (current <= min) return 'red';
    if (current > min) return 'green';
    return 'gray';
  };

  const handleVisibleColumnChange = (event) => {
    setVisibleColumns({ ...visibleColumns, [event.target.name]: event.target.checked });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearchTerm =
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categories.find((cat) => cat.category_id === product.category_id)?.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcategories.find((sub) => sub.subcategory_id === product.subcategory_id)?.subcategory_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.price.toString().includes(searchTerm.toLowerCase()) ||
      product.min_stock.toString().includes(searchTerm.toLowerCase()) ||
      product.current_stock.toString().includes(searchTerm.toLowerCase());

    if (filterStockLevel) {
      const color = getCurrentStockColor(product.current_stock, product.min_stock);
      return matchesSearchTerm && color === filterStockLevel;
    }
    return matchesSearchTerm;
  });

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
                        {key.charAt(0).toUpperCase() +
                          key.slice(1).replace(/([A-Z])/g, ' $1').trim()}
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

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography>Are you sure you want to delete this product?</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteProduct} color="primary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default StockTable;
