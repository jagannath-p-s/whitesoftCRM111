import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { supabase } from '../../supabaseClient';

const AddStockOptions = ({
  fetchProducts,
  productDialogOpen,
  setProductDialogOpen,
  selectedProduct,
  setSelectedProduct,
}) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    product_id: null,
    barcode_number: '',
    item_alias: '',
    model_number: '',
    item_name: '',
    category_id: '',
    subcategory_id: '',
    price: '',
    min_stock: '',
    current_stock: '',
    image_link: '',
    company_name: '',
    uom: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [previousImagePath, setPreviousImagePath] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setNewProduct(selectedProduct);
      setImagePreview(selectedProduct.image_link || '');
      const filePath = selectedProduct.image_link?.split('/').pop(); // Extract the image file name
      setPreviousImagePath(filePath);
    } else {
      resetForm();
    }
  }, [selectedProduct]);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
      console.error('Error fetching categories:', error);
      showSnackbar('Error fetching categories', 'error');
    } else setCategories(data);
  };

  const fetchSubcategories = async () => {
    const { data, error } = await supabase.from('subcategories').select('*');
    if (error) {
      console.error('Error fetching subcategories:', error);
      showSnackbar('Error fetching subcategories', 'error');
    } else setSubcategories(data);
  };

  const resetForm = () => {
    setNewProduct({
      product_id: null,
      barcode_number: '',
      item_alias: '',
      model_number: '',
      item_name: '',
      category_id: '',
      subcategory_id: '',
      price: '',
      min_stock: '',
      current_stock: '',
      image_link: '',
      company_name: '',
      uom: '',
    });
    setImageFile(null);
    setImagePreview('');
    setPreviousImagePath('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePreviousImage = async (filePath) => {
    if (filePath) {
      const { error } = await supabase.storage.from('files').remove([`product_images/${filePath}`]);
      if (error) {
        console.error('Error removing previous image:', error);
      }
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `product_images/${fileName}`;

    const { data, error } = await supabase.storage.from('files').upload(filePath, imageFile);

    if (error) {
      console.error('Error uploading image:', error);
      showSnackbar('Error uploading image', 'error');
      return null;
    }

    const { data: publicUrlData, error: publicURLError } = supabase.storage
      .from('files')
      .getPublicUrl(filePath);

    if (publicURLError || !publicUrlData.publicUrl) {
      console.error('Error getting public URL:', publicURLError);
      showSnackbar('Error getting image URL', 'error');
      return null;
    }

    return publicUrlData.publicUrl;
  };

  const handleAddProduct = async () => {
    let imageUrl = newProduct.image_link;

    if (imageFile) {
      if (previousImagePath) {
        await removePreviousImage(previousImagePath); // Remove the old image
      }
      imageUrl = await uploadImage(); // Upload the new image
    }

    const productData = { ...newProduct, image_link: imageUrl };

    const { data, error } = await supabase.from('products').upsert([productData], { onConflict: 'product_id' });

    if (error) {
      console.error('Error adding/updating product:', error);
      showSnackbar('Error adding/updating product', 'error');
    } else {
      fetchProducts();
      setProductDialogOpen(false);
      resetForm();
      showSnackbar(selectedProduct ? 'Product updated successfully' : 'Product added successfully', 'success');
    }
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
    <>
      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)}>
        <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Item Name"
            value={newProduct.item_name}
            onChange={(e) => setNewProduct({ ...newProduct, item_name: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Company Name"
            value={newProduct.company_name}
            onChange={(e) => setNewProduct({ ...newProduct, company_name: e.target.value })}
            fullWidth
            margin="dense"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              value={newProduct.category_id}
              onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
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
              value={newProduct.subcategory_id}
              onChange={(e) => setNewProduct({ ...newProduct, subcategory_id: e.target.value })}
            >
              {subcategories
                .filter((sub) => sub.category_id === newProduct.category_id)
                .map((subcategory) => (
                  <MenuItem key={subcategory.subcategory_id} value={subcategory.subcategory_id}>
                    {subcategory.subcategory_name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label="Price"
            type="number"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Barcode Number"
            value={newProduct.barcode_number}
            onChange={(e) => setNewProduct({ ...newProduct, barcode_number: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Item Alias"
            value={newProduct.item_alias}
            onChange={(e) => setNewProduct({ ...newProduct, item_alias: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Model Number"
            value={newProduct.model_number}
            onChange={(e) => setNewProduct({ ...newProduct, model_number: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="UOM"
            value={newProduct.uom}
            onChange={(e) => setNewProduct({ ...newProduct, uom: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Min Stock"
            type="number"
            value={newProduct.min_stock}
            onChange={(e) => setNewProduct({ ...newProduct, min_stock: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Current Stock"
            type="number"
            value={newProduct.current_stock}
            onChange={(e) => setNewProduct({ ...newProduct, current_stock: e.target.value })}
            fullWidth
            margin="dense"
          />

          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              p: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '150px',
            }}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px' }} />
            ) : (
              <p style={{ color: '#aaa' }}>Image Preview</p>
            )}
          </Box>

          <input
            accept="image/*"
            type="file"
            onChange={handleImageChange}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button variant="contained" component="span" fullWidth>
              Choose Image
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddProduct}>
            {selectedProduct ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddStockOptions;
