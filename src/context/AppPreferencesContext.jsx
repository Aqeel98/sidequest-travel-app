import React, { createContext, useContext, useLayoutEffect, useEffect, useMemo, useState } from 'react';

const AppPreferencesContext = createContext(null);

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'es', label: 'Espanol' },
  { code: 'fr', label: 'Francais' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ru', label: 'Русский' },
  { code: 'ko', label: '한국어' },
  { code: 'hi', label: 'हिन्दी' },
];

const TRANSLATIONS = {
  en: {
    quests: 'Quests',
    map: 'Map',
    quiz: 'Quiz',
    guide: 'Guide',
    rewards: 'Rewards',
    myQuests: 'My Quests',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    privacyPolicy: 'Privacy Policy',
    termsAndConditions: 'Terms & Conditions',
    rights: 'All rights reserved.',
    travelerTag: 'Discover the unseen Sri Lanka',
  },
  es: {
    quests: 'Quests',
    map: 'Mapa',
    quiz: 'Quiz',
    guide: 'Guia',
    rewards: 'Recompensas',
    myQuests: 'Mis Quests',
    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    language: 'Idioma',
    privacyPolicy: 'Privacidad',
    termsAndConditions: 'Terminos',
    rights: 'Todos los derechos reservados.',
    travelerTag: 'Descubre Sri Lanka',
  },
  fr: {
    quests: 'Quetes',
    map: 'Carte',
    quiz: 'Quiz',
    guide: 'Guide',
    rewards: 'Recompenses',
    myQuests: 'Mes Quetes',
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
    language: 'Langue',
    privacyPolicy: 'Confidentialite',
    termsAndConditions: 'Conditions generales',
    rights: 'Tous droits reserves.',
    travelerTag: 'Decouvrez le Sri Lanka cache',
  },
  si: {
    quests: 'ක්වෙස්ට්',
    map: 'සිතියම',
    quiz: 'ප්‍රශ්නාවලිය',
    guide: 'මාර්ගෝපදේශය',
    rewards: 'ප්‍රතිලාභ',
    myQuests: 'මගේ ක්වෙස්ට්',
    darkMode: 'අඳුරු තේමාව',
    lightMode: 'ආලෝක තේමාව',
    language: 'භාෂාව',
    privacyPolicy: 'පෞද්ගලිකත්ව ප්‍රතිපත්තිය',
    termsAndConditions: 'නියම සහ කොන්දේසි',
    rights: 'සියලු හිමිකම් ඇවිරිණි.',
    travelerTag: 'නොදුටු ශ්‍රී ලංකාව සොයා ගන්න',
  },
  ta: {
    quests: 'தேடல்கள்',
    map: 'வரைபடம்',
    quiz: 'வினாடி வினா',
    guide: 'வழிகாட்டி',
    rewards: 'வெகுமதிகள்',
    myQuests: 'என் தேடல்கள்',
    darkMode: 'இருண்ட நிலை',
    lightMode: 'ஒளி நிலை',
    language: 'மொழி',
    privacyPolicy: 'தனியுரிமைக் கொள்கை',
    termsAndConditions: 'விதிமுறைகள் மற்றும் நிபந்தனைகள்',
    rights: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    travelerTag: 'பாராத இலங்கையை கண்டறியுங்கள்',
  },
  ar: {
    quests: 'المهام',
    map: 'الخريطة',
    quiz: 'اختبار',
    guide: 'الدليل',
    rewards: 'المكافآت',
    myQuests: 'مهامي',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    language: 'اللغة',
    privacyPolicy: 'سياسة الخصوصية',
    termsAndConditions: 'الشروط والاحكام',
    rights: 'جميع الحقوق محفوظة.',
    travelerTag: 'اكتشف سريلانكا غير المرئية',
  },
  zh: {
    quests: '任务',
    map: '地图',
    quiz: '测验',
    guide: '指南',
    rewards: '奖励',
    myQuests: '我的任务',
    darkMode: '深色模式',
    lightMode: '浅色模式',
    language: '语言',
    privacyPolicy: '隐私政策',
    termsAndConditions: '条款和条件',
    rights: '保留所有权利。',
    travelerTag: '探索不为人知的斯里兰卡',
  },
  ja: {
    quests: 'クエスト',
    map: 'マップ',
    quiz: 'クイズ',
    guide: 'ガイド',
    rewards: '報酬',
    myQuests: 'マイクエスト',
    darkMode: 'ダークモード',
    lightMode: 'ライトモード',
    language: '言語',
    privacyPolicy: 'プライバシーポリシー',
    termsAndConditions: '利用規約',
    rights: '全著作権所有。',
    travelerTag: 'まだ知られていないスリランカを発見',
  },
  de: {
    quests: 'Quests',
    map: 'Karte',
    quiz: 'Quiz',
    guide: 'Leitfaden',
    rewards: 'Belohnungen',
    myQuests: 'Meine Quests',
    darkMode: 'Dunkelmodus',
    lightMode: 'Hellmodus',
    language: 'Sprache',
    privacyPolicy: 'Datenschutz',
    termsAndConditions: 'AGB',
    rights: 'Alle Rechte vorbehalten.',
    travelerTag: 'Entdecke das verborgene Sri Lanka',
  },
  ru: {
    quests: 'Квесты',
    map: 'Карта',
    quiz: 'Викторина',
    guide: 'Гид',
    rewards: 'Награды',
    myQuests: 'Мои квесты',
    darkMode: 'Темный режим',
    lightMode: 'Светлый режим',
    language: 'Язык',
    privacyPolicy: 'Политика конфиденциальности',
    termsAndConditions: 'Условия использования',
    rights: 'Все права защищены.',
    travelerTag: 'Откройте для себя неизведанную Шри-Ланку',
  },
  ko: {
    quests: '퀘스트',
    map: '지도',
    quiz: '퀴즈',
    guide: '가이드',
    rewards: '보상',
    myQuests: '내 퀘스트',
    darkMode: '다크 모드',
    lightMode: '라이트 모드',
    language: '언어',
    privacyPolicy: '개인정보 처리방침',
    termsAndConditions: '이용 약관',
    rights: '모든 권리 보유.',
    travelerTag: '숨겨진 스리랑카를 발견하세요',
  },
  hi: {
    quests: 'क्वेस्ट',
    map: 'नक्शा',
    quiz: 'क्विज़',
    guide: 'गाइड',
    rewards: 'रिवॉर्ड्स',
    myQuests: 'मेरे क्वेस्ट',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    language: 'भाषा',
    privacyPolicy: 'गोपनीयता नीति',
    termsAndConditions: 'नियम और शर्तें',
    rights: 'सर्वाधिकार सुरक्षित।',
    travelerTag: 'श्रीलंका का अनदेखा रूप खोजें',
  },
};

export const AppPreferencesProvider = ({ children }) => {
  // Theme defaults to light on every fresh load.
  const [theme, setTheme] = useState('light');

  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('sq_language');
    return LANGUAGES.some((lang) => lang.code === savedLanguage) ? savedLanguage : 'en';
  });

  const applyThemeClass = (isDark) => {
    const nodes = [document.documentElement, document.body, document.getElementById('root')].filter(Boolean);
    nodes.forEach((node) => node.classList.toggle('dark', isDark));
  };

  useLayoutEffect(() => {
    // Hard reset to light on load to avoid any stale dark class.
    applyThemeClass(false);
    setTheme('light');
  }, []);

  useEffect(() => {
    const isDark = theme === 'dark';
    applyThemeClass(isDark);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sq_language', language);
  }, [language]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
      setThemeMode: (mode) => setTheme(mode === 'dark' ? 'dark' : 'light'),
      language,
      setLanguage,
      languageOptions: LANGUAGES,
      t: (key) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key,
    }),
    [theme, language],
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
};

export const useAppPreferences = () => {
  const context = useContext(AppPreferencesContext);
  if (!context) throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  return context;
};
