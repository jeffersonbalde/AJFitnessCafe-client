/** Must match server `config/storefront.php` default unless you override both. */
export const DELIVERY_FEE_FLAT = Number(
  import.meta.env.VITE_STOREFRONT_DELIVERY_FEE ?? 50,
);
