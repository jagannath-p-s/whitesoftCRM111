import csv
import pandas as pd
from supabase import create_client, Client

# Supabase credentials
SUPABASE_URL="https://rfsqevzzlnuhifwmorxv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmc3Fldnp6bG51aGlmd21vcnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MTQzNDcsImV4cCI6MjAzNDE5MDM0N30._MJkIGhERKagpMran5UcAUen3gULm7JVy_evgTtHrfQ"

# Initialize Supabase client
def init_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# Function to clean and validate CSV data
# Function to clean and validate CSV data
def clean_and_validate_data(row):
    # Ensure all required fields are present; if not, fill with default values or placeholders
    required_fields = ["title", "stage", "first_name", "second_name", "contact_number", "user_id", "password"]
    cleaned_row = {}

    # Fill missing fields with empty strings or appropriate default values
    for field in required_fields:
        cleaned_row[field] = (row.get(field) or "").strip()  # Handle None by defaulting to an empty string

    # Handle optional fields
    cleaned_row["alternate_contact_number"] = (row.get("alternate_contact_number") or "").strip()
    cleaned_row["description"] = (row.get("description") or "").strip()

    return cleaned_row

# Function to upload data to Supabase
def upload_data_to_supabase(data, supabase):
    table_name = "user_details"  # Table name in Supabase

    # Insert into Supabase
    response = supabase.table(table_name).insert(data).execute()

    # Print the entire response to see its structure
    print("Response from Supabase:", response)

    # Assuming the response has a 'data' and an 'error' key
    if 'error' in response and response['error'] is None:
        print("Data uploaded successfully.")
    elif 'error' in response:
        print(f"Failed to upload data. Error: {response['error']['message']}")
    else:
        print("Unknown response format. Check the response structure.")

# Function to process CSV file
def process_csv(file_path):
    supabase = init_supabase()

    # Read CSV and clean the data
    with open(file_path, mode="r", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        cleaned_data = []

        for row in reader:
            cleaned_row = clean_and_validate_data(row)
            cleaned_data.append(cleaned_row)

        # Upload cleaned data to Supabase
        if cleaned_data:
            upload_data_to_supabase(cleaned_data, supabase)
        else:
            print("No valid data to upload.")

# Main function
if __name__ == "__main__":
    csv_file_path = "/home/ubuntu/Desktop/ren.csv"  # Replace with your CSV file path
    process_csv(csv_file_path)
