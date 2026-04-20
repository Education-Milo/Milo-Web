import React, { useState } from 'react';
import ScreenLayout from '@components/ui/common/ScreenLayout.component';
import { motion, AnimatePresence } from 'framer-motion';
import { WandSparkles, Shirt, Clock, Star, Crown, BookOpenText, CheckCircle2, ShoppingBag, DoorOpen, Sparkles } from 'lucide-react';
import '@styles/MyMilo.css';
import { useNavigate } from 'react-router-dom';

interface OwnedItem {
  id: number;
  name: string;
  category: 'Chapeau' | 'Vêtement' | 'Mobilier' | 'Classe';
  icon: React.ReactNode;
  rarity: 'Commun' | 'Rare' | 'Épique' | 'Légendaire';
  equipped: boolean;
}

const initialLocker: OwnedItem[] = [
  { id: 1, name: "Casquette Milo Orange", category: 'Chapeau', icon: "🧢", rarity: 'Commun', equipped: true },
  { id: 2, name: "T-Shirt Aventurier", category: 'Vêtement', icon: "👕", rarity: 'Rare', equipped: true },
  { id: 3, name: "Lunettes Pixel", category: 'Chapeau', icon: "🕶️", rarity: 'Épique', equipped: false },
  { id: 4, name: "Horloge Moderne Milo", category: 'Mobilier', icon: <Clock />, rarity: 'Rare', equipped: false },
  { id: 5, name: "Cahier de Révisions Milo", category: 'Classe', icon: <BookOpenText />, rarity: 'Commun', equipped: false },
  { id: 6, name: "Couronne Royale", category: 'Chapeau', icon: "👑", rarity: 'Légendaire', equipped: false },
];

const MyMiloPage: React.FC = () => {
  const navigate = useNavigate();
  const [lockerItems, setLockerItems] = useState<OwnedItem[]>(initialLocker);
  const [activeCategory, setActiveCategory] = useState<'Personnalisation' | 'Classe'>('Personnalisation');

  const toggleEquip = (itemId: number) => {
    setLockerItems(prev => prev.map(item => {
      if (item.id === itemId && item.equipped) { return { ...item, equipped: false }; }
      if (item.id === itemId && !item.equipped) { return { ...item, equipped: true }; }
      const clickedItem = prev.find(i => i.id === itemId);
      if (clickedItem && item.category === clickedItem.category) { return { ...item, equipped: false }; }
      return item;
    }));
  };

  const filteredItems = lockerItems.filter(item => {
    if (activeCategory === 'Personnalisation') { return ['Chapeau', 'Vêtement'].includes(item.category); }
    return ['Mobilier', 'Classe'].includes(item.category);
  });

  return (
    <ScreenLayout>
      <div className="mymilo-container">
        {/* --- EFFETS DE FOND ANIMÉS --- */}
        <div className="milo-bg-glow"></div>
        
        <motion.header className="mymilo-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="header-left">
            <h1 className="page-title"><WandSparkles className="sparkle-icon" /> Mon Milo</h1>
            <p className="page-subtitle">Gère ton style et ton équipement de classe</p>
          </div>
          
          <div className="header-actions">
            <motion.button className="btn-shop-pimped" onClick={() => navigate('/boutique')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <ShoppingBag size={18} /> <span>Boutique</span>
            </motion.button>
            <div className="collection-score-pimped">
              <Crown className="icon-crown-animated" size={22} />
              <span className="score-val">{lockerItems.length}</span>
            </div>
          </div>
        </motion.header>

        <main className="mymilo-content">
          {/* ZONE MILO AVEC EFFET DE LUMIÈRE */}
          <motion.div className="milo-model-card" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="milo-light-ray"></div>
            <motion.img 
                src="/coursMilobg.png" 
                alt="Milo" 
                className="milo-main-img" 
                animate={{ y: [0, -15, 0] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="milo-shadow"></div>
          </motion.div>

          {/* SECTION CASIER "VESTIAIRE" */}
          <motion.div className="vestiaire-glass-box" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="vestiaire-header">
                <h2 className="section-title"><DoorOpen size={24} /> Casier d'Aventure</h2>
                <div className="locker-filters-pimped">
                    <button className={`filter-chip ${activeCategory === 'Personnalisation' ? 'active' : ''}`} onClick={() => setActiveCategory('Personnalisation')}>
                        <Shirt size={16} /> Look
                    </button>
                    <button className={`filter-chip ${activeCategory === 'Classe' ? 'active' : ''}`} onClick={() => setActiveCategory('Classe')}>
                        <BookOpenText size={16} /> Classe
                    </button>
                </div>
            </div>

            <div className="locker-scroll-area">
                <AnimatePresence mode="popLayout">
                    <motion.div className="locker-grid-pimped" layout>
                    {filteredItems.map((item) => (
                        <motion.div 
                            key={item.id} 
                            className={`item-card-v2 rarity-${item.rarity.toLowerCase()}`}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -8, rotateZ: 1 }}
                        >
                            {item.rarity === 'Légendaire' && <Sparkles className="legendary-sparkle" size={16} />}
                            <div className="item-preview-circle">{item.icon}</div>
                            <div className="item-info-v2">
                                <h3>{item.name}</h3>
                                <div className={`rarity-tag ${item.rarity.toLowerCase()}`}>{item.rarity}</div>
                            </div>
                            <button className={`btn-equip-pimped ${item.equipped ? 'active' : ''}`} onClick={() => toggleEquip(item.id)}>
                                {item.equipped ? <CheckCircle2 size={18} /> : "Utiliser"}
                            </button>
                        </motion.div>
                    ))}
                    </motion.div>
                </AnimatePresence>
            </div>
          </motion.div>
        </main>
      </div>
    </ScreenLayout>
  );
};

export default MyMiloPage;