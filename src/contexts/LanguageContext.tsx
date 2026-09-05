import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es' | 'hi' | 'kn';

export const translations = {
  en: {
    overview: "Overview",
    development: "Development",
    map: "Map",
    aiPlanning: "AI Planning",
    settings: "Settings",
    suggest: "Suggest",
    suggestDevelopment: "Suggest Development",
    language: "Language",
    selectLanguage: "Select Language",
    signOut: "Sign Out",
    signIn: "Sign In",
    joinCivicPulse: "Join CivicPulse",
    signInDesc: "Sign in to report community problems, upvote active issues, write comments, and earn recognition badges.",
    signInGoogle: "Sign In with Google",
    continueAnon: "Continue Anonymously",
    cancel: "Cancel",
    profileTitle: "User Profile & Settings",
    verifiedResident: "Verified Resident Contributor",
    submissions: "Submissions",
    proposalsCount: "Development Proposals",
    citizenStatus: "Citizen Status",
    registeredConstituency: "Registered Constituency Context",
    constituencyDesc: "Your account is assigned to the primary urban constituency sector for development proposals.",
    primarySector: "Primary Sector",
    sectorVal: "Sector-4, Metropolitan Ward",
    assignedRep: "Assigned Representative",
    mpOffice: "Member of Parliament (MP) Office",
    myCivicReports: "My Civic Reports",
    noReports: "You have not submitted any civic reports yet.",
    reportFirst: "Report Your First Issue",
    theme: "Interface Theme",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    alerts: "Alerts",
    markAllRead: "Mark all as read",
    noAlerts: "No unread notifications",
    points: "pts",
    footerText: "Municipal Ward Infrastructure Ledger.",
    languageLabel: "App Language",
    pleaseSignIn: "Please sign in to view your civic reports and profile details.",
    changeLanguage: "Change App Language",
    appearance: "Appearance"
  },
  es: {
    overview: "Visión General",
    development: "Desarrollo",
    map: "Mapa",
    aiPlanning: "Planificación IA",
    settings: "Ajustes",
    suggest: "Sugerir",
    suggestDevelopment: "Sugerir Desarrollo",
    language: "Idioma",
    selectLanguage: "Seleccionar Idioma",
    signOut: "Cerrar Sesión",
    signIn: "Iniciar Sesión",
    joinCivicPulse: "Unirse a CivicPulse",
    signInDesc: "Inicie sesión para informar problemas de la comunidad, votar por temas activos, escribir comentarios y ganar insignias.",
    signInGoogle: "Iniciar Sesión con Google",
    continueAnon: "Continuar Anónimamente",
    cancel: "Cancelar",
    profileTitle: "Perfil de Usuario y Ajustes",
    verifiedResident: "Colaborador Residente Verificado",
    submissions: "Envíos",
    proposalsCount: "Propuestas de Desarrollo",
    citizenStatus: "Estado del Ciudadano",
    registeredConstituency: "Contexto de Circunscripción Registrada",
    constituencyDesc: "Su cuenta está asignada al sector de circunscripción urbana principal para propuestas de desarrollo.",
    primarySector: "Sector Primario",
    sectorVal: "Sector-4, Distrito Metropolitano",
    assignedRep: "Representante Asignado",
    mpOffice: "Oficina del Miembro del Parlamento (MP)",
    myCivicReports: "Mis Informes Cívicos",
    noReports: "Aún no ha enviado ningún informe cívico.",
    reportFirst: "Informe su Primer Problema",
    theme: "Tema de la Interfaz",
    lightMode: "Modo Claro",
    darkMode: "Modo Oscuro",
    alerts: "Alertas",
    markAllRead: "Marcar todo como leído",
    noAlerts: "Sin notificaciones no leídas",
    points: "ptos",
    footerText: "Libro de Infraestructura del Distrito Municipal.",
    languageLabel: "Idioma de la Aplicación",
    pleaseSignIn: "Inicie sesión para ver sus informes cívicos y detalles de perfil.",
    changeLanguage: "Cambiar idioma de la aplicación",
    appearance: "Apariencia"
  },
  hi: {
    overview: "अवलोकन",
    development: "विकास",
    map: "मानचित्र",
    aiPlanning: "एआई योजना",
    settings: "सेटिंग्स",
    suggest: "सुझाव दें",
    suggestDevelopment: "विकास का सुझाव दें",
    language: "भाषा",
    selectLanguage: "भाषा चुनें",
    signOut: "साइन आउट",
    signIn: "साइन इन",
    joinCivicPulse: "CivicPulse से जुड़ें",
    signInDesc: "सामुदायिक समस्याओं की रिपोर्ट करने, सक्रिय मुद्दों पर वोट करने, टिप्पणियां लिखने और पहचान बैज अर्जित करने के लिए साइन इन करें।",
    signInGoogle: "Google के साथ साइन इन करें",
    continueAnon: "अनाम रूप से जारी रखें",
    cancel: "रद्द करें",
    profileTitle: "उपयोगकर्ता प्रोफ़ाइल और सेटिंग्स",
    verifiedResident: "सत्यापित निवासी योगदानकर्ता",
    submissions: "प्रस्तूतियाँ",
    proposalsCount: "विकास प्रस्ताव",
    citizenStatus: "नागरिक स्थिति",
    registeredConstituency: "पंजीकृत निर्वाचन क्षेत्र संदर्भ",
    constituencyDesc: "आपका खाता विकास प्रस्तावों के लिए प्राथमिक शहरी निर्वाचन क्षेत्र क्षेत्र को सौंपा गया है।",
    primarySector: "प्राथमिक क्षेत्र",
    sectorVal: "सेक्टर -4, महानगरीय वार्ड",
    assignedRep: "सौंपे गए प्रतिनिधि",
    mpOffice: "संसद सदस्य (एमपी) कार्यालय",
    myCivicReports: "मेरी नागरिक रिपोर्टें",
    noReports: "आपने अभी तक कोई नागरिक रिपोर्ट प्रस्तुत नहीं की है।",
    reportFirst: "अपनी पहली समस्या रिपोर्ट करें",
    theme: "इंटरफ़ेस थीम",
    lightMode: "लाइट मोड",
    darkMode: "डार्क मोड",
    alerts: "अलर्ट",
    markAllRead: "सभी को पढ़ा हुआ चिह्नित करें",
    noAlerts: "कोई अपठित सूचना नहीं",
    points: "अंक",
    footerText: "नगर पालिका वार्ड बुनियादी ढांचा बही।",
    languageLabel: "ऐप की भाषा",
    pleaseSignIn: "अपने नागरिक रिपोर्ट और प्रोफ़ाइल विवरण देखने के लिए कृपया साइन इन करें।",
    changeLanguage: "ऐप की भाषा बदलें",
    appearance: "प्रकटन"
  },
  kn: {
    overview: "ಅವಲೋಕನ",
    development: "ಅಭಿವೃದ್ಧಿ",
    map: "ನಕ್ಷೆ",
    aiPlanning: "AI ಯೋಜನೆ",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    suggest: "ಸಲಹೆ",
    suggestDevelopment: "ಅಭಿವೃದ್ಧಿ ಸಲಹೆ",
    language: "ಭಾಷೆ",
    selectLanguage: "ಭಾಷೆಯನ್ನು ಆರಿಸಿ",
    signOut: "ಸೈನ್ ಔಟ್",
    signIn: "ಸೈನ್ ಇನ್",
    joinCivicPulse: "CivicPulse ಗೆ ಸೇರಿ",
    signInDesc: "ಸಮುದಾಯದ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಲು, ಸಕ್ರಿಯ ಸಮಸ್ಯೆಗಳಿಗೆ ಮತ ಚಲಾಯಿಸಲು, ಕಾಮೆಂಟ್ ಮಾಡಲು ಮತ್ತು ಬ್ಯಾಡ್ಜ್‌ಗಳನ್ನು ಗಳಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.",
    signInGoogle: "Google ನೊಂದಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ",
    continueAnon: "ಅನಾಮಧೇಯವಾಗಿ ಮುಂದುವರಿಯಿರಿ",
    cancel: "ರದ್ದುಮಾಡಿ",
    profileTitle: "ಬಳಕೆದಾರರ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    verifiedResident: "ಪರಿಶೀಲಿಸಿದ ನಿವಾಸಿ ಕೊಡುಗೆದಾರ",
    submissions: "ಸಲ್ಲಿಕೆಗಳು",
    proposalsCount: "ಅಭಿವೃದ್ಧಿ ಪ್ರಸ್ತಾವನೆಗಳು",
    citizenStatus: "ನಾಗರಿಕ ಸ್ಥಿತಿ",
    registeredConstituency: "ನೋಂದಾಯಿತ ಮತಕ್ಷೇತ್ರದ ಸಂದರ್ಭ",
    constituencyDesc: "ಅಭಿವೃದ್ಧಿ ಪ್ರಸ್ತಾವನೆಗಳಿಗಾಗಿ ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಪ್ರಾಥಮಿಕ ನಗರ ಕ್ಷೇತ್ರಕ್ಕೆ ನಿಯೋಜಿಸಲಾಗಿದೆ.",
    primarySector: "ಪ್ರಾಥಮಿಕ ವಲಯ",
    sectorVal: "ವಲಯ-4, ಮೆಟ್ರೋಪಾಲಿಟನ್ ವಾರ್ಡ್",
    assignedRep: "ನಿಯೋಜಿತ ಪ್ರತಿನಿಧಿ",
    mpOffice: "ಸಂಸತ್ ಸದಸ್ಯರ (MP) ಕಚೇರಿ",
    myCivicReports: "ನನ್ನ ನಾಗರಿಕ ವರದಿಗಳು",
    noReports: "ನೀವು ಇನ್ನೂ ಯಾವುದೇ ನಾಗರಿಕ ವರದಿಗಳನ್ನು ಸಲ್ಲಿಸಿಲ್ಲ.",
    reportFirst: "ನಿಮ್ಮ ಮೊದಲ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ",
    theme: "ಇಂಟರ್ಫೇಸ್ ಥೀಮ್",
    lightMode: "ಲೈಟ್ ಮೋಡ್",
    darkMode: "ಡಾರ್ಕ್ ಮೋಡ್",
    alerts: "ಅಲರ್ಟ್‌ಗಳು",
    markAllRead: "ಎಲ್ಲವನ್ನೂ ಓದಿದಂತೆ ಗುರುತಿಸಿ",
    noAlerts: "ಯಾವುದೇ ಹೊಸ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ",
    points: "ಅಂಕಗಳು",
    footerText: "ಮುನಿಸಿಪಲ್ ವಾರ್ಡ್ ಮೂಲಸೌಕರ್ಯ ಲೆಡ್ಜರ್.",
    languageLabel: "ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ",
    pleaseSignIn: "ನಿಮ್ಮ ನಾಗರಿಕ ವರದಿಗಳು ಮತ್ತು ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಲು ದಯವಿಟ್ಟು ಸೈನ್ ಇನ್ ಮಾಡಿ.",
    changeLanguage: "ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ",
    appearance: "ಗೋಚರತೆ"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'en' || saved === 'es' || saved === 'hi' || saved === 'kn') {
      return saved as Language;
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof typeof translations['en']): string => {
    return translations[language][key] || translations['en'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
