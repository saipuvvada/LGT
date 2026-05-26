import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom'

import App from './App'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Cart from './pages/Cart'
import CategoryPage from './pages/CategoryPage'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Consult from './pages/Consult'
import Advisory from './pages/Advisory'
import Orders from './pages/Orders'
import Support from './pages/Support'
import AboutUs from './pages/AboutUs'
import { CartProvider } from './context/CartContext'
import ProtectedRoute from './components/ProtectedRoute'

ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <CartProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
        <Route path="/category/:slug" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
        <Route path="/consult" element={<ProtectedRoute><Consult /></ProtectedRoute>} />
        <Route path="/advisory" element={<ProtectedRoute><Advisory /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  </CartProvider>
)
