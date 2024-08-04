import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const AddStockOptions = ({
  fetchProducts,
  productDialogOpen,
  setProductDialogOpen,
  categoryDialogOpen,
  setCategoryDialogOpen,
  subcategoryDialogOpen,
  setSubcategoryDialogOpen,
  selectedProduct,
  setSelectedProduct,
}) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryCategoryId, setNewSubcategoryCategoryId] = useState('');
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    if (selectedProduct) {
      setProductName(selectedProduct.product_name);
      setBrand(selectedProduct.brand);
      setProductCategory(selectedProduct.category_id);
      setProductSubcategory(selectedProduct.subcategory_id);
      setProductPrice(selectedProduct.price);
      setProductMinStock(selectedProduct.min_stock);
      setProductCurrentStock(selectedProduct.current_stock);
      setProductSerialNumber(selectedProduct.serial_number);
      setProductItemName(selectedProduct.item_name);
      setProductItemAlias(selectedProduct.item_alias);
      setProductPartNumber(selectedProduct.part_number);
      setProductModel(selectedProduct.model);
      setProductRemarks(selectedProduct.remarks);
      setProductStockGroup(selectedProduct.stock_group);
      setProductImagePreview(selectedProduct.image_link);
    }
  }, [selectedProduct]);

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

  const handleCloseProductDialog = () => {
    setSelectedProduct(null);
    setProductDialogOpen(false);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
  };

  const handleCloseSubcategoryDialog = () => {
    setSubcategoryDialogOpen(false);
  };

  const handleAddCategory = async () => {
    const { error } = await supabase.from('categories').insert([{ category_name: newCategoryName }]);
    if (error) {
      showSnackbar(`Error adding category: ${error.message}`, 'error');
    } else {
      showSnackbar('Category added successfully', 'success');
      fetchCategories();
      handleCloseCategoryDialog();
    }
  };

  const handleAddSubcategory = async () => {
    const { error } = await supabase
      .from('subcategories')
      .insert([{ subcategory_name: newSubcategoryName, category_id: newSubcategoryCategoryId }]);
    if (error) {
      showSnackbar(`Error adding subcategory: ${error.message}`, 'error');
    } else {
      showSnackbar('Subcategory added successfully', 'success');
      fetchSubcategories();
      handleCloseSubcategoryDialog();
    }
  };

  const handleAddProduct = async () => {
    try {
      let imageUrl = '';

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

      let error;
      if (selectedProduct) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('product_id', selectedProduct.product_id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('products').insert([productData]);
        error = insertError;
      }

      if (error) {
        showSnackbar(`Error ${selectedProduct ? 'updating' : 'adding'} product: ${error.message}`, 'error');
      } else {
        showSnackbar(`Product ${selectedProduct ? 'updated' : 'added'} successfully`, 'success');
        fetchProducts();
        handleCloseProductDialog();
      }
    } catch (error) {
      showSnackbar(`Unexpected error: ${error.message}`, 'error');
    }
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

  return (
    <div>
      <Dialog open={categoryDialogOpen} onClose={handleCloseCategoryDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add Category</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Category Name"
              variant="outlined"
              fullWidth
              margin="dense"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddCategory} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={subcategoryDialogOpen} onClose={handleCloseSubcategoryDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add Subcategory</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              value={newSubcategoryCategoryId}
              onChange={(e) => setNewSubcategoryCategoryId(e.target.value)}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Subcategory Name"
              variant="outlined"
              fullWidth
              margin="dense"
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubcategoryDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddSubcategory} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

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
                  .filter((sub) => sub.category_id === parseInt(productCategory, 10))
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
            {productImagePreview && (
              <Box sx={{ mt: 2 }}>
                <img 
                  src={productImagePreview} 
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
          <Button onClick={handleAddProduct} color="primary">
            {selectedProduct ? 'Update' : 'Add'}
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

export default AddStockOptions;
