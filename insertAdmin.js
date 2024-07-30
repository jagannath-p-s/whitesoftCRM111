import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Supabase client configuration
const supabaseUrl = 'https://rfsqevzzlnuhifwmorxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmc3Fldnp6bG51aGlmd21vcnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MTQzNDcsImV4cCI6MjAzNDE5MDM0N30._MJkIGhERKagpMran5UcAUen3gULm7JVy_evgTtHrfQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// New user data
const newUsers = [
  {
    username: 'Sijosh',
    useremail: 'sijoharitha@gmail.com',
    password: 'password',
    role: 'Manager',
    mobile_number: '9747403390',
    can_edit_staff: true,
    can_edit_pipeline: true,
    can_edit_product: true,
    can_edit_files: true,
    can_edit_enquiries: true,
    can_edit_stock: true,
    can_edit_product_enquiry: true,
    can_edit_service_enquiry: true,
    can_edit_sales: true,
    can_see_performance: true,
    employee_code: '',
  },
  {
    username: 'Sanoop',
    useremail: 'sanoopharitha@gmail.com',
    password: 'password',
    role: 'Manager',
    mobile_number: '9544900447',
    can_edit_staff: true,
    can_edit_pipeline: true,
    can_edit_product: true,
    can_edit_files: true,
    can_edit_enquiries: true,
    can_edit_stock: true,
    can_edit_product_enquiry: true,
    can_edit_service_enquiry: true,
    can_edit_sales: true,
    can_see_performance: true,
    employee_code: '',
  },
  {
    username: 'Rafi',
    useremail: 'rafiharitha@gmail.com',
    password: 'password',
    role: 'Manager',
    mobile_number: '9544900446',
    can_edit_staff: true,
    can_edit_pipeline: true,
    can_edit_product: true,
    can_edit_files: true,
    can_edit_enquiries: true,
    can_edit_stock: true,
    can_edit_product_enquiry: true,
    can_edit_service_enquiry: true,
    can_edit_sales: true,
    can_see_performance: true,
    employee_code: '',
  },
  {
    username: 'Sruthi',
    useremail: 'frontharitha@gmail.com',
    password: 'password',
    role: 'Salesperson',
    mobile_number: '7909100441',
    can_edit_staff: false,
    can_edit_pipeline: false,
    can_edit_product: true,
    can_edit_files: false,
    can_edit_enquiries: true,
    can_edit_stock: false,
    can_edit_product_enquiry: true,
    can_edit_service_enquiry: false,
    can_edit_sales: true,
    can_see_performance: false,
    employee_code: '',
  },
  {
    username: 'Sajana',
    useremail: 'officeharitha@gmail.com',
    password: 'password',
    role: 'Salesperson',
    mobile_number: '9895100444',
    can_edit_staff: false,
    can_edit_pipeline: false,
    can_edit_product: true,
    can_edit_files: false,
    can_edit_enquiries: true,
    can_edit_stock: false,
    can_edit_product_enquiry: true,
    can_edit_service_enquiry: false,
    can_edit_sales: true,
    can_see_performance: false,
    employee_code: '',
  },
  {
    username: 'Pravisha',
    useremail: 'saleharitha@gmail.com',
    password: 'password',
    role: 'Salesperson',
    mobile_number: '7034100445',
    can_edit_staff: false,
    can_edit_pipeline: false,
    can_edit_product: true,
    can_edit_files: false,
    can_edit_enquiries: true,
    can_edit_stock: false,
    can_edit_product_enquiry: true,
    can_edit_service_enquiry: false,
    can_edit_sales: true,
    can_see_performance: false,
    employee_code: '',
  },
  {
    username: 'Sumi',
    useremail: 'irriharitha@gmail.com',
    password: 'password',
    role: 'Salesperson',
    mobile_number: '9544900466',
    can_edit_staff: false,
    can_edit_pipeline: false,
    can_edit_product: true,
    can_edit_files: false,
    can_edit_enquiries: true,
    can_edit_stock: false,
    can_edit_product_enquiry: true,
    can_edit_service_enquiry: false,
    can_edit_sales: true,
    can_see_performance: false,
    employee_code: '',
  },
  {
    username: 'Neethu',
    useremail: 'stockharitha@gmail.com',
    password: 'password',
    role: 'Salesperson',
    mobile_number: '9656490066',
    can_edit_staff: false,
    can_edit_pipeline: false,
    can_edit_product: true,
    can_edit_files: false,
    can_edit_enquiries: true,
    can_edit_stock: false,
    can_edit_product_enquiry: true,
    can_edit_service_enquiry: false,
    can_edit_sales: true,
    can_see_performance: false,
    employee_code: '',
  },
  {
    username: 'Thasni',
    useremail: 'serviceharitha@gmail.com',
    password: 'password',
    role: 'Service',
    mobile_number: '9562482489',
    can_edit_staff: false,
    can_edit_pipeline: false,
    can_edit_product: false,
    can_edit_files: false,
    can_edit_enquiries: false,
    can_edit_stock: false,
    can_edit_product_enquiry: false,
    can_edit_service_enquiry: true,
    can_edit_sales: false,
    can_see_performance: false,
    employee_code: '',
  },
  {
    username: 'Sasikala',
    useremail: 'accountsharitha@gmail.com',
    password: 'password',
    role: 'Accounts',
    mobile_number: '7909100442',
    can_edit_staff: false,
    can_edit_pipeline: false,
    can_edit_product: false,
    can_edit_files: false,
    can_edit_enquiries: false,
    can_edit_stock: false,
    can_edit_product_enquiry: false,
    can_edit_service_enquiry: false,
    can_edit_sales: false,
    can_see_performance: false,
    employee_code: '',
  },
];

// Function to hash the password and insert the user data
async function insertUser(user) {
  try {
    // Hash the password
    const salt = bcrypt.genSaltSync(12);
    const hashedPassword = bcrypt.hashSync(user.password, salt);

    // Insert user data with hashed password
    const { data, error } = await supabase
      .from('users')
      .insert([{ ...user, password: hashedPassword }]);

    if (error) {
      throw error;
    }

    console.log('User inserted successfully:', data);
  } catch (err) {
    console.error('Error inserting user:', err);
  }
}

// Run the insertUser function for each new user
newUsers.forEach(user => insertUser(user));
