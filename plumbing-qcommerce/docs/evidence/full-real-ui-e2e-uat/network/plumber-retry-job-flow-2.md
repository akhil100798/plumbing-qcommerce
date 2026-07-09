inputs=2
POST 200 https://plumbing-qcommerce.onrender.com/api/v1/auth/login 
GET 200 https://plumbing-qcommerce.onrender.com/api/v1/users/me 
GET 200 https://plumbing-qcommerce.onrender.com/api/v1/orders/plumber [{"id":1,"customer":{"id":7,"email":"customer@plumbcommerce.com","fullName":"Staging Customer","phone":"5555555601","authProvider":"LOCAL","providerId":null,"phoneVerified":false,"profileImageUrl":null,"profileComplete":true,"role":"CUSTOMER","status":"ACTIVE","createdAt":"2026-07-06T18:05:46.124016","updatedAt":"2026-07-09T09:41:31.923283","availability":null,"hibernateLazyInitializer":{}},"plumb
GET 200 https://plumbing-qcommerce.onrender.com/api/v1/wallet 
GET 200 https://plumbing-qcommerce.onrender.com/api/v1/orders/status/PENDING [{"id":4,"customer":{"id":7,"email":"customer@plumbcommerce.com","fullName":"Staging Customer","phone":"5555555601","authProvider":"LOCAL","providerId":null,"phoneVerified":false,"profileImageUrl":null,"profileComplete":true,"role":"CUSTOMER","status":"ACTIVE","createdAt":"2026-07-06T18:05:46.124016","updatedAt":"2026-07-09T09:41:31.923283","availability":null,"hibernateLazyInitializer":{}},"plumb
GET 200 https://plumbing-qcommerce.onrender.com/api/v1/orders/status/PENDING [{"id":4,"customer":{"id":7,"email":"customer@plumbcommerce.com","fullName":"Staging Customer","phone":"5555555601","authProvider":"LOCAL","providerId":null,"phoneVerified":false,"profileImageUrl":null,"profileComplete":true,"role":"CUSTOMER","status":"ACTIVE","createdAt":"2026-07-06T18:05:46.124016","updatedAt":"2026-07-09T09:41:31.923283","availability":null,"hibernateLazyInitializer":{}},"plumb
body-login=FixKart HELP. FIX. EARN. REPEAT. SP Good Morning, Staging Plumber ⭐ 0.0 (0) SHIFT STATUS You are Online TODAY'S EARNINGS View Details ➔ ₹0 0 Completed 1 Active ₹320 Wallet Quick Actions Active Job History My Wallet Profile Complete 3 more jobs to earn ₹450 extra today 2 of 5 jobs completed ⚠️ INCOMING SERVICE REQUEST PENDING (View offer) Home Jobs Earnings Materials Profile
body-jobs=FixKart HELP. FIX. EARN. REPEAT. SP Good Morning, Staging Plumber ⭐ 0.0 (0) SHIFT STATUS You are Online TODAY'S EARNINGS View Details ➔ ₹0 0 Completed 1 Active ₹320 Wallet Quick Actions Active Job History My Wallet Profile Complete 3 more jobs to earn ₹450 extra today 2 of 5 jobs completed ⚠️ INCOMING SERVICE REQUEST PENDING (View offer) ← Job Details CUSTOMER DETAILS SC Staging Customer ⭐ 4.8 📞 💬 JOB DESCRIPTION Bathroom Pipe Leakage Lat 17.4485, Lng 78.3741 Customer Note: Leaking kitchen sink faucet repair Task Timeline Accepted 2026-07-09T06:33:50.182669 On the way Pending Arrived Pending Started Pending Completed Pending Start Navigation Home Jobs Earnings Materials Profile
count Accept Job=0
count Accept=0
count View Details=0
count Start Navigation=1
GET 200 https://plumbing-qcommerce.onrender.com/api/v1/orders/status/PENDING [{"id":4,"customer":{"id":7,"email":"customer@plumbcommerce.com","fullName":"Staging Customer","phone":"5555555601","authProvider":"LOCAL","providerId":null,"phoneVerified":false,"profileImageUrl":null,"profileComplete":true,"role":"CUSTOMER","status":"ACTIVE","createdAt":"2026-07-06T18:05:46.124016","updatedAt":"2026-07-09T09:41:31.923283","availability":null,"hibernateLazyInitializer":{}},"plumb
count I Have Arrived=1
PATCH 500 https://plumbing-qcommerce.onrender.com/api/v1/orders/1/arrive {"message":"An unexpected error occurred.","error":"Internal Server Error","status":500,"timestamp":"2026-07-09T11:14:50.221892198"}
count Start Work=1
click Start Work locator.click: Element is not visible
Call log:
[2m  - waiting for getByText('Start Work', { exact: true }).last()[22m
[2m    - locator resolved to <div dir="auto" class="css-text-146c3p1 r-color-jwli3a r-fontSize-ubezar r-fontWeight-b88u0q">Start Work</div>[22m
[2m  - attempting click action[22m
[2m    - scrolling into view if needed[22m

GET 200 https://plumbing-qcommerce.onrender.com/api/v1/orders/status/PENDING [{"id":4,"customer":{"id":7,"email":"customer@plumbcommerce.com","fullName":"Staging Customer","phone":"5555555601","authProvider":"LOCAL","providerId":null,"phoneVerified":false,"profileImageUrl":null,"profileComplete":true,"role":"CUSTOMER","status":"ACTIVE","createdAt":"2026-07-06T18:05:46.124016","updatedAt":"2026-07-09T09:41:31.923283","availability":null,"hibernateLazyInitializer":{}},"plumb
count Complete Service=0
count Finish Job=0
count Complete & Finish=0
body-final=Arrived 📍 You have reached the customer location 📍 Customer Destination GPS: 17.4485, 78.3741 CUSTOMER DETAILS SC Staging Customer ⭐ 4.8 📞 💬 CUSTOMER NOTE Leaking kitchen sink faucet repair I Have Arrived