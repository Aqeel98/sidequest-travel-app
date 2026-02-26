import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, name, type, image, url }) {
  
  const cleanPath = window.location.pathname;
  const baseDomain = 'https://sidequest.lk'; 
  const currentUrl = url || `${baseDomain}${cleanPath}`;

  const siteTitle = 'SideQuest | Adventure with Impact';
  const siteDescription = 'Discover meaningful quests across Sri Lanka. Join the community, complete impactful quests, and earn rewards.';
  const defaultImage = 'https://www.sidequest.lk/sq-v4-apple.png';

  const metaTitle = title ? `${title} | SideQuest` : siteTitle;
  const metaDescription = description || siteDescription;
  const metaImage = image || defaultImage;

  return (
    <Helmet>
      {/* 
      */}
      <title>{metaTitle}</title>
      <meta name='description' content={metaDescription} />
      <link rel="canonical" href={currentUrl} />

      {/* 
      */}
      <meta property="og:type" content={type || 'website'} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="SideQuest Sri Lanka" />

      <meta name="twitter:creator" content={name || 'SideQuest'} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
}