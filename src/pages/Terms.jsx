import React from 'react';
import SEO from '../components/SEO';
import { useAppPreferences } from '../context/AppPreferencesContext';

const Terms = () => {
  const { theme } = useAppPreferences();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen px-4 py-10 ${isDark ? 'bg-[#4F452B]' : 'bg-[#E6D5B8]'}`}>
      <SEO title="Terms and Conditions" description="Rules and terms for using SideQuest." />
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm p-8 md:p-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Terms and Conditions</h1>
        <p className="text-slate-600 mb-6">Effective: April 2026</p>
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-900">Eligibility and accounts</h2>
            <p>
              You are responsible for your account and all activity under it. Provide accurate details and keep your login secure.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-900">Traveler conduct</h2>
            <p>
              Follow local laws, respect communities, and avoid unsafe or prohibited behavior while completing quests.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-900">Submissions and moderation</h2>
            <p>
              Submission proof may be reviewed and rejected if it is incomplete, unclear, duplicated, or violates platform rules.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-900">Rewards and redemptions</h2>
            <p>
              Reward availability may change based on partner stock, eligibility rules, and validation checks. Misuse may lead to suspension.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-900">Liability</h2>
            <p>
              SideQuest provides a discovery platform and does not guarantee outcomes for partner services, travel plans, or third-party locations.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-900">Changes</h2>
            <p>
              Terms may be updated as the product evolves. Continued use after updates means you accept the revised terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
