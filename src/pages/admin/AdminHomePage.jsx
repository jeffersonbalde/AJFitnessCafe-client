import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories } from "../../api/admin/categories";
import { fetchProducts } from "../../api/admin/products";
import AdminPageShell from "./AdminPageShell";
import AdminPageLoading from "./AdminPageLoading";
import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

function StatCard({ iconClassName, label, value, hint, href, linkLabel }) {
  return (
    <div className="col-12 col-md-6">
      <div
        className="p-3 rounded-3 h-100"
        style={{
          backgroundColor: "#ffffff",
          border: T.cardBorder,
          display: "flex",
          alignItems: "center",
          gap: 12,
          transition:
            "background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f0f7f3";
          e.currentTarget.style.boxShadow =
            "0 6px 18px rgba(15, 118, 110, 0.10)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#ffffff";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            minHeight: 36,
            backgroundColor: T.emptyIconBg,
            color: T.primaryGreen,
          }}
        >
          <i className={iconClassName} aria-hidden />
        </div>
        <div className="flex-grow-1 min-w-0">
          <div
            style={{
              fontFamily: T.interFamily,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: T.subtitleColor,
              marginBottom: 4,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontFamily: T.interFamily,
              fontWeight: 700,
              fontSize: "1.25rem",
              color: "#111827",
            }}
          >
            {value}
          </div>
          <div
            className="text-muted"
            style={{ fontFamily: T.interFamily, fontSize: "0.8rem" }}
          >
            {hint}
          </div>
          <Link
            to={href}
            className="small d-inline-block mt-1"
            style={{
              fontFamily: T.interFamily,
              color: T.primaryGreen,
              fontWeight: 600,
            }}
          >
            {linkLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  const [counts, setCounts] = useState({ categories: null, products: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [catRes, prodRes] = await Promise.all([
          fetchCategories(),
          fetchProducts(),
        ]);
        if (cancelled) return;
        const cats = catRes.data?.data ?? catRes.data ?? [];
        const prods = prodRes.data?.data ?? prodRes.data ?? [];
        setCounts({
          categories: Array.isArray(cats) ? cats.length : 0,
          products: Array.isArray(prods) ? prods.length : 0,
        });
      } catch {
        if (!cancelled) {
          setError("Could not load stats.");
          setCounts({ categories: 0, products: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <AdminPageLoading
        iconClassName="fas fa-chart-line"
        title="System dashboard"
        subtitle="Preparing your catalog overview…"
        message="Loading dashboard… Please wait."
      />
    );
  }

  return (
    <div className="page-enter">
      <AdminPageShell
        iconClassName="fas fa-chart-line"
        title="System dashboard"
        subtitle="Monitor categories, products, and your catalog for the storefront."
      >
      {error ? (
        <p className="text-danger small mb-3" style={{ fontFamily: T.interFamily }}>
          {error}
        </p>
      ) : null}

      <div className="row g-3 mb-3">
        <StatCard
          iconClassName="fas fa-folder-open"
          label="Categories"
          value={counts.categories ?? 0}
          hint="Product groups for your menu and catalog."
          href="/admin/categories"
          linkLabel="Manage categories →"
        />
        <StatCard
          iconClassName="fas fa-box-open"
          label="Products"
          value={counts.products ?? 0}
          hint="Items available in the admin catalog."
          href="/admin/products"
          linkLabel="Manage products →"
        />
      </div>

      <div
        className="rounded-3 px-3 py-2"
        style={{
          backgroundColor: T.summaryStripBg,
          border: T.cardBorder,
        }}
      >
        <span
          style={{
            fontFamily: T.interFamily,
            fontSize: "0.8rem",
            color: T.subtitleColor,
          }}
        >
          Public catalog API (storefront):{" "}
          <code className="small">GET /api/catalog/products</code>
        </span>
      </div>
      </AdminPageShell>
    </div>
  );
}
