export default function Loading() {
  return (
    <div className="ldWrap" aria-busy="true" aria-label="Loading">
      <span className="ldBlock" style={{ height: 36, width: "34%" }} />
      <span className="ldBlock" style={{ height: 16, width: "52%" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 12 }}>
        <span className="ldBlock" style={{ height: 110 }} />
        <span className="ldBlock" style={{ height: 110 }} />
        <span className="ldBlock" style={{ height: 110 }} />
      </div>
      <span className="ldBlock" style={{ height: 260 }} />
    </div>
  );
}
