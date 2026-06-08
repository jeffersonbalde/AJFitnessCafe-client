import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";

export default function CartPage() {
  const { lines, subtotal, setQuantity, removeLine } = useCart();

  if (lines.length === 0) {
    return (
      <div className="text-center py-5">
        <h1 className="h4 mb-3" style={{ color: "var(--primary-dark)" }}>
          Your cart is empty
        </h1>
        <Link to="/menu" className="btn btn-primary">
          Browse menu
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="h3 mb-4" style={{ color: "var(--primary-dark)" }}>
        Cart
      </h1>
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Item</th>
                <th style={{ width: 110 }}>Price</th>
                <th style={{ width: 100 }}>Qty</th>
                <th className="text-end" style={{ width: 100 }}>
                  Line
                </th>
                <th style={{ width: 56 }} />
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.variantId}>
                  <td>
                    <div className="fw-semibold">{l.productName}</div>
                    <div className="small text-muted">{l.variantLabel}</div>
                  </td>
                  <td>₱{l.unitPrice.toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      className="form-control form-control-sm"
                      value={l.quantity}
                      onChange={(e) =>
                        setQuantity(l.variantId, Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="text-end fw-semibold">
                    ₱{(l.unitPrice * l.quantity).toFixed(2)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-danger py-0"
                      onClick={() => removeLine(l.variantId)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-body border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="fw-semibold">
            Subtotal <span className="text-brand">₱{subtotal.toFixed(2)}</span>
          </span>
          <Link to="/checkout" className="btn btn-primary">
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
