# 🌟 Stars Vacation Management System - User Manual

*Version 2.1.0 | Last Updated: January 2025*

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Authentication & Access](#authentication--access)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Dashboard Overview](#dashboard-overview)
6. [Submitting Vacation Requests](#submitting-vacation-requests)
7. [Admin Management Features](#admin-management-features)
8. [Calendar Integration](#calendar-integration)
9. [Multi-Language Support](#multi-language-support)
10. [Troubleshooting](#troubleshooting)
11. [Frequently Asked Questions](#frequently-asked-questions)

---

## 🎯 Introduction

The Stars Vacation Management System is a comprehensive web application designed to streamline vacation request management for Stars companies. The system provides:

- **Easy vacation request submission** with company and leave type selection
- **Automated approval workflow** with admin review capabilities
- **Google Calendar integration** for automatic event creation
- **Multi-language support** (English, French, Italian)
- **Real-time conflict detection** and resolution tools
- **Comprehensive admin dashboard** with analytics and reporting

### Key Features

- ✅ **Half-day vacation support** (Morning/Afternoon)
- ✅ **Multi-company support** (Stars MC, Yachting, Real Estate, etc.)
- ✅ **Automated email notifications** for overdue requests
- ✅ **Interactive calendar views** with conflict detection
- ✅ **Mobile-responsive design** for all devices
- ✅ **Secure authentication** with @stars.mc domain restriction

---

## 🚀 Getting Started

### System Requirements

- **Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Internet Connection**: Required for all operations
- **Email Account**: Must be a @stars.mc email address
- **Device**: Desktop, tablet, or mobile phone

### Accessing the System

1. **Navigate to the application URL**
2. **Click "Continue with Google"** on the login page
3. **Sign in with your @stars.mc Google account**
4. **You'll be automatically redirected to the dashboard**

> **Note**: Only users with @stars.mc email addresses can access the system.

---

## 🔐 Authentication & Access

### Login Process

1. **Visit the application URL**
2. **Click "Continue with Google"**
3. **Enter your @stars.mc email credentials**
4. **Grant necessary permissions when prompted**
5. **You'll be redirected to the dashboard**

### Security Features

- **Domain Restriction**: Only @stars.mc email addresses are allowed
- **Google OAuth**: Secure authentication through Google
- **Session Management**: Automatic session handling
- **Role-Based Access**: Different permissions for users vs. administrators

### Troubleshooting Login Issues

| Issue | Solution |
|-------|----------|
| "Invalid credentials" message | Ensure you're using a @stars.mc email address |
| Google sign-in not working | Check your internet connection and try again |
| Access denied | Contact your administrator to verify your account |
| Session expired | Simply log in again - your session will be restored |

---

## 👥 User Roles & Permissions

### Regular Users
**Access Level**: Standard
**Permissions**:
- Submit vacation requests
- View personal vacation history
- Access dashboard and calendar
- View approved vacation requests

**Restricted From**:
- Approving/rejecting requests
- Accessing admin panel
- Viewing other users' requests
- Managing system settings

### Administrators
**Access Level**: Full
**Admin Email Addresses**:
- `pierre@stars.mc`
- `johnny@stars.mc`
- `daniel@stars.mc`
- `compta@stars.mc`
- `admin@stars.mc`

**Permissions**:
- All regular user permissions
- Approve/reject vacation requests
- Access admin management panel
- View all vacation requests
- Manage conflict resolution
- Export data and reports
- Access analytics dashboard

---

## 🏠 Dashboard Overview

The dashboard is your central hub for vacation management. It provides:

### Main Components

#### 1. **Global Vacation Calendar**
- **Visual calendar** showing all approved vacation requests
- **Color-coded by company** for easy identification
- **Monthly navigation** to view different time periods
- **Real-time updates** when requests are approved

#### 2. **Action Cards**

**Request Vacation Card**
- Quick access to submit new vacation requests
- Direct link to the vacation request form
- Visual calendar icon for easy identification

**Administration Card** (Admin Only)
- Access to vacation request management
- Link to analytics dashboard
- Administrative tools and controls

### Navigation Bar

The top navigation bar includes:
- **Stars Logo**: Click to return to dashboard
- **Main Menu**: Dashboard, Request Vacation, Management (admin only)
- **User Profile**: Shows your name and email
- **Language Selector**: Switch between English, French, Italian
- **Sign Out**: Secure logout option

---

## 📝 Submitting Vacation Requests

### Step-by-Step Process

#### 1. **Access the Request Form**
- From dashboard, click "Request Vacation" card
- Or use the navigation menu "Request Vacation"

#### 2. **Select Duration Type**
Choose between:
- **Full day(s)**: Complete work days off
- **Half day**: Morning (09:00-13:00) or Afternoon (14:00-18:00)

#### 3. **Select Half Day Type** (if applicable)
- **Morning (AM)**: 09:00 to 13:00
- **Afternoon (PM)**: 14:00 to 18:00

#### 4. **Choose Dates**
- **Start Date**: Required for all requests
- **End Date**: Required for full-day requests (auto-filled for half days)
- **Date Validation**: End date cannot be before start date

#### 5. **Select Company**
Choose from available companies:
- Stars MC
- Stars Yachting
- Stars Real Estate
- Le Pneu
- Midi Pneu
- Stars Aviation

#### 6. **Choose Leave Type**
Select the type of leave:
- **Paid Vacation**: Standard vacation time
- **Personal Day**: Personal time off
- **Récupération**: Compensation time
- **Other**: Other leave types

#### 7. **Add Reason** (Optional)
- Provide context for your request
- Help administrators understand the need
- Maximum 500 characters

#### 8. **Submit Request**
- Review all information
- Click "Submit Request"
- Confirmation message will appear

### Request Status Tracking

Your requests will show one of three statuses:

| Status | Description | What Happens Next |
|--------|-------------|-------------------|
| **Pending** | Awaiting admin review | Administrators will review and decide |
| **Approved** | Request accepted | Added to calendar, you're notified |
| **Rejected** | Request declined | You'll receive notification with reason |

### Form Validation

The system validates:
- ✅ Required fields are completed
- ✅ Dates are valid and logical
- ✅ Half-day type is selected for half-day requests
- ✅ End date is not before start date
- ✅ Company and leave type are selected

---

## 👨‍💼 Admin Management Features

### Admin Dashboard Access

Administrators have access to comprehensive management tools:

#### 1. **Vacation Request Management**
- **Pending Requests**: Immediate review queue
- **Approved Requests**: Historical approved requests
- **Rejected Requests**: Declined requests with reasons

#### 2. **Three View Modes**

**📋 List View**
- Organized table of all requests
- Sortable by date, employee, company, type, status
- Quick approve/reject actions
- Detailed request information

**📅 Calendar View**
- Visual monthly calendar
- Color-coded by status and company
- Conflict detection highlighting
- Easy navigation between months

**📊 Summary View**
- Statistics overview
- Conflict analysis
- High-conflict period identification
- Comprehensive reporting

#### 3. **Request Processing**

**Approve Requests**
1. Review request details
2. Check for conflicts
3. Click "Approve" button
4. Add optional admin comment
5. Request moves to approved status
6. Calendar event is automatically created

**Reject Requests**
1. Review request details
2. Click "Reject" button
3. Add rejection reason (required)
4. Request moves to rejected status
5. User is notified of rejection

#### 4. **Conflict Detection System**

**Automatic Detection**
- Identifies overlapping vacation requests
- Highlights high-conflict periods
- Shows which employees have conflicts
- Provides resolution guidance

**Conflict Resolution**
- View conflicting requests side-by-side
- Compare employee availability
- Make informed approval decisions
- Add comments explaining decisions

#### 5. **Administrative Tools**

**Clear Reviewed Requests**
- Bulk removal of processed requests
- Keeps interface clean and focused
- Confirmation dialog prevents accidents

**Export Functionality**
- CSV export of vacation data
- Filtered exports by date range
- Company-specific reports
- Analytics data export

**Request Review Links**
- Direct links to individual requests
- Quick access to request details
- Streamlined review process

### Admin Workflow Best Practices

1. **Daily Review**: Check pending requests daily
2. **Conflict Resolution**: Address conflicts promptly
3. **Clear Communication**: Add comments for rejections
4. **Regular Cleanup**: Clear reviewed requests weekly
5. **Monitor Analytics**: Use summary view for insights

---

## 📅 Calendar Integration

### Google Calendar Sync

The system automatically integrates with Google Calendar:

#### **Automatic Event Creation**
- **Approved requests** are automatically added to Google Calendar
- **Event details** include employee name, company, and dates
- **Color coding** by company for easy identification
- **Transparency settings** show as "busy" but transparent

#### **Calendar Features**
- **Real-time sync** with Google Calendar
- **Event updates** when requests are modified
- **Event deletion** when requests are rejected
- **Holiday integration** with company holiday calendar

#### **Calendar Access**
- **Public calendar** for team visibility
- **Mobile sync** with Google Calendar app
- **Email notifications** for calendar events
- **Conflict detection** with existing calendar events

### Calendar Management

**For Users**:
- View approved vacation in personal Google Calendar
- Receive calendar notifications
- Sync with mobile devices
- Share calendar with team members

**For Admins**:
- Monitor team availability
- Identify scheduling conflicts
- Plan around approved time off
- Export calendar data

---

## 🌍 Multi-Language Support

The system supports three languages:

### Available Languages
- **English (EN)**: Default language
- **French (FR)**: Français
- **Italian (IT)**: Italiano

### Language Switching
1. **Click the language selector** in the navigation bar
2. **Select your preferred language**
3. **Interface updates immediately**
4. **Language preference is saved** for future sessions

### Localized Content
- **Interface elements**: Buttons, labels, messages
- **Form fields**: Input labels and placeholders
- **Status messages**: Success/error notifications
- **Help text**: Instructions and descriptions

### Language-Specific Features
- **Date formats**: Localized date display
- **Number formats**: Regional number formatting
- **Currency**: Company-specific currency display
- **Time zones**: Automatic time zone detection

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### **Login Problems**

**Issue**: Cannot sign in with Google
**Solutions**:
- Verify you're using a @stars.mc email address
- Check your internet connection
- Clear browser cache and cookies
- Try a different browser
- Contact IT support if problem persists

**Issue**: "Access denied" message
**Solutions**:
- Confirm your email is in the admin list (if expecting admin access)
- Contact your administrator
- Verify your account status

#### **Request Submission Issues**

**Issue**: Form won't submit
**Solutions**:
- Check all required fields are completed
- Verify dates are valid and logical
- Ensure end date is not before start date
- Try refreshing the page
- Check internet connection

**Issue**: "Network error" message
**Solutions**:
- Check internet connection
- Try again in a few minutes
- Contact IT support if persistent

#### **Calendar Integration Issues**

**Issue**: Calendar events not appearing
**Solutions**:
- Wait 5-10 minutes for sync
- Check Google Calendar permissions
- Verify request was approved
- Contact admin to check calendar settings

**Issue**: Duplicate calendar events
**Solutions**:
- Contact admin to clean up duplicates
- Check if request was submitted multiple times
- Verify calendar sync settings

#### **Admin Panel Issues**

**Issue**: Cannot approve/reject requests
**Solutions**:
- Verify admin permissions
- Check if request is still pending
- Try refreshing the page
- Contact system administrator

**Issue**: Calendar view not loading
**Solutions**:
- Check internet connection
- Try switching to list view
- Clear browser cache
- Contact IT support

### Error Messages

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| "Invalid credentials" | Wrong email domain | Use @stars.mc email |
| "Unauthorized" | No permission | Contact admin |
| "Network error" | Connection issue | Check internet |
| "Form validation failed" | Missing/invalid data | Complete all required fields |
| "Calendar sync failed" | Calendar integration issue | Contact IT support |

---

## ❓ Frequently Asked Questions

### **General Questions**

**Q: Who can use the vacation management system?**
A: Only employees with @stars.mc email addresses can access the system.

**Q: Can I submit requests for multiple companies?**
A: Yes, you can submit requests for any of the Stars companies you work for.

**Q: How far in advance should I submit vacation requests?**
A: We recommend submitting requests at least 2 weeks in advance, though urgent requests are considered on a case-by-case basis.

**Q: Can I modify a request after submitting it?**
A: No, once submitted, requests cannot be modified. You would need to contact an administrator or submit a new request.

### **Request Process Questions**

**Q: What's the difference between full day and half day requests?**
A: Full day requests cover entire work days, while half day requests cover either morning (09:00-13:00) or afternoon (14:00-18:00) periods.

**Q: Can I submit multiple requests at once?**
A: Yes, you can submit multiple separate requests for different date ranges.

**Q: What happens if my request conflicts with someone else's?**
A: Administrators will review conflicts and make decisions based on business needs and seniority.

**Q: How long does approval take?**
A: Most requests are reviewed within 1-2 business days. Urgent requests may be processed faster.

### **Calendar Questions**

**Q: Will my approved vacation appear in my Google Calendar?**
A: Yes, approved requests are automatically added to the company Google Calendar.

**Q: Can I sync the calendar with my personal calendar?**
A: Yes, you can subscribe to the company calendar in your personal Google Calendar.

**Q: What if I don't see my vacation in the calendar?**
A: Wait 5-10 minutes for sync, then contact an administrator if it still doesn't appear.

### **Admin Questions**

**Q: How do I become an administrator?**
A: Administrator access is granted by existing admins. Contact pierre@stars.mc, johnny@stars.mc, or daniel@stars.mc.

**Q: Can I approve requests from mobile devices?**
A: Yes, the system is mobile-responsive and works on all devices.

**Q: How do I handle conflicting requests?**
A: Use the conflict detection system to identify conflicts and make informed decisions based on business needs.

**Q: Can I export vacation data?**
A: Yes, administrators can export data in CSV format for reporting purposes.

### **Technical Questions**

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions) are all supported.

**Q: Can I use the system offline?**
A: No, an internet connection is required for all operations.

**Q: Is my data secure?**
A: Yes, the system uses Google OAuth for authentication and follows security best practices.

**Q: What if I forget my password?**
A: Since the system uses Google authentication, use Google's password recovery process.

---

## 📞 Support & Contact

### **Technical Support**
- **Email**: IT Support team
- **Response Time**: 24-48 hours for non-urgent issues
- **Emergency**: Contact your direct supervisor

### **Administrative Support**
- **Primary Admin**: pierre@stars.mc
- **Secondary Admin**: johnny@stars.mc
- **Finance Admin**: compta@stars.mc
- **General Admin**: admin@stars.mc

### **System Information**
- **Version**: 2.1.0
- **Last Updated**: January 2025
- **Platform**: Web-based application
- **Hosting**: Vercel
- **Database**: Firebase Firestore

---

## 📚 Additional Resources

### **Training Materials**
- Video tutorials (coming soon)
- Step-by-step guides
- Best practices documentation

### **System Updates**
- Regular feature updates
- Security patches
- Performance improvements
- User feedback integration

### **Feedback**
We welcome your feedback to improve the system:
- Feature requests
- Bug reports
- User experience suggestions
- General comments

---

*This manual is regularly updated to reflect the latest system features and improvements. For the most current version, please check the system documentation.*

**© 2025 Stars Vacation Management System. All rights reserved.**
