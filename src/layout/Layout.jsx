import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import "./layout-shell.css";

export default function Layout() {
  const { pathname } = useLocation();
  const { user } = useAuthContext();
  const [sidebarToggled, setSidebarToggled] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  const toggleSidebar = () => setSidebarToggled((prev) => !prev);
  const closeSidebar = () => setSidebarToggled(false);

  const handleMainClick = () => {
    if (window.innerWidth < 768 && sidebarToggled) closeSidebar();
  };

  useEffect(() => {
    const body = document.body;
    if (sidebarToggled) body.classList.add("sb-sidenav-toggled");
    else body.classList.remove("sb-sidenav-toggled");
    return () => body.classList.remove("sb-sidenav-toggled");
  }, [sidebarToggled]);

  useEffect(() => {
    const body = document.body;
    body.classList.add("admin-layout-active");
    return () => body.classList.remove("admin-layout-active");
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!user) return null;

  const showOverlay = sidebarToggled && isMobile;

  return (
    <div className="sb-nav-fixed">
      <Topbar onToggleSidebar={toggleSidebar} />
      <div id="layoutSidenav">
        <div id="layoutSidenav_nav">
          <Sidebar onCloseSidebar={closeSidebar} />
        </div>
        <div
          id="layoutSidenav_content"
          onClick={handleMainClick}
          onKeyDown={() => {}}
          role="presentation"
        >
          <main>
            <div
              key={pathname}
              className="container-fluid page-enter"
            >
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>
      {showOverlay ? (
        <div
          className="mobile-sidebar-overlay"
          onClick={closeSidebar}
          onKeyDown={() => {}}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      ) : null}
    </div>
  );
}
