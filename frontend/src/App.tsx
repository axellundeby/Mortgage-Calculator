import React from "react";
import { Routes, Route } from "react-router-dom";

import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import LoanForm from "./components/LoanForm";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RegisterForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/loan" element={<LoanForm />} />
    </Routes>
  );
};

export default App;
