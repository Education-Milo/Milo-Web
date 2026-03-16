import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, ExternalLink, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="vitrine-footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none">
          <path d="M0,160L80,154.7C160,149,320,139,480,110.7C640,82,800,40,960,60.3C1120,81,1280,150,1360,170.3L1440,190L1440,300L1360,300C1280,300,1120,300,960,300C800,300,640,300,480,300C320,300,160,300,80,300L0,300Z"></path>
        </svg>
      </div>
      
      <div className="footer-content">
        <div className="footer-main">
          <div className="footer-brand">
            <img src="/milo-logo2.png" alt="Milo Logo" className="footer-logo" />
            <p>L'IA qui transforme les révisions en une aventure épique pour les enfants et une sérénité pour les parents.</p>
            <div className="footer-socials">
            <a 
                href="https://www.instagram.com/milo_educ/" 
                target="_blank" 
                rel="noopener noreferrer"
                >
                <Instagram size={20} />
            </a>
            <a href="https://www.linkedin.com/company/107749290/" target="_blank" rel="noopener noreferrer">
                <Linkedin size={20} />
            </a>
              <a href="https://linktr.ee/milo_education" target="_blank" rel="noopener noreferrer" className="linktree-pill">
                    <ExternalLink size={20} />
              </a>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h4>Exploration</h4>
              <Link to="/">Concept</Link>
              <Link to="/#enfants">Enfants</Link>
              <Link to="/#parents">Parents</Link>
            </div>
            <div className="footer-col">
              <h4>Sécurité</h4>
              <Link to="/confidentialite">Confidentialité</Link>
              <Link to="/charte">Charte IA</Link>
              <Link to="/mentions">Légal</Link>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <Link to="/contact">Contact</Link>
              <Link to="/faq">FAQ</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 - Milo Education</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;