import { ChevronDown } from "lucide-react";

export default function SelectField({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder, 
  icon: Icon, 
  disabled = false,
  fullWidth = true
}) {
  const inputStyle = {
    width: fullWidth ? "100%" : "auto", 
    padding: Icon ? "12px 14px 12px 42px" : "12px 36px 12px 14px",
    border: "1.5px solid #e5e7ef", 
    borderRadius: "10px",
    fontSize: "14px", 
    color: "#1a1a2e", 
    background: "#fafbff",
    appearance: "none", 
    outline: "none", 
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "border-color 0.2s"
  };

  return (
    <div style={{ flex: 1 }}>
      {label && (
        <label style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a2e", display: "block", marginBottom: "8px" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon 
            size={18} 
            style={{ 
              position: "absolute", 
              left: "14px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: "#aaa",
              pointerEvents: "none"
            }} 
          />
        )}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={inputStyle}
          className="custom-select"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.id || opt.value} value={opt.id || opt.value}>
              {opt.nom || opt.niveau || opt.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={18} 
          style={{ 
            position: "absolute", 
            right: "12px", 
            top: "50%", 
            transform: "translateY(-50%)", 
            color: "#aaa", 
            pointerEvents: "none" 
          }} 
        />
      </div>
    </div>
  );
}
