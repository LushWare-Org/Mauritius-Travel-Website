import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useEffect } from 'react';
import authDiagnostic from './utils/authDiagnostic';
import AuthMonitor from './components/auth/AuthMonitor';
import { wakeUpBackend, keepBackendAwake } from './utils/wakeUpBackend';

// Import environment checker for development debugging
if (import.meta.env.DEV) {
  import('./utils/envCheck.js');
}

// Run auth diagnostics and wake up the backend in production
if (import.meta.env.PROD) {
  wakeUpBackend().then((result) => {
    if (result.success) {
      console.log('Successfully woke up backend server');
      keepBackendAwake(10 * 60 * 1000);
    }
  });

  setTimeout(() => {
    authDiagnostic
      .testApiConnection()
      .then((result) => {
        if (result.success) {
          console.log('API connection test successful');
        } else {
          console.warn(
            'API connection test failed, authentication may not work properly'
          );
        }
      })
      .catch((error) => console.error('Error testing API connection:', error));
  }, 2000);
}

// Import all your existing pages
import Home from './pages/Home';
import Activities from './pages/Activities';
import ActivityDetail from './pages/ActivityDetail';
import BookingRequest from './pages/BookingRequest';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/auth/Profile';
import Dashboard from './pages/dashboard/Dashboard';
import MyBookings from './pages/dashboard/MyBookings';
import EditProfile from './pages/dashboard/EditProfile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import NotFound from './pages/NotFound';
import About from './pages/About';
import Contact from './pages/ContactForm';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Navbar from './components/common/Navbar';
import ContactHistory from './pages/UserContactHistory';
import DashboardLayout from './components/dashboard/DashboardLayout';
import HelpCenter from './pages/helpcenter';
import TourPackages from './pages/TourPackages';
import TourPackageDetail from './pages/TourPackageDetail.jsx';
import TourPackageBookingRequest from './pages/TourPackageBookingRequest';
import MyTourPackageBookings from './pages/dashboard/MyTourPackageBookings.jsx';
import UserTourPackageBookingDetail from './pages/dashboard/TourPackageBookingDetail';
import TourPackageBookingConfirmation from './components/tour-detail/TourPackageBookingConfirmation';
import BookingConfirmation from './pages/BookingConfirmation';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminActivities from './pages/admin/Activities';
import ActivityForm from './pages/admin/ActivityForm';
import AdminBookings from './pages/admin/Bookings';
import AdminBookingDetail from './pages/admin/BookingDetail';
import AdminUsers from './pages/admin/Users';
import AdminActivityView from './pages/admin/AdminActivityView';

import AirportTransferList from './components/AirportTransferList';
import AirportTransferBookingForm from './components/AirportTransferBookingForm';
import AirportTransfers from './pages/admin/AirportTransfers';
import AirportTransferForm from './pages/admin/AirportTransferForm';
import AirportTransferBookings from './pages/admin/AirportTransferBookings';
import UserAirportTransfers from './pages/dashboard/UserAirportTransfers';
import AdminTourPackages from './pages/admin/TourPackages';
import AdminTourPackageView from './pages/admin/AdminTourPackageView.jsx';
import TourPackageForm from './pages/admin/TourPackageForm';
import AdminTourPackageBooking from './pages/admin/AdminTourPackageBooking';
import AdminTourPackageBookingDetail from './pages/admin/TourPackageBookingDetail';
import AdminReviews from './pages/admin/reviews/ReviewsPage.jsx';

// Import Activity Review Admin Pages
import AdminActivityReviews from './pages/admin/reviews/activity/ActivityReviews';
import ActivityReviewDetail from './pages/admin/reviews/activity/ActivityReviewDetail';
import TourAdminFeedbackPanel from './pages/admin/reviews/TourReview/TourAdminFeedbackPanel';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && (
        <>
          <Header />
          <Navbar />
        </>
      )}
      <main className={`flex-grow ${isAdminRoute ? 'h-screen' : ''}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/activities/:id" element={<ActivityDetail />} />
          <Route path="/booking/:id" element={<BookingRequest />} />
          <Route path="/airport-transfers" element={<AirportTransferList />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/tour-packages" element={<TourPackages />} />
          <Route path="/tour-packages/:id" element={<TourPackageDetail />} />
          <Route
            path="/tour-package-booking-request/:id"
            element={<TourPackageBookingRequest />}
          />
          <Route
            path="/booking-confirmation"
            element={<BookingConfirmation />}
          />
          <Route
            path="/airport-transfer/book/:id?"
            element={<AirportTransferBookingForm />}
          />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* User Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tour-package-bookings"
            element={
              <ProtectedRoute>
                <MyTourPackageBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tour-package-bookings/:id"
            element={
              <ProtectedRoute>
                <UserTourPackageBookingDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/airport-transfers"
            element={
              <ProtectedRoute>
                <DashboardLayout title="My Airport Transfers">
                  <UserAirportTransfers />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tour-package-booking-confirmation/:id"
            element={
              <ProtectedRoute>
                <TourPackageBookingConfirmation />
              </ProtectedRoute>
            }
          />

          {/* Contact History Route */}
          <Route
            path="/contacthistory"
            element={
              <ProtectedRoute>
                <DashboardLayout title="Contact History">
                  <ContactHistory />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          {/* Admin Routes */}
          <Route
            path="/admin/TourAdminFeedbackPanel"
            element={
              <AdminRoute>
                <TourAdminFeedbackPanel />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/reviews"
            element={
              <AdminRoute>
                <AdminReviews />
              </AdminRoute>
            }
          />
          {/* Activity Review Admin Routes */}
          <Route
            path="/admin/activity-reviews"
            element={
              <AdminRoute>
                <AdminActivityReviews />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/activity-reviews/:id"
            element={
              <AdminRoute>
                <ActivityReviewDetail />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/activities"
            element={
              <AdminRoute>
                <AdminActivities />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/activities/new"
            element={
              <AdminRoute>
                <ActivityForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/activities/:id"
            element={
              <AdminRoute>
                <ActivityForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/activities/view/:id"
            element={
              <AdminRoute>
                <AdminActivityView />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/bookings"
            element={
              <AdminRoute>
                <AdminBookings />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/bookings/:id"
            element={
              <AdminRoute>
                <AdminBookingDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tour-packages"
            element={
              <AdminRoute>
                <AdminTourPackages />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tour-packages/new"
            element={
              <AdminRoute>
                <TourPackageForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tour-packages/:id"
            element={
              <AdminRoute>
                <TourPackageForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tour-packages/view/:id"
            element={
              <AdminRoute>
                <AdminTourPackageView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tour-package-bookings"
            element={
              <AdminRoute>
                <AdminTourPackageBooking />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tour-package-bookings/:id"
            element={
              <AdminRoute>
                <AdminTourPackageBookingDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/airport-transfers"
            element={
              <AdminRoute>
                <AirportTransfers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/airport-transfers/new"
            element={
              <AdminRoute>
                <AirportTransferForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/airport-transfers/:id/edit"
            element={
              <AdminRoute>
                <AirportTransferForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/airport-transfer-bookings"
            element={
              <AdminRoute>
                <AirportTransferBookings />
              </AdminRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <AuthMonitor />
      </Router>
    </AuthProvider>
  );
}

export default App;
