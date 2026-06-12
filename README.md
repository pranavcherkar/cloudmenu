# 🍽 CloudMenu — Restaurant Management System

A full-stack serverless restaurant management system built with React and AWS.

---

## 📌 What is CloudMenu?

CloudMenu is a restaurant admin panel that allows restaurant staff to:
- Manage their full menu with images, prices and categories
- Track table occupancy in real time
- Monitor dish inventory and get low stock alerts
- Auto disable dishes when they go out of stock

---

## 🏗 Architecture
React Frontend (AWS Amplify)

↓

AWS API Gateway (HTTP API)

↓

AWS Lambda (Node.js 20.x)

↓

AWS DynamoDB (3 tables)
Images:

React → Lambda (pre-signed URL) → AWS S3

---

## ⚙️ AWS Services Used

| Service | Purpose |
|---------|---------|
| **AWS Lambda** | Serverless backend functions |
| **AWS API Gateway** | HTTP API routing |
| **AWS DynamoDB** | NoSQL database |
| **AWS S3** | Dish image storage |
| **AWS Amplify** | Frontend hosting + CI/CD |
| **AWS IAM** | Permissions and security |

---

## 🗄 Database Tables

### MenuItems
| Field | Type | Description |
|-------|------|-------------|
| id | String (PK) | Unique dish ID |
| name | String | Dish name |
| description | String | Dish description |
| category | String | Food category |
| price | Number | Price in ₹ |
| available | Boolean | Is dish available |
| imageUrl | String | S3 image URL |
| createdAt | String | ISO timestamp |

### RestaurantTables
| Field | Type | Description |
|-------|------|-------------|
| id | String (PK) | Unique table ID |
| number | Number | Table number |
| name | String | Table name |
| capacity | Number | Seating capacity |
| status | String | available / occupied / bill-requested |
| occupiedAt | String | When table was occupied |

### Inventory
| Field | Type | Description |
|-------|------|-------------|
| id | String (PK) | Unique item ID |
| dishId | String | Linked dish ID |
| dishName | String | Dish name |
| quantity | Number | Current stock |
| unit | String | portions / kg / liters etc |
| lowStockAlert | Number | Alert threshold |
| updatedAt | String | Last updated time |

---

## 🚀 Features

### 📋 Menu Management
- Add, edit, delete dishes
- Upload dish images directly to S3
- Toggle dish availability
- Search and filter by category

### 🪑 Table Management
- Add tables with custom names and capacity
- Real time status — Available / Occupied / Bill Requested
- Track how long a table has been occupied
- Add or remove tables anytime

### 📦 Inventory Management
- Track stock levels per dish
- Low stock alerts on dashboard
- Auto disable dish when stock hits zero
- Auto re-enable dish when restocked
- Quick +/- buttons to update quantity

### 📊 Dashboard
- Total dishes, available, unavailable count
- Live stock alerts for low/out of stock items
- Recently added dishes
- Category breakdown

---

## 🛠 Tech Stack

### Frontend
| Tech | Version |
|------|---------|
| React | 18 |
| Vite | 5 |
| React Router | 6 |
| Axios | 1.x |
| Plain CSS | — |

### Backend
| Tech | Details |
|------|---------|
| AWS Lambda | Node.js 20.x |
| AWS SDK v3 | DynamoDB + S3 |
| API Gateway | HTTP API |

---

## 📁 Project Structure
cloudmenu/

├── backend/

│   └── index.mjs          # Lambda function (all routes)

├── public/

├── src/

│   ├── components/

│   │   └── Navbar.jsx

│   ├── data/

│   │   └── dishes.js      # Seed data

│   ├── pages/

│   │   ├── Dashboard.jsx

│   │   ├── Menu.jsx

│   │   ├── AddDish.jsx

│   │   ├── Tables.jsx

│   │   └── Inventory.jsx

│   ├── services/

│   │   └── api.js         # Axios API calls

│   ├── App.jsx

│   ├── App.css

│   └── main.jsx

├── index.html

├── package.json

└── vite.config.js

---

## 🔧 Local Setup

### Prerequisites
- Node.js 18+
- AWS Account
- Git

### 1. Clone the repo
```bash
git clone https://github.com/pranavcherkar/cloudmenu.git
cd cloudmenu
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file
```bash
VITE_API_URL=https://your-api-gateway-url.amazonaws.com
```

### 4. Run locally
```bash
npm run dev
```

---

## ☁️ AWS Setup Summary

### DynamoDB Tables
Create 3 tables with `id` (String) as partition key:
- `MenuItems`
- `RestaurantTables`
- `Inventory`

### IAM Role
Create `CloudMenuLambdaRole` with policy allowing:
- DynamoDB: PutItem, GetItem, UpdateItem, DeleteItem, Scan
- S3: PutObject, GetObject, DeleteObject
- CloudWatch: CreateLogGroup, CreateLogStream, PutLogEvents

### Lambda
- Runtime: Node.js 20.x
- Handler: `index.handler`
- Attach `CloudMenuLambdaRole`
- Upload `backend/index.mjs` as zip

### API Gateway
HTTP API with these routes all pointing to Lambda:
GET    /dishes

POST   /dishes

PUT    /dishes/{id}

DELETE /dishes/{id}

POST   /upload-url

GET    /tables

POST   /tables

PUT    /tables/{id}

DELETE /tables/{id}

GET    /inventory

POST   /inventory

PUT    /inventory/{id}

DELETE /inventory/{id}

OPTIONS /{proxy+}

### S3 Bucket
- Unblock public access
- Add public read bucket policy
- Enable CORS

### Amplify
- Connect GitHub repo
- Add `VITE_API_URL` environment variable
- Auto deploys on every push to main

---

## 🔮 Future Improvements
- Order taking system (KOT)
- Customer facing QR menu
- Daily sales reports
- WhatsApp bill sharing
- Multi-branch support

---

## 👨‍💻 Author

**Pranav Cherkar**
- GitHub: [@pranavcherkar](https://github.com/pranavcherkar)

---

## 📄 License
MIT License — free to use and modify.
