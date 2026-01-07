import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import Home from "./components/Home/Home";
import ConditionalNavbar from './components/ConditionalNavbar';
import Loader from './components/Loader';
import SiteWrapper from './components/SiteWrapper';
import DetailsProduct from './components/DetailsProduct/DetailsProduct';
import CategoryPage from './pages/CategoryPage';
import ProductList from './components/ProductList/ProductList';
import { CartProvider } from './context/CartContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './pages/admin/layout/AdminLayout';
import ProductListAdmin from './pages/admin/ProductListAdmin';
import OrderListAdmin from './pages/admin/OrderListAdmin';
import UserListAdmin from './pages/admin/UserListAdmin';
import ProductEditPage from './pages/admin/ProductEditPage';
import InventoryAdminPage from './pages/admin/InventoryAdminPage';
import AuthRedirector from './components/AuthRedirector';

import SideMenu from './components/SideMenu/SideMenu';
import CartPage from './pages/CartPage';
import { supabase } from './lib/supabaseClient';

function App() {
  const [loading, setLoading] = useState(true);
  const [loaderHidden, setLoaderHidden] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaderHidden(true);
      setTimeout(() => {
        setLoading(false);
      }, 800); // Match CSS transition time
    }, 3000);

    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('nombre, slug, orden')
        .is('parent_id', null)
        .order('orden', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        const normalizeSlug = (value) => (value || '').trim().toLowerCase();
        const normalizeName = (value) =>
          (value || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
        const sortedCategories = [...(data || [])].sort((a, b) => {
          const aOrder = Number.isFinite(a?.orden) ? a.orden : Number.POSITIVE_INFINITY;
          const bOrder = Number.isFinite(b?.orden) ? b.orden : Number.POSITIVE_INFINITY;

          if (aOrder !== bOrder) return aOrder - bOrder;

          const aName = normalizeName(a?.nombre);
          const bName = normalizeName(b?.nombre);

          const aSlug = normalizeSlug(a?.slug);
          const bSlug = normalizeSlug(b?.slug);

          const aIsCustomGear = aSlug === 'custom-gear' || aName === 'custom gear';
          const bIsCustomGear = bSlug === 'custom-gear' || bName === 'custom gear';

          if (aIsCustomGear && !bIsCustomGear) return 1;
          if (!aIsCustomGear && bIsCustomGear) return -1;

          return aName.localeCompare(bName);
        });

        setCategories(sortedCategories);
      }
    };

    fetchCategories();

    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <CartProvider>
        {loading && (
          <div id="loader-container" className={loaderHidden ? 'loader-hidden' : ''}>
            <Loader />
          </div>
        )}
        <Toaster position="bottom-center" />
        <SideMenu isOpen={isMenuOpen} toggleMenu={toggleMenu} categories={categories} />
        <SiteWrapper visible={!loading}>
          <ConditionalNavbar toggleMenu={toggleMenu} categories={categories} />
          <AuthRedirector />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/collections" element={<ProductList />} />
            <Route path="/categoria/:slug" element={<CategoryPage />} />
            <Route path="/producto/:id" element={<DetailsProduct />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route 
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <Outlet />
                  </AdminLayout>
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<ProductListAdmin />} />
              <Route path="products/new" element={<ProductEditPage />} />
              <Route path="products/edit/:id" element={<ProductEditPage />} />
              <Route path="orders" element={<OrderListAdmin />} />
              <Route path="users" element={<UserListAdmin />} />
              <Route path="inventory" element={<InventoryAdminPage />} />
            </Route>
          </Routes>
        </SiteWrapper>
      </CartProvider>
    </Router>
  );
}

export default App;
