import React from "react";
import { useNavigate } from "react-router-dom";

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
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate("/")}>
          SlipperBank
        </h1>
        {username && (
          <div className="space-x-4">
            <button onClick={() => alert("Min profil kommer snart!")} className="hover:underline">Min profil</button>
            <button onClick={handleLogout} className="hover:underline">Logg ut</button>
          </div>
        )}
      </header>
      <main>{children}</main>
    </>
  );
};

export default Layout;
