# Store Network Summary

- Base URL verified during UI flow: `https://plumbing-qcommerce.onrender.com`
- Credentials and tokens redacted from this summary.

## Screen text samples
## Dashboard

```text
store@plumbcommerce.com
● Connected
TODAY'S REVENUE
₹0
▲ 12% from yesterday
Orders Summary
View all
0
New
0
Packing
0
Ready
0
Delivered
Quick Actions
Add Product
Update Stock
Dispatch Orders
Offers
Home
Orders
Inventory
Materials
Account
```
## Orders

```text
store@plumbcommerce.com
● Connected
TODAY'S REVENUE
₹0
▲ 12% from yesterday
Orders Summary
View all
0
New
0
Packing
0
Ready
0
Delivered
Quick Actions
Add Product
Update Stock
Dispatch Orders
Offers
Home
Orders
Inventory
Materials
Account
```
## Inventory

```text
store@plumbcommerce.com
● Connected
TODAY'S REVENUE
₹0
▲ 12% from yesterday
Orders Summary
View all
0
New
0
Packing
0
Ready
0
Delivered
Quick Actions
Add Product
Update Stock
Dispatch Orders
Offers
Inventory
Add
🔍
0
TOTAL PRODUCTS
0
IN STOCK
0
LOW STOCK
FILTER BY CATEGORY
All Categories
Pipes
Fittings
Tools
No matching products found
Home
Orders
Inventory
Materials
Account
```
## Materials

```text
store@plumbcommerce.com
● Connected
TODAY'S REVENUE
₹0
▲ 12% from yesterday
Orders Summary
View all
0
New
0
Packing
0
Ready
0
Delivered
Quick Actions
Add Product
Update Stock
Dispatch Orders
Offers
Inventory
Add
🔍
0
TOTAL PRODUCTS
0
IN STOCK
0
LOW STOCK
FILTER BY CATEGORY
All Categories
Pipes
Fittings
Tools
No matching products found
Material Requests
NEW
PREPARING
COMPLETED
No material requests in this state
Home
Orders
Inventory
Materials
Account
```
## Account

```text
store@plumbcommerce.com
● Connected
TODAY'S REVENUE
₹0
▲ 12% from yesterday
Orders Summary
View all
0
New
0
Packing
0
Ready
0
Delivered
Quick Actions
Add Product
Update Stock
Dispatch Orders
Offers
Inventory
Add
🔍
0
TOTAL PRODUCTS
0
IN STOCK
0
LOW STOCK
FILTER BY CATEGORY
All Categories
Pipes
Fittings
Tools
No matching products found
Material Requests
NEW
PREPARING
COMPLETED
No material requests in this state
Account
SP
Store account
store@plumbcommerce.com
Store account
Help, privacy, and terms content on this screen remains static informational content in staging.
Profile Settings
Notification Settings
App Language
Help & Support
Privacy Policy
Terms & Conditions
Logout
Home
Orders
Inventory
Materials
Account
```

## Requests observed
- RESPONSE POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/ai/dashboard-metrics 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/checkout/orders/status/CONFIRMED 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/checkout/orders/status/OUT_FOR_DELIVERY 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/checkout/orders/status/READY_FOR_PICKUP 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/checkout/orders/status/DELIVERED 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/checkout/orders/status/PACKING 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/checkout/orders/status/CANCELLED 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/catalog/categories 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/stores/me/inventory 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/stores/123/inventory 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/checkout/material-requests/store 200
