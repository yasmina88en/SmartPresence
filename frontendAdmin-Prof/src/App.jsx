import { BrowserRouter, Routes, Route } from "react-router-dom";

import RoleChoice from "./pages/RoleChoice";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";

import AdminLayout from "./layout/AdminLayout";
import ProfLayout from "./layout/ProfLayout";

import Filieres from "./pages/admin/Filieres";
import Niveaux from "./pages/admin/Niveaux";
import NiveauDetails from "./pages/admin/NiveauDetails";
import EmploiTemps from "./pages/admin/EmploiTemps";
import Dashboard from "./pages/admin/Dashboard";
import Etudiants from "./pages/admin/Etudiants";
import Profs from "./pages/admin/Profs";
import EtudiantDetails from "./pages/admin/EtudiantDetails";

import ProfDashboard from "./pages/prof/ProfDashboard";
import ProfQRView from "./pages/prof/ProfQRView";
import SubjectAttendance from "./pages/prof/SubjectAttendance";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<RoleChoice />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* PROFESSOR */}
        <Route path="/prof" element={<ProfLayout />}>
          <Route index element={<ProfDashboard />} />
          <Route path="dashboard" element={<ProfDashboard />} />
          <Route path="sessions" element={<ProfDashboard />} />
          <Route path="seance/:seanceId" element={<ProfQRView />} />
          <Route path="stats/:matiereId/:niveauId" element={<SubjectAttendance />} />
        </Route>

        {/* ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>

          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="filieres" element={<Filieres />} />
          <Route path="filieres/:id/niveaux" element={<Niveaux />} />

          {/* Fallback au cas où ils cliquent sur "Niveaux" direct depuis le menu */}
          <Route path="niveaux" element={<Niveaux />} />

          <Route path="emplois" element={<EmploiTemps />} />
          <Route path="etudiants" element={<Etudiants />} />
          {<Route path="professeurs" element={<Profs />} />}

          {/*  Niveau Details avec sous-routes */}
          <Route path="filieres/:id/niveaux/:niveauId" element={<NiveauDetails />}>
            <Route path="emploi" element={<EmploiTemps />} />
            <Route path="etudiants" element={<Etudiants />} />
          </Route>
          <Route path="etudiants/:etudiantId/detail" element={<EtudiantDetails />} />
      
        </Route>
       </Routes>
    </BrowserRouter>
  );
}

export default App;