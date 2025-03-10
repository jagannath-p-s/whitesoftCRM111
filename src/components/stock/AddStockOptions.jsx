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

const safeParseInt = (value) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

const safeParseFloat = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

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
    barcode_number: '',
    item_alias: '',
    model_number: '',
    item_name: '',
    category_id: '',
    subcategory_id: '',
    price: '',
    min_stock: '',
    current_stock: '0',
    image_link: '',
    company_name: '',
    uom: '',
    rack_number: '',
    box_number: '',
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
      setNewProduct({
        barcode_number: selectedProduct.barcode_number || '',
        item_alias: selectedProduct.item_alias || '',
        model_number: selectedProduct.model_number || '',
        item_name: selectedProduct.item_name || '',
        category_id: selectedProduct.category_id ? selectedProduct.category_id.toString() : '',
        subcategory_id: selectedProduct.subcategory_id ? selectedProduct.subcategory_id.toString() : '',
        price: selectedProduct.price !== null ? selectedProduct.price.toString() : '',
        min_stock: selectedProduct.min_stock !== null ? selectedProduct.min_stock.toString() : '',
        current_stock: selectedProduct.current_stock !== null ? selectedProduct.current_stock.toString() : '0',
        image_link: selectedProduct.image_link || '',
        company_name: selectedProduct.company_name || '',
        uom: selectedProduct.uom || '',
        rack_number: selectedProduct.rack_number || '',
        box_number: selectedProduct.box_number || '',
      });
      setImagePreview(selectedProduct.image_link || '');
      const filePath = selectedProduct.image_link?.split('/').pop() || '';
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
      barcode_number: '',
      item_alias: '',
      model_number: '',
      item_name: '',
      category_id: '',
      subcategory_id: '',
      price: '',
      min_stock: '',
      current_stock: '0',
      image_link: '',
      company_name: '',
      uom: '',
      rack_number: '',
      box_number: '',
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

    const { error: uploadError } = await supabase.storage.from('files').upload(filePath, imageFile);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
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

  const handleAddOrUpdateProduct = async () => {
    // Use safe parsing for numeric fields
    const parsedPrice = safeParseFloat(newProduct.price);
    const parsedMinStock = safeParseInt(newProduct.min_stock);
    const parsedCurrentStock = safeParseInt(newProduct.current_stock);
    const parsedCategoryId = safeParseInt(newProduct.category_id);
    const parsedSubcategoryId = safeParseInt(newProduct.subcategory_id);

    let imageUrl = newProduct.image_link;

    if (imageFile) {
      if (previousImagePath) {
        await removePreviousImage(previousImagePath);
      }
      imageUrl = await uploadImage();
      if (!imageUrl) return;
    }

    const productData = {
      ...newProduct,
      price: parsedPrice,
      min_stock: parsedMinStock,
      current_stock: parsedCurrentStock,
      category_id: parsedCategoryId,
      subcategory_id: parsedSubcategoryId,
      // rack_number and box_number remain strings, so no need to parse
      image_link: imageUrl,
    };

    console.log('Submitting product data:', productData);

    try {
      if (selectedProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('product_id', selectedProduct.product_id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        showSnackbar('Product updated successfully', 'success');
      } else {
        // Insert new product
        const { error } = await supabase.from('products').insert([productData]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        showSnackbar('Product added successfully', 'success');
      }

      fetchProducts();
      setProductDialogOpen(false);
      resetForm();
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error adding/updating product:', error);
      showSnackbar('Error adding/updating product', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
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
              onChange={(e) =>
                setNewProduct({ ...newProduct, category_id: e.target.value, subcategory_id: '' })
              }
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category.category_id} value={category.category_id.toString()}>
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
              label="Subcategory"
            >
              {subcategories
                .filter((sub) => sub.category_id.toString() === newProduct.category_id)
                .map((subcategory) => (
                  <MenuItem key={subcategory.subcategory_id} value={subcategory.subcategory_id.toString()}>
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
            inputProps={{ step: '0.01' }}
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
            label="Rack Number"
            value={newProduct.rack_number}
            onChange={(e) => setNewProduct({ ...newProduct, rack_number: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Box Number"
            value={newProduct.box_number}
            onChange={(e) => setNewProduct({ ...newProduct, box_number: e.target.value })}
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
            inputProps={{ min: '0', step: '1' }}
          />
          <TextField
            label="Current Stock"
            type="number"
            value={newProduct.current_stock}
            onChange={(e) => setNewProduct({ ...newProduct, current_stock: e.target.value })}
            fullWidth
            margin="dense"
            inputProps={{ min: '0', step: '1' }}
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
              mt: 2,
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
            <Button variant="contained" component="span" fullWidth sx={{ mt: 2 }}>
              {imagePreview ? 'Change Image' : 'Choose Image'}
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setProductDialogOpen(false);
              resetForm();
              setSelectedProduct(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleAddOrUpdateProduct} variant="contained" color="primary">
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
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddStockOptions;
