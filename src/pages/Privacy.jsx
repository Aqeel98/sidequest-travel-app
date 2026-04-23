import React from 'react';
import SEO from '../components/SEO';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#E6D5B8] px-4 py-10">
      <SEO title="Privacy Policy" description="How SideQuest handles traveler privacy and data." />
      <div className="max-w-3xl mx-auto rounded-3xl bg-white p-8 md:p-10 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-slate-600 mb-6">Effective: April 2026</p>
        <div className="space-y-5 leading-relaxed text-slate-700">
          <p>We collect account details, quest activity, uploaded proof, and redemption records to run the SideQuest platform.</p>
          <p>Location access is used only when you choose nearby quest features. SideQuest does not track your live location in the background, and you can turn location access off anytime in your device/browser settings.</p>
          <p>We do not sell your personal data. Data is used for quest verification, rewards, platform safety, and fraud prevention.</p>
          <p>For privacy requests, contact us on Instagram: <a href="https://www.instagram.com/sidequest.lk/?utm_source=ig_web_button_share_sheet" target="_blank" rel="noreferrer" className="text-brand-700 underline hover:text-brand-800">instagram.com/sidequest.lk</a>.</p>
          <p className="text-sm text-slate-500">© SideQuest.lk™. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
