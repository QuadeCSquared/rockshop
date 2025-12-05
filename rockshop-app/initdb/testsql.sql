create table IF NOT EXISTS receipts (
    id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wholeseller text,
    specimen text,
    bulk_cost_payed float,
    cost_kg float,
    total_kg float,
    retail_kg float,
    cost_pp float,
    total_pp float,
    retail_pp float
)

\copy receipts FROM 'receipts.csv';