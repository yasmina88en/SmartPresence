export default function EmptyState({ icon: Icon, message, description }) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#ccc" }}>
      {Icon && <Icon size={48} style={{ margin: "0 auto 1rem", color: "#e5e7ef" }} />}
      <p style={{ fontSize: "16px", fontWeight: 500, color: "#888", margin: 0 }}>{message}</p>
      {description && <p style={{ fontSize: "14px", color: "#aaa", marginTop: "8px" }}>{description}</p>}
    </div>
  );
}
