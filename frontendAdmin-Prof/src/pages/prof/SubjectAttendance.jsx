import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { 
  Users, Calendar, CheckCircle2, XCircle, 
  Loader2, FileSpreadsheet, Download, Filter
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { useMatrix } from "../../hooks/useMatrix";

export default function SubjectAttendance() {
  const { matiereId, niveauId } = useParams();
  const {
    data, loading, error, selectedMonth, setSelectedMonth,
    filteredSessions, filteredStudents, availableMonths,
    exportToExcel
  } = useMatrix(matiereId, niveauId);

  const brandColor = "#5b4afd";

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <Loader2 className="animate-spin" size={48} color={brandColor} />
    </div>
  );

  if (error) return (
    <div style={{ padding: "2rem", background: "#fef2f2", color: "#dc2626", borderRadius: "12px", textAlign: "center" }}>
      {error}
    </div>
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <PageHeader
        premium
        title="Récapitulatif des Présences"
        subtitle={`${data.matiere_name} - ${data.niveau_name}`}
        icon={FileSpreadsheet}
        backPath="/prof/dashboard"
        color={brandColor}
        bgColor="#eef2ff"
      />

      {/* Toolbar */}
      <div style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ 
            display: "flex", alignItems: "center", gap: "8px", 
            background: "white", padding: "6px 12px", borderRadius: "12px",
            border: "1px solid #e5e7eb"
          }}>
            <Filter size={16} color="#6b7280" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ border: "none", outline: "none", fontSize: "13px", fontWeight: 600, color: "#374151", cursor: "pointer" }}
            >
              <option value="">Tous les mois</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {new Date(m).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
          <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>
            {filteredSessions.length} séance(s) affichée(s)
          </span>
        </div>

        <button 
          onClick={exportToExcel}
          style={{ 
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 20px", background: brandColor, color: "white",
            border: "none", borderRadius: "12px", fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s", fontSize: "13px",
            boxShadow: `0 4px 12px ${brandColor}44`
          }}
          onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          <Download size={18} /> Exporter Excel
        </button>
      </div>

      <div style={{ 
        background: "white", borderRadius: "24px", padding: "1.5rem",
        boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #efefef",
        overflow: "hidden"
      }}>
        
        {data.sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#9ca3af" }}>
             <Calendar size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
             <p>Aucune séance enregistrée pour cette matière.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", position: "relative" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ 
                    position: "sticky", left: 0, zIndex: 10,
                    background: "#f9fafb", padding: "16px", textAlign: "left",
                    color: "#4b5563", fontWeight: 700, fontSize: "12px",
                    textTransform: "uppercase", borderBottom: "2px solid #e5e7eb",
                    minWidth: "220px", boxShadow: "5px 0 10px rgba(0,0,0,0.02)"
                  }}>
                    Étudiants ({filteredStudents.length})
                  </th>
                  {filteredSessions.map((s) => (
                    <th key={s.id} style={{ 
                      padding: "16px", textAlign: "center", minWidth: "120px",
                      background: "#f9fafb", borderBottom: "2px solid #e5e7eb"
                    }}>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: brandColor, marginBottom: "4px" }}>
                        {new Date(s.date).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500 }}>
                        {s.heure}
                      </div>
                    </th>
                  ))}
                  <th style={{ 
                    padding: "16px", textAlign: "center", background: "#f9fafb", 
                    borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontWeight: 700, fontSize: "12px" 
                  }}>
                    Taux
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => {
                  const presentCount = student.presences.filter(p => p.statut === "PRESENT").length;
                  const rate = filteredSessions.length > 0 ? Math.round((presentCount / filteredSessions.length) * 100) : 0;

                  return (
                    <tr key={student.id} style={{ 
                      background: idx % 2 === 0 ? "white" : "#fcfcfd",
                      transition: "background 0.2s"
                    }} onMouseOver={e => e.currentTarget.style.background = "#f5f3ff"}>
                      <td style={{ 
                        position: "sticky", left: 0, zIndex: 5,
                        background: "inherit", padding: "14px 16px", 
                        fontWeight: 600, color: "#1a1a2e", borderBottom: "1px solid #f3f4f6",
                        boxShadow: "2px 0 5px rgba(0,0,0,0.02)"
                      }}>
                        {student.nom} {student.prenom}
                      </td>
                      {student.presences.map((p, pIdx) => (
                        <td key={`${student.id}-${pIdx}`} style={{ 
                          padding: "14px", textAlign: "center", borderBottom: "1px solid #f3f4f6" 
                        }}>
                          {p.statut === "PRESENT" ? (
                            <CheckCircle2 color="#16a34a" size={18} style={{ margin: "0 auto" }} />
                          ) : (
                            <XCircle color="#ef4444" size={18} style={{ opacity: 0.2, margin: "0 auto" }} />
                          )}
                        </td>
                      ))}
                      <td style={{ 
                        padding: "14px", textAlign: "center", borderBottom: "1px solid #f3f4f6", 
                        fontWeight: 700, color: rate > 70 ? "#16a34a" : rate > 40 ? "#f59e0b" : "#dc2626" 
                      }}>
                        {rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        table tbody tr:hover td {
           background: #f5f3ff !important;
        }
      `}</style>
    </div>
  );
}
