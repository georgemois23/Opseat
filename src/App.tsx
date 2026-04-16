import React from 'react';
import './App.css';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import Login from './pages/Login';
import HomePage from './pages/Home';
import BrowsePage from './features/customer/pages/BrowsePage';
import BrowseLegacyRedirect from './features/customer/pages/BrowseLegacyRedirect';
import { useAuth } from './features/auth/hooks/useAuth';
import Register from './pages/Register';
import CreateRestaurant from './features/restaurants/pages/CreateRestaurant';
import MyRestaurants from './features/restaurants-user/pages/MyRestaurants/MyRestaurants';
import MyRestaurantPreview from './features/restaurants-user/pages/MyRestaurants/slug';
import MyRestaurantOrdersPage from './features/restaurants-user/pages/MyRestaurants/MyRestaurantOrdersPage';
import MyRestaurantOrderDetailPage from './features/restaurants-user/pages/MyRestaurants/MyRestaurantOrderDetailPage';
import RestaurantPreview from './features/restaurants/pages/slug';
import CheckoutPage from './features/restaurants/pages/CheckoutPage';
import RestaurantOrderPreviewPage from './features/restaurants/pages/RestaurantOrderPreviewPage';
import Layout from './Layout';
import LoadingSpinner from './components/LoadingSpinner';
import LandingPage from './pages/LandingPage';

/** Old URLs used `/restaurant/:slug/order/:id`; orders are keyed only by id. */
function LegacyRestaurantOrderRedirect() {
  const { orderId } = useParams<{ orderId: string }>();
  return <Navigate to={orderId ? `/order/${encodeURIComponent(orderId)}` : '/home'} replace />;
}

function App() {
  const {user, isLoading} = useAuth()
  if(isLoading) {
    return <LoadingSpinner />
  }
  return (
    <div className="App">
      <Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={user ? <Navigate to="/home" replace /> : <LandingPage />} />

    {/* Authenticated Dashboard */}
    <Route path="home" element={user ? <HomePage /> : <Navigate to="/login" />} />
    <Route path="browse" element={user ? <BrowsePage /> : <Navigate to="/login" />} />
    <Route path="browse/:category" element={user ? <BrowseLegacyRedirect /> : <Navigate to="/login" />} />

    {/* Auth Pages */}
    <Route path="login" element={!user ? <Login /> : <Navigate to="/home" />} />
    <Route path="signup" element={!user ? <Register /> : <Navigate to="/home" />} />

    {user && <Route path="order/:orderId" element={<RestaurantOrderPreviewPage />} />}

    {/* Protected Restaurant Routes */}
    {user && (
      <Route path="restaurant">
        <Route path="create" element={<CreateRestaurant />} />
        <Route path="my">
          <Route index element={<MyRestaurants />} />
          <Route path=":id/orders/:orderId" element={<MyRestaurantOrderDetailPage />} />
          <Route path=":id/orders" element={<MyRestaurantOrdersPage />} />
          <Route path=":id" element={<MyRestaurantPreview />} />
        </Route>
        <Route path=":slug/checkout" element={<CheckoutPage />} />
        <Route path=":slug/order/:orderId" element={<LegacyRestaurantOrderRedirect />} />
        <Route path=":slug" element={<RestaurantPreview />} />
      </Route>
    )}

    {!user && <Route path="*" element={<Navigate to="/" replace />} />}
  </Route>
</Routes>
    </div>
  );
}

export default App;