create table IF NOT EXISTS receipts
	(
	id int GENERATED ALWAYS AS IDENTITY (MINVALUE 1000001),
	wholeseller text NOT NULL,
	specimen text NOT NULL,
	bulkcost float,
	costpp float,
	costkg float,
	totalweight float,
	totalpiece float
	);

create table IF NOT EXISTS ppDisplay
	(
		id int,
		specimen text NOT NULL,
		retailpp float DEFAULT 0.00,
		totalpieces int DEFAULT 0
	);

create table IF NOT EXISTS kgDisplay
	(
		id int,
		specimen text NOT NULL,
		retailkg float DEFAULT 0.00,
		totalweight float DEFAULT 0.00
	);