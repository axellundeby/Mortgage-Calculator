import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("userLoan");
    localStorage.removeItem("loanAlreadyFetched");
    navigate("/");
  };

  return (
    <>
      <header className="bg-blue-600 text-white px-4 h-14 flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}> 
          <img src={require("../flytta.png")} alt="Flytta" className="h-12 w-auto object-contain" />
        </div>
        {username ? (
          <div className="space-x-4">
            <button onClick={() => navigate("/refinance")} className="hover:underline">
              Refinansier
            </button>
            <button onClick={() => navigate("/profil")} className="hover:underline">
              Min profil
            </button>
            <button onClick={handleLogout} className="hover:underline">
              Logg ut
            </button>
          </div>
        ) : (
          <div className="space-x-4">
            <Button variant="ghost" onClick={() => navigate("/login")}> 
              Logg inn
            </Button>
            <Button variant="default" onClick={() => navigate("/reg")}>
              Registrer deg
            </Button>
          </div>
        )}
      </header>
      <main>{children}</main>
    </>
  );
};

export default Layout;
