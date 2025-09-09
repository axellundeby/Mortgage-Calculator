// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LoginForm from "./components/LoginForm";
import Register from "./components/Register";
import Refinance from "./components/RefinanceForm";
import LoanForm from "./components/LoanForm";
import ProfilePage from "./components/ProfilePage";
import Home from "./components/Home";
import HowItWorks from "./components/HowItWorks";

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        {/* <Route path="/reg" element={<RegisterForm />} /> */}
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/reg" element={<Register />} />
        <Route path="/refinance" element={<Refinance />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/kalkulator" element={<LoanForm />} />
        <Route path="/profil" element={<ProfilePage />} />
      </Routes>
    </Layout>
  );
};

export default App;
