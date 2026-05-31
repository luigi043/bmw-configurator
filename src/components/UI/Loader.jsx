export default function Loader() {
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="loader__ring" />
      <span className="loader__label">Preparing studio…</span>
    </div>
  );
}
