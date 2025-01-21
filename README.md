created a vite app using npm create vite @latest 

project named to haritha , react , javascript 

installed taiwlwind css using vite framework guide 

created the supabase project and created a users table using 

create table
  public.users (
    id serial not null,
    username character varying(50) not null,
    useremail character varying(100) not null,
    password character varying(255) not null,
    role character varying(50) not null,
    datetime timestamp without time zone null default current_timestamp,
    mobile_number character varying(50) null,
    can_edit_staff boolean null default false,
    can_edit_pipeline boolean null default false,
    can_edit_product boolean null default false,
    can_edit_files boolean null default false,
    can_edit_enquiries boolean null default false,
    can_edit_stock boolean null default false,
    can_edit_product_enquiry boolean null default false,
    can_edit_service_enquiry boolean null default false,
    can_edit_sales boolean null default false,
    can_see_performance boolean null default false,
    employee_code text null,
    can_view_staff boolean null default false,
    can_view_pipeline boolean null default false,
    can_view_product boolean null default false,
    can_view_files boolean null default false,
    can_view_enquiries boolean null default false,
    can_view_stock boolean null default false,
    can_view_product_enquiry boolean null default false,
    can_view_service_enquiry boolean null default false,
    can_view_sales boolean null default false,
    constraint users_pkey primary key (id),
    constraint users_useremail_key unique (useremail),
    constraint role_check check (
      (
        (role)::text = any (
          array[
            ('Admin'::character varying)::text,
            ('Manager'::character varying)::text,
            ('Salesperson'::character varying)::text,
            ('Service'::character varying)::text,
            ('Accounts'::character varying)::text
          ]
        )
      )
    )
  ) tablespace pg_default;

passwords are encrypted using bcrypt

created a supabase client in src 

next we created a pages directory and made two pages Homepage.jsx and loginpage.jsx 
 , first we need to create them to save the users session in local storage , for one week ,











