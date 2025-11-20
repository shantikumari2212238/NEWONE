import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminDashboard from "./assets/pages/AdminDashboard";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Default route - Dashboard */}
        <Route path="/" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
