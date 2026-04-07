// import React, { useState } from 'react';
// import { ArrowLeft, BookOpen, PenTool, BarChart3, Calendar, Camera, FolderOpen, Trash2, Upload as UploadIcon } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import '../styles/CommonForm.css';
// import miloLogo from '/milo-logo.png'; // Adjust the path according to your project structure

// const Upload: React.FC = () => {
//   const [step, setStep] = useState(1); // 1: type selection, 2: method selection, 3: preview
//   const [selectedType, setSelectedType] = useState('');
//   const [selectedFile, setSelectedFile] = useState<any>(null);
//   const navigate = useNavigate();

//   const documentTypes = [
//     {
//       id: 'cours',
//       title: 'Cours',
//       description: 'Scanner un cours ou des notes',
//       icon: BookOpen,
//       color: 'bg-pink-100 text-pink-600'
//     },
//     {
//       id: 'exercice',
//       title: 'Exercice',
//       description: 'Scanner un exercice ou un devoir',
//       icon: PenTool,
//       color: 'bg-orange-100 text-orange-600'
//     },
//     {
//       id: 'bulletin',
//       title: 'Bulletin',
//       description: 'Scanner un bulletin de notes',
//       icon: BarChart3,
//       color: 'bg-green-100 text-green-600'
//     },
//     {
//       id: 'planning',
//       title: 'Planning',
//       description: 'Scanner un emploi du temps',
//       icon: Calendar,
//       color: 'bg-red-100 text-red-600'
//     }
//   ];

//   const handleTypeSelect = (type: string) => {
//     setSelectedType(type);
//     setStep(2);
//   };

//   const handleFileSelect = (method: string) => {
//     // Simulate file selection
//     setSelectedFile({
//       name: 'IMG_20250531_183230_239.jpg',
//       type: 'image/jpeg',
//       size: '0.02 MB'
//     });
//     setStep(3);
//   };

//   const handleSubmit = () => {
//     console.log('Document uploaded:', { type: selectedType, file: selectedFile });
//     navigate('/home');
//   };

//   const handleBackToHome = () => {
//     navigate('/home');
//   };

//   const getTypeTitle = () => {
//     const type = documentTypes.find(t => t.id === selectedType);
//     return type ? type.title : '';
//   };

//   const getIconColor = (colorClass: string) => {
//     const colorMap: { [key: string]: string } = {
//       'bg-pink-100 text-pink-600': '#ec4899',
//       'bg-orange-100 text-orange-600': '#ea580c',
//       'bg-green-100 text-green-600': '#16a34a',
//       'bg-red-100 text-red-600': '#dc2626'
//     };
//     return colorMap[colorClass] || '#6b7280';
//   };

//   const getBgColor = (colorClass: string) => {
//     const colorMap: { [key: string]: string } = {
//       'bg-pink-100 text-pink-600': '#fce7f3',
//       'bg-orange-100 text-orange-600': '#fed7aa',
//       'bg-green-100 text-green-600': '#dcfce7',
//       'bg-red-100 text-red-600': '#fecaca'
//     };
//     return colorMap[colorClass] || '#f3f4f6';
//   };

//   return (
//     <div className="form-page-wrapper">
//       <div className="decorative-circle-1"></div>
//       <div className="decorative-circle-2"></div>
      
//       <div className="form-page-container">
//         <div className="form-content">
//           {/* Step 1: Document Type Selection */}
//           {step === 1 && (
//             <>
//               {/* Header with back button */}
//               <div style={{ 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 marginBottom: '2rem' 
//               }}>
//                 <button 
//                   onClick={handleBackToHome}
//                   style={{ 
//                     background: 'none', 
//                     border: 'none', 
//                     cursor: 'pointer', 
//                     marginRight: '1rem',
//                     padding: '0.5rem',
//                     borderRadius: '0.5rem',
//                     transition: 'background-color 0.2s'
//                   }}
//                   onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
//                   onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
//                 >
//                   <ArrowLeft size={24} style={{ color: '#374151' }} />
//                 </button>
//                 <h1 style={{ 
//                   fontSize: '1.5rem', 
//                   fontWeight: '600', 
//                   color: '#1f2937', 
//                   margin: 0 
//                 }}>
//                   Scanner un document
//                 </h1>
//               </div>

//               {/* Logo */}
//               <div className="logo-container">
//                 <img 
//                   src={miloLogo} 
//                   alt="Milo Logo" 
//                   className="logo-milo"
//                 />
//               </div>
              
//               {/* Form Header */}
//               <div className="form-header">
//                 <h2 className="form-title">Choisir le type de document</h2>
//                 <p className="form-subtitle">
//                   Sélectionnez le type de document que vous souhaitez scanner
//                 </p>
//               </div>

//               <div style={{ 
//                 display: 'grid', 
//                 gridTemplateColumns: 'repeat(2, 1fr)', 
//                 gap: '1rem' 
//               }}>
//                 {documentTypes.map((type) => {
//                   const IconComponent = type.icon;
//                   return (
//                     <button
//                       key={type.id}
//                       onClick={() => handleTypeSelect(type.id)}
//                       style={{
//                         backgroundColor: 'white',
//                         borderRadius: '1rem',
//                         padding: '1.5rem',
//                         border: '2px solid #e5e7eb',
//                         cursor: 'pointer',
//                         transition: 'all 0.2s ease-in-out',
//                         textAlign: 'center'
//                       }}
//                       onMouseEnter={(e) => {
//                         e.target.style.borderColor = '#fed7aa';
//                         e.target.style.transform = 'translateY(-2px)';
//                         e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
//                       }}
//                       onMouseLeave={(e) => {
//                         e.target.style.borderColor = '#e5e7eb';
//                         e.target.style.transform = 'translateY(0)';
//                         e.target.style.boxShadow = 'none';
//                       }}
//                     >
//                       <div style={{
//                         width: '4rem',
//                         height: '4rem',
//                         backgroundColor: getBgColor(type.color),
//                         borderRadius: '1rem',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         margin: '0 auto 1rem auto'
//                       }}>
//                         <IconComponent size={32} color={getIconColor(type.color)} />
//                       </div>
//                       <h3 style={{ 
//                         fontWeight: '600', 
//                         color: '#1f2937', 
//                         marginBottom: '0.5rem',
//                         fontSize: '1rem'
//                       }}>
//                         {type.title}
//                       </h3>
//                       <p style={{ 
//                         fontSize: '0.875rem', 
//                         color: '#6b7280', 
//                         lineHeight: '1.4',
//                         margin: 0
//                       }}>
//                         {type.description}
//                       </p>
//                     </button>
//                   );
//                 })}
//               </div>
//             </>
//           )}

//           {/* Step 2: Method Selection */}
//           {step === 2 && (
//             <>
//               {/* Header with back button */}
//               <div style={{ 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 marginBottom: '2rem' 
//               }}>
//                 <button 
//                   onClick={() => setStep(1)}
//                   style={{ 
//                     background: 'none', 
//                     border: 'none', 
//                     cursor: 'pointer', 
//                     marginRight: '1rem',
//                     padding: '0.5rem',
//                     borderRadius: '0.5rem',
//                     transition: 'background-color 0.2s'
//                   }}
//                   onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
//                   onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
//                 >
//                   <ArrowLeft size={24} style={{ color: '#374151' }} />
//                 </button>
//                 <h1 style={{ 
//                   fontSize: '1.5rem', 
//                   fontWeight: '600', 
//                   color: '#1f2937', 
//                   margin: 0 
//                 }}>
//                   Scanner un {getTypeTitle()}
//                 </h1>
//               </div>

//               {/* Logo */}
//               <div className="logo-container">
//                 <img 
//                   src={miloLogo} 
//                   alt="Milo Logo" 
//                   className="logo-milo"
//                 />
//               </div>
              
//               {/* Form Header */}
//               <div className="form-header">
//                 <h2 className="form-title">Choisir la méthode</h2>
//                 <p className="form-subtitle">
//                   Comment souhaitez-vous ajouter votre document ?
//                 </p>
//               </div>

//               <div className="form">
//                 <button
//                   onClick={() => handleFileSelect('camera')}
//                   style={{
//                     width: '100%',
//                     backgroundColor: '#8b5cf6',
//                     color: 'white',
//                     fontWeight: '600',
//                     fontSize: '1rem',
//                     padding: '1.5rem',
//                     borderRadius: '0.75rem',
//                     border: 'none',
//                     cursor: 'pointer',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     gap: '0.75rem',
//                     transition: 'all 0.2s ease-in-out',
//                     marginBottom: '1rem'
//                   }}
//                   onMouseEnter={(e) => {
//                     e.target.style.backgroundColor = '#7c3aed';
//                     e.target.style.transform = 'translateY(-2px)';
//                   }}
//                   onMouseLeave={(e) => {
//                     e.target.style.backgroundColor = '#8b5cf6';
//                     e.target.style.transform = 'translateY(0)';
//                   }}
//                 >
//                   <Camera size={24} />
//                   <span>📷 Prendre une photo</span>
//                 </button>

//                 <button
//                   onClick={() => handleFileSelect('gallery')}
//                   style={{
//                     width: '100%',
//                     backgroundColor: '#16a34a',
//                     color: 'white',
//                     fontWeight: '600',
//                     fontSize: '1rem',
//                     padding: '1.5rem',
//                     borderRadius: '0.75rem',
//                     border: 'none',
//                     cursor: 'pointer',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     gap: '0.75rem',
//                     transition: 'all 0.2s ease-in-out'
//                   }}
//                   onMouseEnter={(e) => {
//                     e.target.style.backgroundColor = '#15803d';
//                     e.target.style.transform = 'translateY(-2px)';
//                   }}
//                   onMouseLeave={(e) => {
//                     e.target.style.backgroundColor = '#16a34a';
//                     e.target.style.transform = 'translateY(0)';
//                   }}
//                 >
//                   <FolderOpen size={24} />
//                   <span>📁 Importer depuis la galerie</span>
//                 </button>
//               </div>
//             </>
//           )}

//           {/* Step 3: Preview */}
//           {step === 3 && selectedFile && (
//             <>
//               {/* Header with back button */}
//               <div style={{ 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 marginBottom: '2rem' 
//               }}>
//                 <button 
//                   onClick={() => setStep(2)}
//                   style={{ 
//                     background: 'none', 
//                     border: 'none', 
//                     cursor: 'pointer', 
//                     marginRight: '1rem',
//                     padding: '0.5rem',
//                     borderRadius: '0.5rem',
//                     transition: 'background-color 0.2s'
//                   }}
//                   onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
//                   onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
//                 >
//                   <ArrowLeft size={24} style={{ color: '#374151' }} />
//                 </button>
//                 <h1 style={{ 
//                   fontSize: '1.5rem', 
//                   fontWeight: '600', 
//                   color: '#1f2937', 
//                   margin: 0 
//                 }}>
//                   Scanner un {getTypeTitle()}
//                 </h1>
//               </div>

//               {/* Logo */}
//               <div className="logo-container">
//                 <img 
//                   src={miloLogo} 
//                   alt="Milo Logo" 
//                   className="logo-milo"
//                 />
//               </div>
              
//               {/* Form Header */}
//               <div className="form-header">
//                 <h2 className="form-title">Prévisualisation</h2>
//                 <p className="form-subtitle">
//                   Vérifiez votre document avant de l'envoyer
//                 </p>
//               </div>

//               <div className="form">
//                 {/* Preview Area */}
//                 <div style={{
//                   backgroundColor: 'white',
//                   borderRadius: '1rem',
//                   padding: '1.5rem',
//                   border: '2px solid #e5e7eb',
//                   marginBottom: '1.5rem'
//                 }}>
//                   <div style={{
//                     height: '12rem',
//                     backgroundColor: '#f3f4f6',
//                     borderRadius: '0.75rem',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     marginBottom: '1rem'
//                   }}>
//                     <div style={{ textAlign: 'center', color: '#9ca3af' }}>
//                       <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📄</div>
//                       <p style={{ fontSize: '0.875rem', margin: 0 }}>Aperçu du document</p>
//                     </div>
//                   </div>
                  
//                   <div style={{ textAlign: 'center' }}>
//                     <h3 style={{ 
//                       fontWeight: '600', 
//                       color: '#1f2937', 
//                       marginBottom: '0.25rem',
//                       fontSize: '1rem'
//                     }}>
//                       {selectedFile.name}
//                     </h3>
//                     <p style={{ 
//                       color: '#6b7280', 
//                       fontSize: '0.875rem',
//                       margin: 0,
//                       lineHeight: '1.4'
//                     }}>
//                       Type: {selectedFile.type}<br />
//                       Taille: {selectedFile.size}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Action Buttons */}
//                 <button
//                   onClick={() => setSelectedFile(null)}
//                   style={{
//                     width: '100%',
//                     backgroundColor: '#ef4444',
//                     color: 'white',
//                     fontWeight: '600',
//                     fontSize: '0.95rem',
//                     padding: '1rem',
//                     borderRadius: '0.75rem',
//                     border: 'none',
//                     cursor: 'pointer',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     gap: '0.75rem',
//                     transition: 'all 0.2s ease-in-out',
//                     marginBottom: '0.75rem'
//                   }}
//                   onMouseEnter={(e) => {
//                     e.target.style.backgroundColor = '#dc2626';
//                     e.target.style.transform = 'translateY(-2px)';
//                   }}
//                   onMouseLeave={(e) => {
//                     e.target.style.backgroundColor = '#ef4444';
//                     e.target.style.transform = 'translateY(0)';
//                   }}
//                 >
//                   <Trash2 size={20} />
//                   <span>🗑️ Supprimer</span>
//                 </button>

//                 <button
//                   onClick={handleSubmit}
//                   className="submit-button"
//                   style={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     gap: '0.75rem'
//                   }}
//                 >
//                   <UploadIcon size={20} />
//                   <span>📤 Envoyer le document</span>
//                 </button>

//                 {/* Navigation Links */}
//                 <div style={{ 
//                   textAlign: 'center', 
//                   marginTop: '1.5rem',
//                   display: 'flex',
//                   flexDirection: 'column',
//                   gap: '0.5rem'
//                 }}>
//                   <button
//                     onClick={() => setStep(2)}
//                     className="signup-link"
//                   >
//                     ← Choisir un autre document
//                   </button>
//                   <button
//                     onClick={() => setStep(1)}
//                     className="signup-link"
//                   >
//                     ← Retour au choix du type
//                   </button>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
      
//       <div className="footer">
//         <p>© 2025 Milo. Tous droits réservés.</p>
//       </div>
//     </div>
//   );
// };

// export default Upload;

