# EAD Learning Management System (LMS)

A comprehensive Learning Management System built with Node.js, Express, MongoDB, and React with TypeScript.

## 🚀 Features

- **Multi-role Authentication**: Admin, Instructor, and Student portals
- **Course Management**: Create, update, and manage courses
- **Student Enrollment**: Manage student registrations and course enrollments
- **Material Management**: Upload and organize course materials
- **Assignment System**: Create and grade assignments
- **Results Tracking**: Monitor student performance and grades
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui

## 🏗️ Architecture

- **Backend**: Node.js + Express + TypeScript + MongoDB
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Authentication**: JWT-based authentication
- **File Uploads**: Multer for handling file uploads
- **Database**: MongoDB with Mongoose ODM

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd EAD-LMS
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `config.env` file in the Backend directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ead-lms
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
BCRYPT_ROUNDS=12
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000
```

## 🚀 Running the Application

### 1. Start MongoDB

Make sure MongoDB is running on your system:

```bash
mongod
```

### 2. Start Backend Server

```bash
cd Backend
npm run dev
```

The backend will start on `http://localhost:5000`

### 3. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🔐 Default Credentials

### Admin Account

- **Email**: admin@university.edu
- **Password**: password123
- **Role**: Administrator

### Instructor Account

- **Email**: instructor@university.edu
- **Password**: password123
- **Role**: Instructor

### Student Account

- **Email**: student@university.edu
- **Password**: password123
- **Role**: Student

## 📚 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/set-password` - Set student password
- `GET /api/auth/me` - Get current user

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/students` - Get all students (Instructor only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Courses

- `GET /api/courses` - Get all courses
- `GET /api/courses/instructor` - Get instructor's courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course (Admin only)
- `PUT /api/courses/:id` - Update course (Admin only)
- `DELETE /api/courses/:id` - Delete course (Admin only)

### Enrollments

- `GET /api/enrollments` - Get enrollments
- `POST /api/enrollments` - Create enrollment
- `PUT /api/enrollments/:id` - Update enrollment
- `DELETE /api/enrollments/:id` - Delete enrollment

### Materials

- `GET /api/materials` - Get materials
- `POST /api/materials` - Upload material
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material

### Assignments

- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

### Results

- `GET /api/results` - Get results
- `POST /api/results` - Create result
- `PUT /api/results/:id` - Update result
- `DELETE /api/results/:id` - Delete result

## 🎯 User Roles & Permissions

### Administrator

- Full system access
- User management
- Course creation and management
- System configuration

### Instructor

- View and manage assigned courses
- Upload course materials
- Create and grade assignments
- View student progress
- Access to student information

### Student

- View enrolled courses
- Access course materials
- Submit assignments
- View grades and results
- Update profile information

## 🗂️ Project Structure

```
EAD-LMS/
├── Backend/                 # Backend API server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Authentication & validation
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   └── index.ts        # Server entry point
│   ├── uploads/            # File uploads directory
│   └── config.env          # Environment variables
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── App.tsx         # Main application component
│   └── .env                # Frontend environment variables
└── README.md               # This file
```

## 🔧 Development

### Backend Development

```bash
cd Backend
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
```

### Frontend Development

```bash
cd frontend
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running
   - Check connection string in `config.env`
   - Verify MongoDB port (default: 27017)

2. **Port Already in Use**

   - Change PORT in `config.env`
   - Kill processes using the port

3. **CORS Issues**

   - Check CORS_ORIGIN in `config.env`
   - Ensure frontend URL matches

4. **File Upload Issues**
   - Check `uploads/` directory permissions
   - Verify file size limits

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

