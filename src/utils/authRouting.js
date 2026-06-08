/**
 * Staff sign-in route for the admin SPA.
 * API remains `POST /api/auth/login`.
 */
export const ADMIN_LOGIN_PATH = "/admin/login";

/** Storefront customer sign-in (same API as admin; role checked client-side). */
export const ACCOUNT_LOGIN_PATH = "/account/login";

export const ACCOUNT_REGISTER_PATH = "/account/register";

/** Email OTP verification after storefront registration. */
export const ACCOUNT_VERIFY_EMAIL_PATH = "/account/verify-email";

/** Last non-auth storefront path (for modal fallback). */
export const LAST_STOREFRONT_LOCATION_KEY = "ajfitness:last_storefront_location";

/**
 * Routes that require a logged-in customer. Closing the login modal must not
 * navigate here while logged out, or {@link CustomerProtectedRoute} will send
 * the user straight back to `/account/login` in a loop.
 */
export function isProtectedStorefrontPath(pathname) {
  if (!pathname || typeof pathname !== "string") return false;
  return pathname === "/checkout" || pathname.startsWith("/account/orders");
}

/**
 * Background to show under the auth modal when redirecting from a protected page.
 * Must not be a protected URL or closing the modal repeats the login redirect.
 *
 * @param {import('react-router-dom').Location} fromLocation
 * @returns {{ pathname: string, search: string, hash: string }}
 */
export function backgroundLocationForLoginModal(fromLocation) {
  const pathname = fromLocation?.pathname ?? "";
  if (isProtectedStorefrontPath(pathname)) {
    return { pathname: "/", search: "", hash: "" };
  }
  return {
    pathname: fromLocation.pathname,
    search: fromLocation.search ?? "",
    hash: fromLocation.hash ?? "",
  };
}

/**
 * Close auth overlay modals by navigating to the underlying page with replace.
 * Avoids navigate(-1), which can reopen another modal after login ↔ register.
 *
 * @param {import('react-router-dom').NavigateFunction} navigate
 * @param {import('react-router-dom').Location} location
 */
export function navigateCloseAuthModal(navigate, location) {
  const bg = location.state?.backgroundLocation;
  if (bg && typeof bg === "object" && typeof bg.pathname === "string") {
    const safe = isProtectedStorefrontPath(bg.pathname)
      ? { pathname: "/", search: "", hash: "" }
      : bg;
    navigate(
      {
        pathname: safe.pathname,
        search: safe.search ?? "",
        hash: safe.hash ?? "",
      },
      { replace: true, state: {} },
    );
    return;
  }
  const raw =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(LAST_STOREFRONT_LOCATION_KEY)
      : null;
  if (raw) {
    let pathname = "/";
    try {
      pathname = new URL(raw, window.location.origin).pathname;
    } catch {
      pathname = "/";
    }
    if (isProtectedStorefrontPath(pathname)) {
      navigate("/", { replace: true, state: {} });
      return;
    }
    navigate(raw, { replace: true, state: {} });
    return;
  }
  navigate("/", { replace: true, state: {} });
}

/**
 * @param {unknown} user
 * @returns {boolean}
 */
export function isAdminUser(user) {
  return Boolean(user && typeof user === "object" && user.is_admin === true);
}

export function getUserPermissions(user) {
  if (!user || typeof user !== "object" || !Array.isArray(user.permissions)) return [];
  return user.permissions.filter((p) => typeof p === "string");
}

export function hasPermission(user, permission) {
  return getUserPermissions(user).includes(permission);
}

/**
 * Post-login landing path: admin dashboard only for admin users.
 * @param {unknown} user
 */
export function getHomePathForUser(user) {
  return isAdminUser(user) ? "/admin" : "/";
}
