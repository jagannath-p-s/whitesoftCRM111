// ... existing code ...

// Assuming you have a function that fetches or receives enquiry data
// Modify the part where you display product information

// Add a function to fetch product details by ID
const getProductNameById = (productId, productsData) => {
  console.log('Product ID:', productId);
  console.log('Products Data:', productsData);
  const product = productsData.find(product => product.product_id === productId);
  console.log('Found Product:', product);
  return product ? product.item_name : 'Unknown Product';
};

// When displaying enquiry data with products
const renderEnquiryProducts = (enquiry, productsData) => {
  // Check if products field exists and is not empty
  if (!enquiry.products) return 'No products';
  
  try {
    // Parse the products field - it might be a string of IDs, JSON, or array
    let productIds = enquiry.products;
    console.log('Raw Products Data:', productIds);
    
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
    
    console.log('Processed Product IDs:', productIds);
    // Map product IDs to product names
    return productIds.map(id => getProductNameById(id, productsData)).join(', ');
  } catch (error) {
    console.error('Error parsing product data:', error);
    return 'Error displaying products';
  }
};

// In your render method or component where you display enquiry data
// ... existing code ...

// When fetching data, make sure to also fetch products data
useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch enquiries data
      const enquiriesResponse = await fetch('/api/enquiries');
      const enquiriesData = await enquiriesResponse.json();
      
      // Fetch products data
      const productsResponse = await fetch('/api/products');
      const productsData = await productsResponse.json();
      
      console.log('Fetched Products Data:', productsData);
      setEnquiries(enquiriesData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  fetchData();
}, []);

// When rendering enquiry data in your component
{enquiries.map(enquiry => (
  <tr key={enquiry.id}>
    {/* Other enquiry fields */}
    <td>{renderEnquiryProducts(enquiry, products)}</td>
    {/* More fields */}
  </tr>
))}

// ... existing code ...