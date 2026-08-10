import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PageHeader({ 
  title, 
  subtitle, 
  icon: Icon, 
  backPath, 
  onBack,
  color = "#5b4afd", 
  bgColor = "#eef2ff",
  premium = false
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else if (backPath) navigate(backPath);
    else navigate(-1);
  };

  if (premium) {
    return (
      <div style={{
        background: `linear-gradient(135deg, ${color} 0%, #3b2fb6 100%)`,
        borderRadius: "20px", padding: "2rem", color: "white",
        marginBottom: "2rem", boxShadow: "0 10px 25px rgba(91,74,253,0.15)",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: "-20%", right: "-5%",
          width: "200px", height: "200px", background: "rgba(255,255,255,0.05)",
          borderRadius: "50%", transform: "scale(1.5)"
        }} />
        
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button
            onClick={handleBack}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "12px",
              width: "44px", height: "44px", display: "flex",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "white", backdropFilter: "blur(10px)",
              transition: "background 0.2s"
            }}
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              {Icon && <Icon size={20} opacity={0.8} />}
              <span style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.8, fontWeight: 500 }}>
                {subtitle}
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              {title}
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
      <button
        onClick={handleBack}
        style={{
          background: bgColor, border: "none", borderRadius: "10px",
          width: "36px", height: "36px", display: "flex",
          alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: color,
          transition: "background 0.2s"
        }}
      >
        <ArrowLeft size={18} />
      </button>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a2e", margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: "14px", color: "#888", margin: "4px 0 0" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
