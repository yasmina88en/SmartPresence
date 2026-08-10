import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Scanner from "./pages/Scanner";
import ChangePassword from "./pages/ChangePassword";
import Profile from "./pages/Profile";

import EnrollFace from "./pages/EnrollFace";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dash" element={<Dashboard />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/enroll-face" element={<EnrollFace />} />
      </Routes>
    </BrowserRouter>
  );
}