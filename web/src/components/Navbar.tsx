import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import '@styles/Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    // Si on n'est pas sur la Vitrine, on ne gère pas les ancres
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    // Configuration de l'observer pour détecter quelle section est au centre de l'écran
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px', // Déclenche quand la section occupe le milieu de l'écran
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // On observe les sections cibles
    const sections = ['enfants', 'parents'];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleHeroScroll = () => {
      if (window.scrollY < 300) setActiveSection('');
    };
    window.addEventListener('scroll', handleHeroScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleHeroScroll);
    };
  }, [location.pathname]);

  // Détermine si un lien doit être "active" (orange)
  const getPillClass = (path: string, sectionId?: string) => {
    if (location.pathname !== path) return 'pill-link';
    
    if (sectionId) {
      return activeSection === sectionId ? 'pill-link active' : 'pill-link';
    }
    
    // Pour "Concept", il est actif seulement si aucune autre section n'est vue
    return activeSection === '' ? 'pill-link active' : 'pill-link';
  };

  return (
    <motion.header 
      className="nav-container-organic"
      initial={{ y: -200 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 40, damping: 15 }}
    >
      <div className="nav-wave-bg">
        <svg viewBox="0 0 1440 320" className="wave-svg wave-orange" preserveAspectRatio="none">
          <path d="M0,64L80,80C160,96,320,128,480,133.3C640,139,800,117,960,101.3C1120,85,1280,75,1360,69.3L1440,64L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
        </svg>
        <svg viewBox="0 0 1440 280" className="wave-svg wave-beige" preserveAspectRatio="none">
          <path d="M0,100L60,95.3C120,100,240,140,360,128.7C480,128,600,96,720,90.7C840,85,960,107,1080,117.3C1200,128,1320,128,1380,128L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"></path>
        </svg>
      </div>

      <nav className="nav-content">
        <div className="nav-left">
          <Link to="/">
            <img src="/milo-logo2.png" alt="Milo" className="nav-logo-v2" />
          </Link>
        </div>
        
        <div className="nav-center">
          <div className="nav-pills">
            <Link to="/" className={getPillClass('/')}>Concept</Link>
            <a href="/#enfants" className={getPillClass('/', 'enfants')}>Pour les Enfants</a>
            <a href="/#parents" className={getPillClass('/', 'parents')}>Pour les Parents</a>
            
            <Link 
              to="/faq" 
              className={`pill-link ${location.pathname === '/faq' ? 'active' : ''}`}
            >
              FAQ
            </Link>
            <Link to="/contact" className="pill-link">Contact</Link>
          </div>
        </div>

        <div className="nav-right">
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button className="btn-login-v2">Connexion</button>
          </Link>

          <Link to="/register" style={{ textDecoration: 'none' }}>
            <motion.button 
              className="btn-signup-v2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Adopter Milo
            </motion.button>
          </Link>
        </div>
      </nav>
    </motion.header>
  );
};

export default Navbar;