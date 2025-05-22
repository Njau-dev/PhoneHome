import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context providers
import { useAuth } from './context/AuthContext';

// Components
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Users from './pages/Users';
import AddProduct from './components/AddProduct';
import OrderDetails from './components/OrderDetails';
import BrandManagement from './components/BrandManagement';

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />
        } />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/add" element={<AddProduct />} />
            <Route path="/products/brand-management" element={<BrandManagement />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>

        {/* Redirect route */}
        <Route path="*" element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
};

export default App;