import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Footer from '@components/Footer';
import { 
  ArrowRight, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
} from 'lucide-react';
import '../styles/Vitrine.css';

const kidsFeatures = [
  {
    id: 1,
    title: "Pour les <span>Enfants</span>",
    desc: "Explore des mondes fantastiques tout en révisant tes leçons. Milo transforme chaque exercice en une quête épique !",
    items: ["✨ Avatars personnalisables", "🎮 Mini-jeux éducatifs", "🏆 Trophées et récompenses"],
    img: "/screen1.png"
  },
  {
    id: 2,
    title: "Apprendre en <span>Jouant</span>",
    desc: "Débloque des nouveaux niveaux en réussissant tes quiz. Plus tu apprends, plus ton monde Milo s'agrandit !",
    items: ["🗺️ Cartes interactives", "⚔️ Défis entre amis", "🛡️ Équipements rares"],
    img: "/screen2.png"
  },
  {
    id: 3,
    title: "Suivi des <span>Progrès</span>",
    desc: "Visualise tes victoires et gagne des badges de mérite. Chaque effort est récompensé par des cristaux magiques !",
    items: ["📈 Graphiques rigolos", "💎 Cristaux d'XP", "📜 Parchemins de réussite"],
    img: "/screen3.png"
  }
];

const VitrinePage: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextFeature = () => {
    setCurrentIndex((prev) => (prev + 1) % kidsFeatures.length);
  };

  const prevFeature = () => {
    setCurrentIndex((prev) => (prev - 1 + kidsFeatures.length) % kidsFeatures.length);
  };

  return (
    <div className="vitrine-root">
      {/* FOND DYNAMIQUE */}
      <div className="mesh-gradient">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* NAVBAR ORGANIQUE TRES LARGE */}
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
            <img src="/milo-logo2.png" alt="Milo" className="nav-logo-v2" />
          </div>
          <div className="nav-center">
            <div className="nav-pills">
              <a href="#" className="pill-link active">Concept</a>
              <a href="#enfants" className="pill-link">Pour les Enfants</a>
              <a href="#parents" className="pill-link">Pour les Parents</a>
              
              <Link to="/faq" className="pill-link">FAQ</Link>
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

      <div className="hero-spacer"></div>

      {/* SECTION HERO */}
      <main className="hero-wrapper">
        <div className="hero-text-side">

          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Apprendre est un <span> jeu d'enfant.</span>
          </motion.h1>

          <motion.p 
            className="hero-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
          >
            Les révisions n'ont jamais été aussi amusantes qu'avec Milo. Chaque session de révision devient une aventure ludique et interactive.
          </motion.p>

          <motion.div className="hero-actions">
            <button className="btn-main">
              Rejoindre l'aventure <ArrowRight size={22} />
            </button>
            <button className="btn-ghost">Découvrir les fonctionnalités</button>
          </motion.div>
        </div>

        <div className="mascotte-container">
          <img src="/coursMilobg.png" alt="Milo" className="mascotte-img" />
        </div>

        <motion.div 
          className="scroll-indicator"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={32} color="#F4922A" />
        </motion.div>
      </main>

      {/* SECTION POUR LES ENFANTS DYNAMIQUE */}
      <section id="enfants" className="section-kids-v5">
        <div className="kids-container-v5">
          {/* LA CONSOLE DE JEU (Image Side) */}
          <motion.div 
            className="kids-visual-frame"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="game-console-border">
              <div className="screen-inner">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentIndex}
                    src={kidsFeatures[currentIndex].img} 
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.2, rotate: 5 }}
                    transition={{ type: "spring", damping: 12 }}
                    alt="Milo Game App" 
                  />
                </AnimatePresence>
              </div>
            </div>
            <div className="console-buttons">
              <button onClick={prevFeature} className="joy-btn"><ChevronLeft size={30}/></button>
              <div className="joy-stick"></div>
              <button onClick={nextFeature} className="joy-btn"><ChevronRight size={30}/></button>
            </div>
          </motion.div>

          {/* LE TEXTE D'AVENTURE (Content Side) */}
          <div className="kids-info-side">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
              >
                <div className="adventure-badge">MISSION ACTIVE</div>
                <h2 
                  className="kids-h2" 
                  dangerouslySetInnerHTML={{ __html: kidsFeatures[currentIndex].title }} 
                />
                <p className="kids-p-desc">
                  {kidsFeatures[currentIndex].desc}
                </p>
                <div className="kids-tag-cloud">
                  {kidsFeatures[currentIndex].items.map((item, idx) => (
                    <motion.span 
                      key={idx}
                      className="adventure-tag"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * idx }}
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

            {/* SECTION POUR LES PARENTS */}
        <section id="parents" className="section-parents">
        <div className="parents-header">
            <motion.h2 
            className="section-title center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            >
            L'allié des <span>Parents</span>
            </motion.h2>
            <p className="section-desc center">Suivez, accompagnez et sécurisez la progression de votre enfant en toute sérénité.</p>
        </div>

        {/* PARTIE 1 : FONCTIONNALITÉS PARENTS */}
        <div className="parents-grid">
            {[
                { title: "Tableau de Bord", desc: "Suivez les points forts et les notions à revoir en un clin d'œil.", icon: "📈", color: "#FFEDD5" },
                { title: "Temps d'écran", desc: "Définissez des limites pour un apprentissage sain et équilibré.", icon: "⌛", color: "#E0F2FE" },
                { title: "Rapports Hebdo", desc: "Recevez les exploits de votre enfant directement par email.", icon: "📩", color: "#F0FDF4" }
            ].map((feat, idx) => (
                <motion.div 
                key={idx}
                className="parent-card-dynamic"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -15, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                >
                <div className="card-bg-blob" style={{ backgroundColor: feat.color }}></div>
                <div className="card-icon-v4">{feat.icon}</div>
                <div className="card-content-v4">
                    <h3>{feat.title}</h3>
                    <p>{feat.desc}</p>
                </div>
                <div className="card-shine"></div>
                </motion.div>
            ))}
        </div>

        {/* PARTIE 2 : FAQ IA SÉCURISÉE - VERSION PIMPÉE */}
        <div className="faq-section-v4">
            <div className="faq-header-v4">
                <div className="faq-badge-mini">CONFIANCE</div>
                <h3 className="faq-title-v4">Questions & <span>Réponses</span></h3>
                <p>Tout ce que vous devez savoir pour accompagner votre enfant sereinement.</p>
            </div>

            <div className="faq-grid-v4">
                {[
                    { 
                      q: "Est-ce que Milo fait les devoirs à sa place ?", 
                      a: "Non, Milo est un tuteur qui guide par le questionnement. Il ne donnera jamais la réponse directe, mais aidera l'enfant à cheminer vers la solution.",
                      icon: "🎓"
                    },
                    { 
                      q: "Le contenu est-il sécurisé ?", 
                      a: "Absolument. Notre IA est bridée pour un usage strictement scolaire. Aucun échange entre utilisateurs n'est possible sur la plateforme.",
                      icon: "🛡️"
                    },
                    { 
                      q: "Comment sont protégées les données ?", 
                      a: "Conformité RGPD totale. Nous ne vendons aucune donnée et l'anonymat de l'enfant est notre priorité absolue.",
                      icon: "🔒"
                    },
                    { 
                      q: "Pourquoi Milo et pas une IA classique ?", 
                      a: "Milo est conçu pour la pédagogie enfantine : ton adapté, analyse des faiblesses et ludification des leçons pour un engagement maximal.",
                      icon: "🚀"
                    }
                ].map((item, idx) => {
                    const [isOpen, setIsOpen] = React.useState(false);
                    return (
                        <motion.div 
                            key={idx} 
                            className={`faq-card-v4 ${isOpen ? 'active' : ''}`}
                            onClick={() => setIsOpen(!isOpen)}
                            layout
                        >
                            <div className="faq-card-top">
                                <div className="faq-icon-circle">{item.icon}</div>
                                <h4>{item.q}</h4>
                                <motion.div 
                                    className="faq-chevron"
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                >
                                    <ChevronDown size={20} />
                                </motion.div>
                            </div>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div 
                                        className="faq-card-body"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                    >
                                        <p>{item.a}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            <div className="faq-more-container">
                <Link to="/faq" style={{ textDecoration: 'none' }}>
                    <motion.button 
                        className="btn-faq-explorer-v4"
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span>Retrouvez toutes vos questions dans notre section FAQ</span>
                        <ArrowRight size={20} />
                    </motion.button>
                </Link>
            </div>
        </div>

        {/* PARTIE 3 : ABONNEMENTS */}
        <div className="pricing-section">
            <div className="pricing-grid">
                {/* PACK ESSENTIEL */}
                <motion.div className="price-card basic-pimped" whileHover={{ y: -20 }}>
                <div className="badge-price-v3">Essentiel</div>
                <div className="price-v3">19€<span>/mois</span></div>
                <ul className="price-features-v3">
                    <li>✨ Accès à tous les cours</li>
                    <li>🎯 Quiz / Flashcards illimités</li>
                    <li>🧠 Discussions avec Milo en illimité</li>
                    <li>⚔️ Accès aux Duels</li>
                    <li>👤 1 profil enfant et parent</li>
                </ul>
                <button className="btn-price-v3 basic btn-glint">
                    <span>C'est parti !</span>
                </button>
                </motion.div>

                {/* PACK FAMILLE */}
                <motion.div className="price-card family-pimped featured" whileHover={{ y: -20 }}>
                <div className="parent-choice-tag">🏆 CHOIX DES PARENTS</div>
                <div className="badge-price-v3 blue">Famille</div>
                <div className="price-v3 blue">35€<span>/mois</span></div>
                <ul className="price-features-v3">
                    <li>🌈 Tout le plan Essentiel</li>
                    <li>👨‍👩‍👧‍👦 Jusqu'à 4 enfants</li>
                    <li>📊 Dashboard Parent avancé</li>
                    <li>👔 Cosmétiques exclusives pour Milo</li>
                </ul>
                <button className="btn-price-v3 family btn-glint">
                    <span>Adopter Milo pour toute la famille !</span>
                </button>
                </motion.div>
            </div>
        </div>
        </section>
        <Footer />     
    </div>
  );
};

export default VitrinePage;