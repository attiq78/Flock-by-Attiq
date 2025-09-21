# FlockByAttiq - E-commerce Platform

A modern, full-stack e-commerce platform built with Next.js, MongoDB, and TypeScript. Features include user authentication, product management, secure payments, and business analytics.

## 🚀 Features

- **User Authentication**: Complete login/signup system with JWT tokens
- **Product Management**: Full CRUD operations for products with categories
- **Secure Payments**: Stripe integration for secure transactions
- **Business Analytics**: Comprehensive dashboard with sales insights
- **AI Chatbot**: Intelligent customer support and recommendations
- **Responsive Design**: Modern UI with Tailwind CSS
- **Database Integration**: MongoDB with Mongoose ODM

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens with bcryptjs
- **State Management**: React Context API
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd my-next-app
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
cp env.example .env.local
```

Update the environment variables:

```env
MONGODB_URI=mongodb://localhost:27017/flockbyattiq
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Database Setup

#### Option A: Using the initialization script (Recommended)

```bash
# Make the script executable (Unix/Mac)
chmod +x public/init-database.sh

# Run the initialization script
./public/init-database.sh
```

#### Option B: Manual setup

1. Start MongoDB:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Ubuntu
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

2. Run the database initialization:
   ```bash
   node public/init-database.js
   ```

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Default Credentials

After running the database initialization script, you can login with:

- **Email**: admin@flockbyattiq.com
- **Password**: admin123

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── lib/               # Utility libraries (MongoDB connection)
├── models/            # MongoDB models (User, Product)
├── pages/
│   ├── api/           # API routes
│   │   └── auth/      # Authentication endpoints
│   ├── login/         # Login page
│   ├── register/      # Registration page
│   ├── products/      # Products listing
│   ├── cart/          # Shopping cart
│   ├── checkout/      # Checkout process
│   └── analytics/     # Business analytics
└── styles/            # Global styles
```

## 🔐 Authentication

The app uses JWT-based authentication with the following endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

## 🗄️ Database Models

### User Model
- Personal information (name, email, password)
- Role-based access (user/admin)
- Profile data (avatar, phone, address)
- Authentication fields (verification, reset tokens)

### Product Model
- Product details (name, description, price)
- Inventory management (stock, SKU)
- Categorization (category, subcategory, tags)
- Media (images, specifications)
- Analytics (rating, review count)

## 🎨 UI Components

- **Responsive Design**: Mobile-first approach
- **Modern Styling**: Gradient backgrounds, glassmorphism effects
- **Interactive Elements**: Hover animations, smooth transitions
- **Form Validation**: Real-time validation with user feedback
- **Toast Notifications**: Success/error messages

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Railway

## 🔧 Development

### Adding New Features

1. Create components in `src/components/`
2. Add API routes in `src/pages/api/`
3. Update models in `src/models/`
4. Add pages in `src/pages/`

### Database Operations

Use the MongoDB connection from `src/lib/mongodb.ts`:

```typescript
import connectDB from '../lib/mongodb';
import User from '../models/User';

// In your API route
await connectDB();
const users = await User.find();
```

## 📝 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Ensure MongoDB is running
3. Verify environment variables are set correctly
4. Check the database connection

## 🔮 Future Enhancements

- [ ] Email verification system
- [ ] Password reset functionality
- [ ] Social media login
- [ ] Advanced search and filtering
- [ ] Order tracking system
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Admin dashboard
- [ ] Inventory management
- [ ] Customer reviews and ratings

---

Built with ❤️ by FlockByAttiq Team