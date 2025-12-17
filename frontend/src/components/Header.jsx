import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "../lib/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="nav-container">
      <div className="nav-content">
        <div className="nav-items">
          <Link to="/" className="nav-logo">
            PlagiarismCheck
          </Link>
          <div className="nav-links">
            <Link to="/checker" className="nav-link">
              Checker
            </Link>
            <Link to="/history" className="nav-link">
              History
            </Link>
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
