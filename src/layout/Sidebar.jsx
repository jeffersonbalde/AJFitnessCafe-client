import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { hasPermission } from "../utils/authRouting";

const menuSections = [
  {
    heading: "OVERVIEW",
    items: [
      {
        icon: "fas fa-chart-pie",
        label: "Analytics",
        href: "/admin/analytics",
        permission: "analytics.view",
      },
      {
        icon: "fas fa-tachometer-alt",
        label: "Dashboard",
        href: "/admin",
        permission: "dashboard.view",
      },
    ],
  },
  {
    heading: "CATALOG",
    items: [
      {
        icon: "fas fa-folder-open",
        label: "Categories",
        href: "/admin/categories",
        permission: "catalog.manage",
      },
      {
        icon: "fas fa-box-open",
        label: "Products",
        href: "/admin/products",
        permission: "catalog.manage",
      },
    ],
  },
  {
    heading: "CONFIG",
    items: [
      {
        icon: "fas fa-sliders-h",
        label: "Settings",
        href: "/admin/settings",
        permission: "settings.view",
      },
    ],
  },
  {
    heading: "STORE",
    items: [
      {
        icon: "fas fa-receipt",
        label: "Orders",
        href: "/admin/orders",
        permission: "orders.view",
      },
      {
        icon: "fas fa-cash-register",
        label: "POS",
        href: "/admin/pos",
        permission: "pos.use",
      },
      {
        icon: "fas fa-users",
        label: "Customers",
        href: "/admin/customers",
        permission: "customers.view",
      },
      {
        icon: "fas fa-credit-card",
        label: "Payment alerts",
        href: "/admin/payments",
        permission: "orders.view",
      },
      {
        icon: "fas fa-clipboard-check",
        label: "Ops board",
        href: "/admin/ops",
        permission: "ops.board.view",
      },
      {
        icon: "fas fa-warehouse",
        label: "Inventory",
        href: "/admin/inventory",
        permission: "inventory.view",
      },
    ],
  },
];

function isActiveLink(pathname, href) {
  const normalize = (p) => (p || "").replace(/\/+$/, "") || "/";
  const current = normalize(pathname);
  const target = normalize(href);
  if (target === "/admin") return current === "/admin";
  return current === target || current.startsWith(`${target}/`);
}

export default function Sidebar({ onCloseSidebar }) {
  const { user } = useAuthContext();
  const location = useLocation();

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768 && onCloseSidebar) onCloseSidebar();
  };

  return (
    <nav
      className="sb-sidenav accordion sb-sidenav-dark"
      id="sidenavAccordion"
    >
      <div className="sb-sidenav-menu">
        {menuSections.map((section) => (
          <Fragment key={section.heading}>
            <div className="sb-sidenav-menu-heading">{section.heading}</div>
            <ul className="nav">
              {section.items
                .filter((item) => !item.permission || hasPermission(user, item.permission))
                .map((item) => {
                const isActive = isActiveLink(location.pathname, item.href);
                return (
                  <li className="nav-item" key={item.href}>
                    <Link
                      className={`nav-link ${isActive ? "active" : ""}`}
                      to={item.href}
                      onClick={closeSidebarOnMobile}
                    >
                      <i className={`sb-nav-link-icon ${item.icon}`} />
                      <span className="sb-nav-link-label">{item.label}</span>
                      {isActive ? (
                        <i
                          className="fas fa-chevron-right sb-nav-link-arrow"
                          aria-hidden
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Fragment>
        ))}
      </div>
      <div className="sb-sidenav-footer">
        <div className="small">Logged in as</div>
        <div className="user-name">{user?.name || user?.email || "User"}</div>
        <div className="small text-white-50">Administrator</div>
      </div>
    </nav>
  );
}
