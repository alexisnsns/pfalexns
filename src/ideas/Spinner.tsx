import "./Spinner.css";

type SpinnerProps = {
  /** Announced to screen readers */
  label?: string;
  /** Taller, centered block for full-route loading */
  page?: boolean;
};

export default function Spinner({ label = "Loading", page = false }: SpinnerProps) {
  return (
    <div
      className={page ? "spinner-wrap spinner-wrap--page" : "spinner-wrap"}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="spinner" aria-hidden />
    </div>
  );
}
