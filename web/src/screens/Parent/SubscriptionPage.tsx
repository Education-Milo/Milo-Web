import React from 'react';
import '@styles/HomePage.css';
import Sidebar from '@components/Sidebar';
import TopBar from '@components/TopBar';
import { useUserStore } from '@store/user/user.store';
import { useAuthStore } from '@store/auth/auth.store';

const SubscriptionPage: React.FC = () => {
  const user = useUserStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  // Données fictives pour la démo - À relier à ton backend plus tard
  const currentPlan = {
    name: 'Family Pack',
    type: 'Mensuel',
    price: '34,90€',
    nextBilling: '15 Mars 2026',
    card: '**** **** **** 4242',
    status: 'Actif',
    includes: ['1 compte parent', 'Jusqu\'à 4 comptes enfant']
  };

  return (
    <>
      <Sidebar
        onLogout={logout}
        userProfile={{
          email: user?.email || '',
          first_name: user?.first_name || user?.prenom || '',
          last_name: user?.last_name || user?.nom || '',
          role: 'Parent',
        }}
      />
      
      <main className="main-container">
        <TopBar searchPlaceholder="Rechercher une facture, un forfait..." energyPoints={0} streakDays={0} />

        <div className="dashboard" style={{ gridTemplateColumns: '1fr' }}>
          
          {/* En-tête de la page */}
          <section className="welcome-section" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <div className="welcome-content">
              <h1 className="welcome-title">Gestion de l'abonnement</h1>
              <p className="welcome-subtitle">
                Gérez vos factures, votre méthode de paiement et votre forfait Milo.
              </p>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            
            {/* Détails du forfait actuel */}
            <section className="section-card">
              <div className="section-header">
                <h2 className="section-title">📦 Forfait Actuel</h2>
                <div className="progress-indicator" style={{ background: 'rgba(72, 187, 120, 0.1)', color: '#48bb78' }}>
                  {currentPlan.status}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h3 style={{ fontSize: '1.8rem', color: '#2d3748', marginBottom: '0.5rem' }}>
                    {currentPlan.name} <span style={{ fontSize: '1rem', color: '#718096', fontWeight: 'normal' }}>({currentPlan.type})</span>
                  </h3>
                  <p style={{ color: '#718096', fontSize: '1.1rem' }}>{currentPlan.price} / mois</p>
                </div>
                <button className="quick-action-btn" style={{ background: '#ff6b35', color: 'white', border: 'none' }}>
                  Modifier le forfait
                </button>
              </div>

              <div>
                <h4 style={{ color: '#4a5568', marginBottom: '1rem' }}>Ce forfait comprend :</h4>
                <ul style={{ color: '#718096', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                  {currentPlan.includes.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                  <li>Accès complet aux modules interactifs de Milo</li>
                  <li>Suivi et statistiques illimités</li>
                </ul>
              </div>
            </section>

            {/* Paiement et Facturation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <section className="section-card">
                <div className="section-header">
                  <h2 className="section-title">💳 Paiement</h2>
                </div>
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>💳</div>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#2d3748' }}>Visa se terminant par 4242</p>
                    <p style={{ color: '#718096', fontSize: '0.9rem' }}>Expiration : 12/28</p>
                  </div>
                </div>
                <button style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: 'transparent', color: '#ff6b35', border: '2px solid rgba(255, 107, 53, 0.2)', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Mettre à jour la carte
                </button>
              </section>

              <section className="section-card">
                <div className="section-header">
                  <h2 className="section-title">🧾 Facturation</h2>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ color: '#718096', fontSize: '0.9rem' }}>Prochain prélèvement :</p>
                  <p style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '1.2rem' }}>{currentPlan.nextBilling}</p>
                </div>
                <button style={{ width: '100%', padding: '0.75rem', background: 'rgba(226, 232, 240, 0.5)', color: '#4a5568', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Voir l'historique des factures
                </button>
              </section>

            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default SubscriptionPage;