import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useMemo } from "react";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { useAuthContext } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPermissionRoute from "./components/AdminPermissionRoute";
import CustomerProtectedRoute from "./components/CustomerProtectedRoute";
import Layout from "./layout/Layout";
import StorefrontLayout from "./layout/store/StorefrontLayout";
import Login from "./pages/public/Login";
import AccountLoginPage from "./pages/account/AccountLoginPage";
import AccountRegisterPage from "./pages/account/AccountRegisterPage";
import AccountForgotPasswordPage from "./pages/account/AccountForgotPasswordPage";
import AccountResetPasswordPage from "./pages/account/AccountResetPasswordPage";
import AccountVerifyEmailPage from "./pages/account/AccountVerifyEmailPage";
import AccountOrdersPage from "./pages/account/AccountOrdersPage";
import AccountOrderDetailPage from "./pages/account/AccountOrderDetailPage";
import AdminHomePage from "./pages/admin/AdminHomePage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";
import AdminInventoryPage from "./pages/admin/AdminInventoryPage";
import AdminSecurityPage from "./pages/admin/AdminSecurityPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminCustomerDetailPage from "./pages/admin/AdminCustomerDetailPage";
import AdminOpsBoardPage from "./pages/admin/AdminOpsBoardPage";
import AdminPosPage from "./pages/admin/AdminPosPage";
import AdminPosReceiptPage from "./pages/admin/AdminPosReceiptPage";
import CategoryListPage from "./pages/admin/categories/CategoryListPage";
import ProductListPage from "./pages/admin/products/ProductListPage";
import ProductFormPage from "./pages/admin/products/ProductFormPage";
import {
  ACCOUNT_LOGIN_PATH,
  ADMIN_LOGIN_PATH,
  LAST_STOREFRONT_LOCATION_KEY,
  isProtectedStorefrontPath,
} from "./utils/authRouting";
import StoreHomePage from "./pages/store/StoreHomePage";
import ProductDetailPage from "./pages/store/ProductDetailPage";
import CartPage from "./pages/store/CartPage";
import CheckoutPage from "./pages/store/CheckoutPage";
import OrderThanksPage from "./pages/store/OrderThanksPage";

const AUTH_MODAL_PATHS = new Set([
  "/account/login",
  "/account/register",
  "/account/forgot-password",
  "/account/reset-password",
  "/account/verify-email",
]);
function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    const isStorefrontPath =
      location.pathname.startsWith("/") && !location.pathname.startsWith("/admin");
    const isAuthModalPath = AUTH_MODAL_PATHS.has(location.pathname);
    const isProtected = isProtectedStorefrontPath(location.pathname);
    if (!isStorefrontPath || isAuthModalPath || isProtected) return;
    const snapshot = `${location.pathname}${location.search}${location.hash}`;
    window.sessionStorage.setItem(LAST_STOREFRONT_LOCATION_KEY, snapshot);
  }, [location.pathname, location.search, location.hash]);

  const fallbackBackgroundLocation = useMemo(() => {
    if (!AUTH_MODAL_PATHS.has(location.pathname)) return null;
    const raw = window.sessionStorage.getItem(LAST_STOREFRONT_LOCATION_KEY);
    if (!raw || raw.startsWith("/account/")) return { pathname: "/cart" };
    const parsed = new URL(raw, window.location.origin);
    if (isProtectedStorefrontPath(parsed.pathname)) {
      return { pathname: "/cart" };
    }
    return {
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
    };
  }, [location.pathname]);

  let backgroundLocation = location.state?.backgroundLocation ?? fallbackBackgroundLocation;
  if (
    backgroundLocation &&
    !isAuthenticated &&
    isProtectedStorefrontPath(backgroundLocation.pathname || "")
  ) {
    backgroundLocation = fallbackBackgroundLocation ?? { pathname: "/cart" };
  }

  useEffect(() => {
    if (location.pathname !== "/login") return;
    navigate("/account/login", {
      replace: true,
      state: {
        backgroundLocation:
          location.state?.backgroundLocation ??
          fallbackBackgroundLocation ??
          { pathname: "/" },
      },
    });
  }, [location.pathname, location.state, navigate, fallbackBackgroundLocation]);

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path={ADMIN_LOGIN_PATH} element={<Login />} />
        <Route path="/login" element={<Navigate to={ACCOUNT_LOGIN_PATH} replace />} />
        <Route path="/" element={<StorefrontLayout />}>
          <Route index element={<StoreHomePage />} />
          <Route path="menu" element={<StoreHomePage />} />
          <Route path="product/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route
            path="checkout"
            element={
              <CustomerProtectedRoute>
                <CheckoutPage />
              </CustomerProtectedRoute>
            }
          />
          <Route path="order/thanks" element={<OrderThanksPage />} />
          <Route path="account/login" element={<AccountLoginPage />} />
          <Route path="account/register" element={<AccountRegisterPage />} />
          <Route
            path="account/forgot-password"
            element={<AccountForgotPasswordPage />}
          />
          <Route
            path="account/reset-password"
            element={<AccountResetPasswordPage />}
          />
          <Route
            path="account/verify-email"
            element={<AccountVerifyEmailPage />}
          />
          <Route
            path="account/orders"
            element={
              <CustomerProtectedRoute>
                <AccountOrdersPage />
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="account/orders/:orderNumber"
            element={
              <CustomerProtectedRoute>
                <AccountOrderDetailPage />
              </CustomerProtectedRoute>
            }
          />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHomePage />} />
          <Route path="analytics" element={<AdminPermissionRoute permission="analytics.view"><AdminAnalyticsPage /></AdminPermissionRoute>} />
          <Route path="orders" element={<AdminPermissionRoute permission="orders.view"><AdminOrdersPage /></AdminPermissionRoute>} />
          <Route path="pos" element={<AdminPermissionRoute permission="pos.use"><AdminPosPage /></AdminPermissionRoute>} />
          <Route path="pos/receipt/:id" element={<AdminPermissionRoute permission="pos.receipt.view"><AdminPosReceiptPage /></AdminPermissionRoute>} />
          <Route path="customers" element={<AdminPermissionRoute permission="customers.view"><AdminCustomersPage /></AdminPermissionRoute>} />
          <Route path="customers/:id" element={<AdminPermissionRoute permission="customers.view"><AdminCustomerDetailPage /></AdminPermissionRoute>} />
          <Route path="orders/:id" element={<AdminPermissionRoute permission="orders.view"><AdminOrderDetailPage /></AdminPermissionRoute>} />
          <Route path="payments" element={<AdminPermissionRoute permission="orders.view"><AdminPaymentsPage /></AdminPermissionRoute>} />
          <Route path="ops" element={<AdminPermissionRoute permission="ops.board.view"><AdminOpsBoardPage /></AdminPermissionRoute>} />
          <Route path="inventory" element={<AdminPermissionRoute permission="inventory.view"><AdminInventoryPage /></AdminPermissionRoute>} />
          <Route path="settings" element={<AdminPermissionRoute permission="settings.view"><AdminSettingsPage /></AdminPermissionRoute>} />
          <Route path="audit-logs" element={<AdminPermissionRoute permission="audit.view"><AdminAuditLogsPage /></AdminPermissionRoute>} />
          <Route path="security" element={<AdminPermissionRoute permission="security.sessions.view"><AdminSecurityPage /></AdminPermissionRoute>} />
          <Route path="categories" element={<AdminPermissionRoute permission="catalog.manage"><CategoryListPage /></AdminPermissionRoute>} />
          <Route path="products" element={<AdminPermissionRoute permission="catalog.manage"><ProductListPage /></AdminPermissionRoute>} />
          <Route path="products/new" element={<AdminPermissionRoute permission="catalog.manage"><ProductFormPage /></AdminPermissionRoute>} />
          <Route path="products/:id/edit" element={<AdminPermissionRoute permission="catalog.manage"><ProductFormPage /></AdminPermissionRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {backgroundLocation ? (
        <Routes>
          <Route path="/account/login" element={<AccountLoginPage />} />
          <Route path="/account/register" element={<AccountRegisterPage />} />
          <Route
            path="/account/forgot-password"
            element={<AccountForgotPasswordPage />}
          />
          <Route
            path="/account/reset-password"
            element={<AccountResetPasswordPage />}
          />
          <Route
            path="/account/verify-email"
            element={<AccountVerifyEmailPage />}
          />
        </Routes>
      ) : null}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3200}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </CartProvider>
    </AuthProvider>
  );
}
