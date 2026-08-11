import React from 'react';
import { useLocation } from 'react-router-dom';

const SEO = ({ title, description }) => {
  const siteUrl = "https://amarjeetyadav.vercel.app";
  const location = useLocation();
  const canonicalUrl = `${siteUrl}${location.pathname}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </>
  );
};

export default SEO;
