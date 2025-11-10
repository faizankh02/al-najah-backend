Example Excel Format for Bulk Product Import
===========================================

Save your Excel file as: products.xlsx
Place it in: backend/data/products.xlsx

REQUIRED COLUMNS:
-----------------
Name        - Product name (required)
Category    - Category name or slug (must match existing category)

OPTIONAL COLUMNS:
-----------------
Description - Product description
Price       - Product price (number)
Image       - Image filename (e.g., "hammer-1.jpg") - Place images in public/uploads/products/
Specs       - Product specifications in JSON format or key:value pairs

EXAMPLES:
---------

Example 1: JSON Specs
Name                    | Category          | Description                      | Price | Image              | Specs
Hammer 500g             | Hand Tools        | Heavy duty claw hammer           | 250   | hammer-500g.jpg    | {"Material":"Steel","Weight":"500g","Handle":"Fiberglass"}
Screwdriver Set 6pc     | Hand Tools        | Phillips and flat head set       | 180   | screwdriver-set.jpg| {"Pieces":"6","Material":"Chrome Vanadium"}
Paint Roller 9"         | Painting          | Professional paint roller        | 120   | paint-roller.jpg   | {"Size":"9 inch","Material":"Polyester"}

Example 2: Key:Value Specs
Name                    | Category          | Description                      | Price | Image              | Specs
Steel Pipes 1"          | Building Materials| Galvanized steel pipes           | 450   | steel-pipe.jpg     | Material: Steel, Size: 1 inch, Length: 6 meters
Cement Bag 50kg         | Building Materials| Portland cement                  | 380   | cement-bag.jpg     | Weight: 50kg, Type: OPC 53
LED Bulb 9W             | Electrical        | Energy efficient LED bulb        | 95    | led-bulb.jpg       | Wattage: 9W, Color: Cool White, Lumens: 900

CATEGORY MATCHING:
------------------
The Category column must match one of your existing categories (case-insensitive).
Current categories can be listed by running: node scripts/listCategories.js

NOTES:
------
- Duplicate products (same name + category) will be skipped
- Missing required fields will skip that row
- Images should be copied to: public/uploads/products/
- If Image column is empty, product will be created without images
- Specs can be left empty for simple products
- Price can be 0 if you don't sell directly

STEPS:
------
1. Create your products.xlsx file with the columns above
2. Copy product images to: public/uploads/products/
3. Run: node scripts/bulkImportProducts.js
4. Check the console output for import results
