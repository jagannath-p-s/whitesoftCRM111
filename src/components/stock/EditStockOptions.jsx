import React, { useState, useEffect } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField } from '@mui/material';
import { supabase } from '../../supabaseClient';

const EditStockOptions = ({ fetchProducts, productDialogOpen, setProductDialogOpen, selectedProduct }) => {
  const [formData, setFormData] = useState({
    barcode_number: '',
    item_alias: '',
    model_number: '',
    item_name: '',
    category_id: '',
    subcategory_id: '',
    price: '',
    min_stock: '',
    current_stock: '',
    company_name: '',
    uom: '',
    rack_number: '',    
    box_number: '',     
    image_file: null,
  });

  useEffect(() => {
    if (selectedProduct) {
      console.log('Selected product loaded:', selectedProduct);
      setFormData({
        barcode_number: selectedProduct.barcode_number || '',
        item_alias: selectedProduct.item_alias || '',
        model_number: selectedProduct.model_number || '',
        item_name: selectedProduct.item_name || '',
        category_id: selectedProduct.category_id || '',
        subcategory_id: selectedProduct.subcategory_id || '',
        price: selectedProduct.price ? selectedProduct.price.toString() : '',
        min_stock: selectedProduct.min_stock ? selectedProduct.min_stock.toString() : '',
        current_stock: selectedProduct.current_stock ? selectedProduct.current_stock.toString() : '',
        company_name: selectedProduct.company_name || '',
        uom: selectedProduct.uom || '',
        rack_number: selectedProduct.rack_number ? selectedProduct.rack_number.toString() : '',
        box_number: selectedProduct.box_number ? selectedProduct.box_number.toString() : '',
        image_file: null,
      });
    }
  }, [selectedProduct]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input change: ${name} = ${value}`);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    console.log('File selected:', e.target.files[0]);
    setFormData((prev) => ({
      ...prev,
      image_file: e.target.files[0],
    }));
  };

  const handleSubmit = async () => {
    try {
      console.log('Submitting form with data:', formData);
      let imageUrl = selectedProduct.image_link;
      
      // Handle file upload if new file is provided
      if (formData.image_file) {
        const fileExt = formData.image_file.name.split('.').pop();
        const fileName = `${formData.barcode_number || Date.now()}.${fileExt}`;
        console.log('Uploading file:', fileName);
        
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(`public/${fileName}`, formData.image_file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        }
        const { publicURL } = supabase.storage
          .from('uploads')
          .getPublicUrl(`public/${fileName}`);
        imageUrl = publicURL;
        console.log('File uploaded, public URL:', imageUrl);
      }

      // Safely parse integers and floats, defaulting to null when needed
      const parsedPrice = formData.price ? parseFloat(formData.price) : null;
      const parsedMinStock = formData.min_stock ? parseInt(formData.min_stock, 10) : null;
      const parsedCurrentStock = formData.current_stock ? parseInt(formData.current_stock, 10) : 0;
      const parsedCategoryId = formData.category_id ? parseInt(formData.category_id, 10) : null;
      const parsedSubcategoryId = formData.subcategory_id ? parseInt(formData.subcategory_id, 10) : null;
      const parsedRackNumber = formData.rack_number ? parseInt(formData.rack_number, 10) : null;
      const parsedBoxNumber = formData.box_number ? parseInt(formData.box_number, 10) : null;

      console.log('Parsed values:', {
        parsedPrice,
        parsedMinStock,
        parsedCurrentStock,
        parsedCategoryId,
        parsedSubcategoryId,
        parsedRackNumber,
        parsedBoxNumber,
      });

      const { error: updateError } = await supabase
        .from('products')
        .update({
          barcode_number: formData.barcode_number || null,
          item_alias: formData.item_alias || null,
          model_number: formData.model_number || null,
          item_name: formData.item_name,
          category_id: parsedCategoryId,
          subcategory_id: parsedSubcategoryId,
          price: parsedPrice,
          min_stock: parsedMinStock,
          current_stock: parsedCurrentStock,
          company_name: formData.company_name || null,
          uom: formData.uom || null,
          rack_number: parsedRackNumber,
          box_number: parsedBoxNumber,
          image_link: imageUrl || null,
        })
        .eq('product_id', selectedProduct.product_id);

      if (updateError) {
        console.error('Error during update:', updateError);
        throw updateError;
      }

      console.log('Product updated successfully');
      setProductDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  return (
    <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} fullWidth maxWidth="md">
      <DialogTitle>Edit Product</DialogTitle>
      <DialogContent>
        <TextField
          name="barcode_number"
          label="Barcode Number"
          fullWidth
          value={formData.barcode_number}
          onChange={handleInputChange}
          margin="dense"
        />
        <TextField
          name="item_alias"
          label="Item Alias"
          fullWidth
          value={formData.item_alias}
          onChange={handleInputChange}
          margin="dense"
        />
        <TextField
          name="model_number"
          label="Model Number"
          fullWidth
          value={formData.model_number}
          onChange={handleInputChange}
          margin="dense"
        />
        <TextField
          name="item_name"
          label="Item Name"
          fullWidth
          required
          value={formData.item_name}
          onChange={handleInputChange}
          margin="dense"
        />
        <TextField
          name="category_id"
          label="Category ID"
          fullWidth
          value={formData.category_id}
          onChange={handleInputChange}
          margin="dense"
        />
        <TextField
          name="subcategory_id"
          label="Subcategory ID"
          fullWidth
          value={formData.subcategory_id}
          onChange={handleInputChange}
          margin="dense"
        />
        <TextField
          name="price"
          label="Price"
          fullWidth
          value={formData.price}
          onChange={handleInputChange}
          margin="dense"
        />
        <TextField
          name="min_stock"
          label="Minimum Stock"
          fullWidth
          value={formData.min_stock}
          onChange={handleInputChange}
          margin="dense"
        />
        <TextField
          name="current_stock"
          label="Current Stock"
          fullWidth
          value={formData.current_stock}
          onChange={handleInputChange}
          margin="dense"
        />
        <TextField
          name="company_name"
          label="Company Name"
          fullWidth
          value={formData.company_name}
          onChange={handleInputChange}
          margin="dense"
        />
        <TextField
          name="uom"
          label="Unit of Measurement (UOM)"
          fullWidth
          value={formData.uom}
          onChange={handleInputChange}
          margin="dense"
        />
        <TextField
          name="rack_number"
          label="Rack Number"
          fullWidth
          value={formData.rack_number}
          onChange={handleInputChange}
          margin="dense"
        />
        <TextField
          name="box_number"
          label="Box Number"
          fullWidth
          value={formData.box_number}
          onChange={handleInputChange}
          margin="dense"
        />
        <input accept="image/*" type="file" onChange={handleFileChange} style={{ marginTop: '16px' }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setProductDialogOpen(false)} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary">
          Update Product
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStockOptions;
