# Data Model

## Core Tables

### users

- id
- name
- email
- phone
- role
- created_at

### pharmacies

- id
- name
- registration_number
- address
- latitude
- longitude
- opening_hours
- contact_number
- is_open
- created_at

### medicines

- id
- name
- generic_name
- category
- dosage_form
- strength
- requires_prescription
- criticality_level

### inventory

- id
- pharmacy_id
- medicine_id
- current_stock
- reserved_stock
- reorder_level
- last_updated_at

### sales_history

- id
- pharmacy_id
- medicine_id
- quantity_sold
- sold_at

### reservations

- id
- user_id
- pharmacy_id
- medicine_id
- quantity
- status
- expires_at
- created_at

### emergency_requests

- id
- user_id
- medicine_id
- required_quantity
- user_latitude
- user_longitude
- urgency_level
- status
- created_at

### stock_transfers

- id
- from_pharmacy_id
- to_pharmacy_id
- medicine_id
- quantity
- recommendation_reason
- status
- created_at

### predictions

- id
- pharmacy_id
- medicine_id
- prediction_type
- prediction_window
- predicted_value
- confidence_score
- model_version
- created_at

## PostGIS Usage

PostGIS supports:

- Pharmacy coordinate storage
- User-to-pharmacy distance queries
- Nearby pharmacy search
- Geospatial ranking features
- Travel-time-aware recommendation features

