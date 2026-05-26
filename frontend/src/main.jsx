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
      </Routes>
    </BrowserRouter>
  </CartProvider>
)
