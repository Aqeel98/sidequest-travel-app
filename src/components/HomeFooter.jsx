import React from 'react';
import { Link } from 'react-router-dom';
import { useAppPreferences } from '../context/AppPreferencesContext';

const HomeFooter = () => {
  const { t } = useAppPreferences();

  return (
    <footer className="mt-16 bg-white/50 backdrop-blur-sm dark:bg-[#0b3b3b]/85">
      <div className="max-w-7xl mx-auto px-4 py-7 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <p className="text-sm text-slate-600 dark:text-cyan-100/90">
          © {new Date().getFullYear()} SideQuest.lk™. {t('rights')}
        </p>
        <div className="flex items-center gap-4 text-sm font-semibold">
          <Link to="/privacy" className="text-brand-700 hover:underline dark:text-brand-300">{t('privacyPolicy')}</Link>
          <Link to="/terms" className="text-brand-700 hover:underline dark:text-brand-300">{t('termsAndConditions')}</Link>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
