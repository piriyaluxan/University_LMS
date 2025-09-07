# Learning Management System (LMS)

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
git clone https://github.com/piriyaluxan/University_LMS.git
cd University_LMS
```

### 2. Backend Setup

```bash
cd Backend
npm install
```



### 3. Frontend Setup

```bash
cd ../frontend
npm install
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


