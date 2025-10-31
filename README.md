# Deccan Car Rental

A modern car rental management system built with Next.js, MongoDB, and Tailwind CSS. This application provides a complete solution for managing car rentals, reservations, payments, and customer information.

## Features

- **Car Management**: Add, edit, and delete vehicles from the fleet
- **Reservation System**: Handle customer reservations and bookings
- **Rental Management**: Track active and completed rentals
- **Payment Processing**: Manage payments and transaction records
- **Admin Dashboard**: Real-time statistics and fleet overview
- **Responsive Design**: Built with Tailwind CSS and Radix UI components
- **Modern UI**: Clean, accessible interface with shadcn/ui components

## Tech Stack

- **Framework**: Next.js 14.2.3
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Package Manager**: Yarn

## Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **Yarn** (v1.22.22 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Deccan-Car-Rental
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory (or copy from `.env.example` if available):
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=deccan_car_rental
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   CORS_ORIGINS=*
   ```

   **Environment Variables Explained:**
   - `MONGO_URL`: Your MongoDB connection string
     - For local MongoDB: `mongodb://localhost:27017`
     - For MongoDB Atlas: `mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority`
   - `DB_NAME`: Name of your database (e.g., `deccan_car_rental`)
   - `NEXT_PUBLIC_BASE_URL`: Base URL for the application (e.g., `http://localhost:3000` for development)
   - `CORS_ORIGINS`: Allowed CORS origins (use `*` for development, specify domains for production)

## Database Setup

### Option 1: Local MongoDB

1. **Install MongoDB** on your system:
   - macOS:
     ```bash
     brew tap mongodb/brew
     brew install mongodb-community@8.0
     ```
   - Ubuntu: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

2. **Start MongoDB service**:
   ```bash
   # macOS
   brew services start mongodb-community@8.0

   # Ubuntu
   sudo systemctl start mongod

   # Windows
   # MongoDB runs as a service automatically after installation
   ```

3. **Verify MongoDB is running**:
   ```bash
   mongosh
   ```

### Option 2: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Set up database access (username/password)
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and update `MONGO_URL` in `.env`

## Running the Application

### Development Mode

Start the development server:
```bash
yarn dev
```

The application will be available at `http://localhost:3000`

**Alternative development commands:**
- `yarn dev:no-reload`: Run without hot reload
- `yarn dev:webpack`: Run with webpack-specific configuration

### Production Mode

1. **Build the application**:
   ```bash
   yarn build
   ```

2. **Start the production server**:
   ```bash
   yarn start
   ```

## Project Structure

```
Deccan-Car-Rental/
├── app/
│   ├── api/              # API routes
│   │   └── [[...path]]/  # Dynamic API routing
│   ├── globals.css       # Global styles
│   ├── layout.js         # Root layout
│   └── page.js           # Main application page
├── components/
│   └── ui/               # Reusable UI components (shadcn/ui)
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and helpers
├── tests/                # Test files
├── .env                  # Environment variables (create this)
├── .gitignore           # Git ignore rules
├── components.json      # shadcn/ui configuration
├── jsconfig.json        # JavaScript configuration
├── next.config.js       # Next.js configuration
├── package.json         # Dependencies and scripts
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── yarn.lock            # Yarn lock file
```

## Configuration Files

### next.config.js
- Configured for standalone output
- MongoDB external package configuration
- CORS headers setup
- Optimized webpack settings for development

### tailwind.config.js
- Custom theme configuration
- Tailwind CSS and shadcn/ui integration

### components.json
- shadcn/ui component configuration
- Component path aliases

## Common Issues & Troubleshooting

### MongoDB Connection Issues
- **Error**: "MongoServerError: connection refused"
  - **Solution**: Ensure MongoDB is running (`brew services start mongodb-community@8.0` or `sudo systemctl start mongod`)

- **Error**: "Authentication failed"
  - **Solution**: Check your MongoDB credentials in the `.env` file

### Port Already in Use
- **Error**: "Port 3000 is already in use"
  - **Solution**: Kill the process using port 3000 or change the port in package.json scripts

### Memory Issues During Development
- The project uses `--max-old-space-size=512` flag to limit memory usage
- If you experience memory issues, you can increase this value in [package.json:6](package.json#L6)

## Admin Access

The application includes an admin panel for managing the car rental system. Authentication details should be configured through the API or database.

## API Routes

All API routes are handled through the dynamic catch-all route at `app/api/[[...path]]/route.js`.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please create an issue in the repository.

## Development Notes

- The project uses Yarn as the package manager (specified in `packageManager` field)
- Hot reload and file watching are optimized for better performance
- Images are unoptimized in the current configuration
- CORS is configured to allow all origins by default (adjust for production)

## Production Deployment

### Environment Variables for Production
Ensure you update the following for production:
- `NEXT_PUBLIC_BASE_URL`: Your production domain
- `CORS_ORIGINS`: Specific allowed origins (not `*`)
- `MONGO_URL`: Production MongoDB connection string

### Deployment Platforms
This application can be deployed to:
- Vercel (recommended for Next.js)
- AWS
- Google Cloud Platform
- Docker containers (standalone output configured)

### Security Considerations
- Change default MongoDB credentials
- Use environment-specific `.env` files
- Implement proper authentication
- Configure CORS properly for production
- Use HTTPS in production
- Regularly update dependencies
