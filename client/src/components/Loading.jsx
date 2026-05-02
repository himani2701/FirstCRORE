import "./Loading.css";
export default function Loading() {
  return (
    <div className="loading-screen">
      <div className="loading-icon">🔄</div>
      <p className="loading-title">Building your plan…</p>
      <p className="loading-sub">Analysing FD rates across 15+ banks</p>
      <div className="loading-bar"><div className="loading-bar-fill" /></div>
    </div>
  );
}
