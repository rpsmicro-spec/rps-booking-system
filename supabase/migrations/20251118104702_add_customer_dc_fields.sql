-- Add Customer DC (Delivery Challan) fields to jobs table
-- DC Number: Customer's delivery challan number
-- DC Date: Date of the customer's delivery challan

ALTER TABLE jobs
ADD COLUMN customer_dc_number VARCHAR(100),
ADD COLUMN customer_dc_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN jobs.customer_dc_number IS 'Customer Delivery Challan number - unique identifier from the customer for each job';
COMMENT ON COLUMN jobs.customer_dc_date IS 'Date of the Customer Delivery Challan';


