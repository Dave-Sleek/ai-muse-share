import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

const SEOHead = ({
  title = "PromptShare - Share Your AI Art & Prompts",
  description = "Discover and share AI-generated images with prompts. Connect with a creative community passionate about AI art.",
  image = "https://lovable.dev/opengraph-image-p98pqg.png",
  url,
  type = "website"
}: SEOHeadProps) => {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  
  // Truncate description to 160 chars for SEO
  const truncatedDescription = description.length > 160 
    ? description.substring(0, 157) + "..." 
    : description;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={truncatedDescription} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="PromptShare" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEOHead;
