import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth";
import Logo from "../../assets/logo.png";
import { ACCOUNT_LOGIN_PATH, isAdminUser } from "../../utils/authRouting";
import "./StorefrontLayout.css";

export default function StorefrontLayout() {
  const { user } = useAuthContext();
  const { logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavPanelRef = useRef(null);
  const mobileNavToggleRef = useRef(null);
  const menuHashActive =
    location.pathname === "/menu" ||
    (location.pathname === "/" &&
      (location.hash === "#store-menu" || location.hash === "#menu"));

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const handleMouseDown = (event) => {
      const panel = mobileNavPanelRef.current;
      if (!panel) return;

      // Don't close when clicking the hamburger button itself.
      const toggle = mobileNavToggleRef.current;
      if (toggle && toggle.contains(event.target)) return;

      if (!panel.contains(event.target)) setMobileNavOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [mobileNavOpen]);

  return (
    <div className="storefront-root d-flex flex-column min-vh-100">
      <header className="storefront-header border-bottom">
        <div className="container py-3 d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <Link
            to="/"
            className="d-flex align-items-center gap-2 text-decoration-none text-dark"
          >
            <img src={Logo} alt="" className="storefront-logo rounded-circle" />
            <div>
              <div className="fw-bold text-brand">AJ Fitness Cafe</div>
              <div className="small text-muted storefront-tagline">
                Fresh juices, smoothies, and cafe drinks
              </div>
            </div>
          </Link>
          <nav className="storefront-nav d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              className="storefront-mobile-toggle"
              ref={mobileNavToggleRef}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <i className="fas fa-bars" aria-hidden="true" />
            </button>
            <Link
              to="/#store-menu"
              className={`storefront-nav-link storefront-nav-link--menu${menuHashActive ? " active" : ""}`}
              onClick={() => setMobileNavOpen(false)}
            >
              Menu
            </Link>
            <NavLink
              to="/cart"
              className="storefront-nav-link position-relative storefront-nav-link--desktop-cart"
            >
              Cart
              {itemCount > 0 ? (
                <span className="badge bg-brand ms-1">{itemCount}</span>
              ) : null}
            </NavLink>
            {isAdminUser(user) ? (
              <Link
                to="/admin"
                className="btn btn-sm btn-outline-secondary storefront-nav-link--desktop-auth"
              >
                Dashboard
              </Link>
            ) : user ? (
              <span className="d-flex align-items-center gap-2 storefront-nav-link--desktop-auth">
                <Link
                  to="/account/orders"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setMobileNavOpen(false)}
                >
                  My orders
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setMobileNavOpen(false);
                    void logout();
                  }}
                >
                  Log out
                </button>
              </span>
            ) : (
              <Link
                to={ACCOUNT_LOGIN_PATH}
                state={{ backgroundLocation: location }}
                className="btn btn-sm storefront-login-btn storefront-nav-link--desktop-auth"
                onClick={() => setMobileNavOpen(false)}
              >
                Login
              </Link>
            )}
            <div
              ref={mobileNavPanelRef}
              className={`storefront-mobile-panel${mobileNavOpen ? " open" : ""}`}
              role="dialog"
              aria-label="Store menu"
            >
              <NavLink
                to="/cart"
                className="storefront-mobile-panel-item storefront-nav-link position-relative"
                onClick={() => setMobileNavOpen(false)}
              >
                Cart
                {itemCount > 0 ? (
                  <span className="badge bg-brand ms-1">{itemCount}</span>
                ) : null}
              </NavLink>
              <Link
                to="/#store-menu"
                className={`storefront-mobile-panel-item storefront-nav-link${menuHashActive ? " active" : ""}`}
                onClick={() => setMobileNavOpen(false)}
              >
                Menu
              </Link>
              {isAdminUser(user) ? (
                <Link
                  to="/admin"
                  className="storefront-mobile-panel-item storefront-nav-link"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Dashboard
                </Link>
              ) : user ? (
                <>
                  <Link
                    to="/account/orders"
                    className="storefront-mobile-panel-item storefront-nav-link"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    My orders
                  </Link>
                  <button
                    type="button"
                    className="storefront-mobile-panel-item storefront-nav-link storefront-auth-link btn btn-link text-start text-decoration-none p-0 border-0 w-100"
                    onClick={() => {
                      setMobileNavOpen(false);
                      void logout();
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  to={ACCOUNT_LOGIN_PATH}
                  state={{ backgroundLocation: location }}
                  className="storefront-mobile-panel-item storefront-nav-link storefront-auth-link"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="storefront-main flex-grow-1 py-4">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className="storefront-footer border-top py-4 mt-auto">
        <div className="container small text-muted text-center">
          <p className="mb-1">
            &copy; {new Date().getFullYear()} AJ Fitness Cafe · Pagadian City
          </p>
          <p className="mb-0">Order online for pickup or delivery.</p>
        </div>
      </footer>
    </div>
  );
}
