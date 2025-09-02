# Student Portal Access Control Implementation

## Overview

This implementation provides secure student portal access with enrollment-based restrictions. Students can only access courses they are enrolled in, including assignments, materials, and results.

## Key Features

### 🔐 Authentication & Authorization

- **Protected Routes**: All student routes are protected with authentication middleware
- **Role-Based Access**: Only users with "student" role can access student portal
- **Session Management**: JWT-based authentication with automatic token validation

### 📚 Enrollment-Based Access Control

- **Course Access**: Students can only view and interact with courses they are enrolled in
- **Assignment Access**: Only assignments from enrolled courses are visible
- **Material Access**: Course materials are restricted to enrolled courses only
- **Results Access**: Students can only view their own results for enrolled courses

### 📅 Calendar Integration

- **Assignment Calendar**: Interactive calendar showing assignment due dates
- **Due Date Hover**: Hover over calendar dates to see course code and assignment title
- **Overdue Indicators**: Visual indicators for overdue assignments
- **Weekly Overview**: Quick stats showing assignments due this week

### 📊 Results Display

- **Grade Display**: Shows final grades and percentages for completed courses
- **Progress Tracking**: Visual progress indicators for course completion
- **Status Indicators**: Clear status badges (Passed, Failed, Pending)

## API Endpoints

### Authentication

- `GET /api/auth/me` - Get current user information
- `POST /api/auth/login` - Student login

### Student-Specific Endpoints

- `GET /api/enrollments/student/me` - Get current student's enrollments
- `GET /api/assignments/enrolled` - Get assignments for enrolled courses only
- `GET /api/materials/enrolled` - Get materials for enrolled courses only
- `GET /api/results` - Get student's own results

## Frontend Components

### ProtectedRoute Component

```typescript
<ProtectedRoute allowedRoles={["student"]}>
  <StudentPortal />
</ProtectedRoute>
```

### StudentPortal Features

- **Real-time Data**: Fetches live data from API endpoints
- **Loading States**: Proper loading indicators during data fetch
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Mobile-friendly interface

## Security Implementation

### Backend Security

1. **JWT Token Validation**: All requests require valid JWT tokens
2. **Role Verification**: Middleware checks user roles before allowing access
3. **Data Isolation**: Students can only access their own data
4. **Enrollment Validation**: API endpoints filter data based on enrollments

### Frontend Security

1. **Route Protection**: All student routes are wrapped with ProtectedRoute
2. **Token Management**: Automatic token validation and cleanup
3. **Session Handling**: Proper logout and session cleanup
4. **Error Boundaries**: Graceful handling of authentication failures

## Database Schema

### Enrollment Model

```typescript
interface Enrollment {
  student: ObjectId; // Reference to User
  course: ObjectId; // Reference to Course
  status: "active" | "completed" | "dropped" | "suspended";
  progress: number; // 0-100
  grade?: string; // Final grade
  score?: number; // Final score
  enrollmentDate: Date;
}
```

### Result Model

```typescript
interface Result {
  student: ObjectId; // Reference to User
  course: ObjectId; // Reference to Course
  finalGrade?: string; // A+, B-, etc.
  finalPercentage?: number; // 0-100
  status: "passed" | "failed" | "pending" | "incomplete";
  caScore?: number; // Continuous Assessment
  finalExamScore?: number; // Final Exam Score
}
```

## Usage Flow

1. **Student Registration**: Admin creates student accounts via admin panel
2. **Student Login**: Students log in with email, password, and role
3. **Authentication Check**: ProtectedRoute validates token and role
4. **Data Loading**: Portal fetches enrolled courses, assignments, materials, and results
5. **Course Enrollment**: Students can enroll in available courses
6. **Content Access**: Students access materials and assignments for enrolled courses only

## Calendar Features

### Monthly View

- Shows current month with assignment due dates
- Color-coded indicators (blue for due, red for overdue)
- Hover tooltips showing course code and assignment title
- Navigation between months

### Weekly Overview

- Quick stats panel showing:
  - Total assignments
  - Due this week
  - Overdue assignments
- List of upcoming assignments with due dates

## Error Handling

### Authentication Errors

- Invalid token → Redirect to login
- Expired token → Automatic logout
- Wrong role → Access denied message

### Data Loading Errors

- Network errors → Retry mechanism
- Server errors → User-friendly error messages
- Empty states → Helpful guidance messages

## Testing

Run the test script to verify functionality:

```bash
node test-student-portal.js
```

## Future Enhancements

1. **Real-time Notifications**: Push notifications for assignment due dates
2. **Progress Tracking**: More detailed progress analytics
3. **File Upload**: Assignment submission functionality
4. **Discussion Forums**: Course-specific discussion boards
5. **Grade Analytics**: Detailed grade breakdowns and trends

## Security Best Practices

1. **Input Validation**: All user inputs are validated on both frontend and backend
2. **SQL Injection Prevention**: Using Mongoose ODM with parameterized queries
3. **XSS Prevention**: Proper content sanitization
4. **CSRF Protection**: JWT tokens provide CSRF protection
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Audit Logging**: Log all authentication and data access events
