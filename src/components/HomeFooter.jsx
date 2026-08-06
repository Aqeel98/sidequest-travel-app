import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { useAppPreferences } from '../context/AppPreferencesContext';

const INSTAGRAM_URL = 'https://www.instagram.com/sidequest.lk';

const HomeFooter = () => {
  const { t } = useAppPreferences();

  return (
    <footer data-nosnippet className="mt-16 bg-white/50 backdrop-blur-sm dark:bg-[#0b3b3b]/85">
      <div className="max-w-7xl mx-auto px-4 py-7 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <p className="text-sm text-slate-600 dark:text-cyan-100/90">
          © {new Date().getFullYear()} SideQuest.lk™. {t('rights')}
        </p>
        <div className="flex items-center gap-4 text-sm font-semibold">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label="SideQuest on Instagram"
            className="text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
          >
            <Instagram size={20} />
          </a>
          <Link to="/privacy" className="text-brand-700 hover:underline dark:text-brand-300">{t('privacyPolicy')}</Link>
          <Link to="/terms" className="text-brand-700 hover:underline dark:text-brand-300">{t('termsAndConditions')}</Link>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
