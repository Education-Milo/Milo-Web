import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav style={{ padding: "1rem", backgroundColor: "#eee", display: "flex", justifyContent: "space-around" }}>
      <Link to="/">Accueil</Link>
      <Link to="/login">Connexion</Link>
      <Link to="/register">Inscription</Link>
      <Link to="/upload">Importer</Link>
    </nav>
  );
};

export default Navbar;