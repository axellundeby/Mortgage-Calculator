// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Refinance from "./components/RefinanceForm";

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/refinance" element={<Refinance />} />
        <Route path="/login" element={<Refinance />} />
      </Routes>
    </Layout>
  );
};

export default App;
