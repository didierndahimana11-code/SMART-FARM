# SmartFarm Credit - Complete Platform

## Overview
SmartFarm Credit is a comprehensive digital agriculture platform designed to empower Rwandan farmers with accessible loans, real-time market information, and a direct marketplace connection to buyers.

## Features
- **Agricultural Loans**: Fast approval loans tailored for farmers with flexible terms
- **Market Prices**: Real-time pricing data for major crops across Rwanda
- **Marketplace**: Direct farmer-to-buyer connections
- **Expert Assistant**: Farming advice and guidance
- **User Management**: Farmer and buyer profiles with verification

## Project Structure
```
smartfarm-credit/
├── public/                      # Frontend assets
│   ├── index.html              # Main landing page
│   ├── registration.html        # User authentication
│   ├── loan.html               # Loan products & application
│   ├── contact.html            # Contact page
│   ├── styles.css              # Global styles
│   └── script.js               # Main JavaScript
├── routes/                      # API endpoints
│   ├── auth.js                 # Authentication (register, login)
│   ├── users.js                # User management
│   ├── loans.js                # Loan operations
│   └── marketplace.js          # Product & order management
├── database/                    # Database configuration
│   └── db.js                   # SQLite database setup
├── server.js                   # Express server entry point
├── package.json                # Dependencies
├── .env                        # Environment variables
└── README.md                   # This file
```

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing

## Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn
- SQLite3

### Setup Steps

1. **Navigate to project directory**
   ```bash
   cd smartfarm-credit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Edit `.env` file with your settings:
   ```
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=your-secret-key-here
   DATABASE_PATH=./database/smartfarm.db
   ```

4. **Start the server**
   ```bash
   # Production
   npm start

   # Development (with auto-reload)
   npm run dev
   ```

5. **Access the application**
   - Frontend: `http://localhost:5500` (open HTML files via Live Server)
   - API: `http://localhost:3000/api`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/search` - Search users
- `GET /api/users/:userId/public` - Get public user info

### Loans
- `POST /api/loans/apply` - Apply for loan
- `GET /api/loans/my-loans` - Get user's loans
- `GET /api/loans/:loanId` - Get loan details
- `GET /api/loans` - List all loans (admin)
- `POST /api/loans/:loanId/approve` - Approve loan (admin)
- `POST /api/loans/:loanId/reject` - Reject loan (admin)
- `POST /api/loans/:loanId/payment` - Record payment

### Marketplace
- `GET /api/marketplace/products` - List products
- `GET /api/marketplace/products/:productId` - Get product details
- `GET /api/marketplace/farmer/products` - Get farmer's products
- `POST /api/marketplace/products` - Create product listing
- `PUT /api/marketplace/products/:productId` - Update product
- `DELETE /api/marketplace/products/:productId` - Delete product
- `POST /api/marketplace/orders` - Create order
- `GET /api/marketplace/orders` - Get user orders

## Color Scheme (Professional)
- **Primary Blue**: #1E40AF
- **Secondary Green**: #065F46
- **Accent Red**: #DC2626
- **Neutral 900**: #1F2937
- **Background**: #F9FAFB
- **White**: #FFFFFF

## Database Schema

### Users Table
```sql
- id (PRIMARY KEY)
- name, email (UNIQUE), password
- phone, user_type (farmer/buyer/admin)
- farm_name, farm_location, crops_grown
- profile_image, bio
- is_verified, created_at, updated_at
```

### Loans Table
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY), amount, interest_rate
- duration_months, loan_type (seasonal/equipment/land/emergency)
- status (pending/approved/rejected/active/completed/defaulted)
- crop_season, expected_harvest_date
- collateral_value, monthly_payment, total_payment, amount_paid
- approved_by, approved_date, rejection_reason
- created_at, updated_at
```

### Marketplace Products Table
```sql
- id (PRIMARY KEY)
- farmer_id (FOREIGN KEY), product_name, description
- crop_type, quantity, unit, price_per_unit
- harvest_date, location, image_url
- status (available/sold/expired)
- created_at, updated_at
```

### Orders Table
```sql
- id (PRIMARY KEY)
- buyer_id (FOREIGN KEY), product_id (FOREIGN KEY)
- quantity, total_price, delivery_address
- status (pending/confirmed/shipped/delivered/cancelled)
- payment_status (pending/paid/failed)
- estimated_delivery, actual_delivery
- created_at, updated_at
```

## Security Considerations

1. **Password Security**
   - Passwords are hashed using bcryptjs (10 salt rounds)
   - Never store plain text passwords

2. **JWT Authentication**
   - Tokens expire after 7 days (configurable)
   - Change JWT_SECRET in production

3. **CORS Configuration**
   - Configure allowed origins in .env

4. **Input Validation**
   - All inputs validated using express-validator

5. **SQL Injection Prevention**
   - Using parameterized queries throughout

## Troubleshooting

### Database Connection Issues
- Ensure database directory exists: `mkdir -p database`
- Check file permissions
- Verify DATABASE_PATH in .env

### Port Already in Use
```bash
# Kill process on port 3000
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -i :3000
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## Future Enhancements

1. **Payment Integration**
   - Mobile money (MTN, Airtel)
   - Bank transfers
   - Cryptocurrency

2. **Data Intelligence**
   - Machine learning for loan approval
   - Crop yield prediction
   - Weather-based insights

3. **Mobile App**
   - React Native or Flutter
   - Offline functionality
   - Push notifications

4. **Analytics Dashboard**
   - Performance metrics
   - User insights
   - Revenue reports

5. **Video Integration**
   - Farming tutorials
   - Live Q&A sessions
   - Market updates

## Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License
This project is licensed under the MIT License - see LICENSE file for details

## Support
For issues and questions:
- Email: support@smartfarm.rw
- Phone: +250 788 123 456
- Website: www.smartfarm.rw

## Authors
- SmartFarm Team
- Development Date: 2026

## Changelog

### Version 1.0.0 (Initial Release)
- Complete user authentication system
- Loan application and management
- Marketplace for crop trading
- Real-time market prices
- Professional Farming Assistant
- Mobile-responsive design
- Professional UI/UX

---
**Last Updated**: February 11, 2026
