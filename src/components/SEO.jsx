import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, name, type, image, url }) {
  const currentUrl = url || window.location.href;
  const siteTitle = 'SideQuest | Adventure with Impact';
  const siteDescription = 'Discover meaningful quests across Sri Lanka.';
  const defaultImage = 'https://www.sidequest.lk/sq-v4-apple.png';

  const metaTitle = title ? `${title} | SideQuest` : siteTitle;
  const metaDescription = description || siteDescription;
  const metaImage = image || defaultImage;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{metaTitle}</title>
      <meta name='description' content={metaDescription} />
      <link rel="canonical" href={currentUrl} />

      {/* Facebook tags */}
      <meta property="og:type" content={type || 'website'} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="SideQuest Sri Lanka" />

      {/* Twitter tags */}
      <meta name="twitter:creator" content={name || 'SideQuest'} />
      <meta name="twitter:card" content={type === 'article' ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
}
