import React, { useState, useEffect } from 'react';
import PromoModal from './PromoModal';

const PromoModalManager = () => {
  const [activePromo, setActivePromo] = useState(null);
  const [promoConfigs] = useState([
    {
      id: 'welcome-2024',
      type: 'welcome',
      enabled: true,
      delay: 3000,
      showOnce: true,
      title: 'Welcome to E-Shop! 👋',
      description: 'Discover amazing products with fast shipping and unbeatable prices.',
      buttonText: 'Start Shopping',
      buttonLink: '/shop',
    },
    {
      id: 'flash-sale-jan',
      type: 'sale',
      enabled: true,
      delay: 5000,
      showOnce: true,
      title: '🔥 Flash Sale Alert!',
      description: 'Get up to 50% OFF on selected items',
      buttonText: 'Shop Sale Items',
      buttonLink: '/shop?sale=true',
      discountPercentage: 50,
    },
    {
      id: 'newsletter-signup',
      type: 'newsletter',
      enabled: true,
      delay: 10000,
      showOnce: true,
      title: 'Get 10% Off Your First Order!',
      description: 'Subscribe to our newsletter for exclusive offers and updates.',
      buttonText: 'Get My 10% Off',
      buttonLink: '#',
      discountCode: 'WELCOME10',
      discountPercentage: 10,
    },
  ]);

  useEffect(() => {
    // Check if user is new visitor
    const isNewVisitor = !localStorage.getItem('visited_before');
    
    if (isNewVisitor) {
      localStorage.setItem('visited_before', 'true');
      // Show welcome modal for new visitors
      const welcomePromo = promoConfigs.find(p => p.type === 'welcome' && p.enabled);
      if (welcomePromo) {
        setTimeout(() => setActivePromo(welcomePromo), welcomePromo.delay);
      }
    } else {
      // Show other promos for returning visitors
      const otherPromos = promoConfigs.filter(p => p.type !== 'welcome' && p.enabled);
      if (otherPromos.length > 0) {
        const randomPromo = otherPromos[Math.floor(Math.random() * otherPromos.length)];
        setTimeout(() => setActivePromo(randomPromo), randomPromo.delay);
      }
    }
  }, [promoConfigs]);

  if (!activePromo) return null;

  return (
    <PromoModal 
      type={activePromo.type}
      delay={0}
      showOnce={activePromo.showOnce}
      title={activePromo.title}
      description={activePromo.description}
      buttonText={activePromo.buttonText}
      buttonLink={activePromo.buttonLink}
      discountCode={activePromo.discountCode}
      discountPercentage={activePromo.discountPercentage}
    />
  );
};

export default PromoModalManager;