import React, { useEffect, useState } from 'react';
import PromoModal from './PromoModal';

const ExitIntentModal = () => {
  const [showExitIntent, setShowExitIntent] = useState(false);

  useEffect(() => {
    let isExitIntent = false;

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !isExitIntent) {
        const alreadyShown = sessionStorage.getItem('exit-intent-shown');
        if (!alreadyShown) {
          setShowExitIntent(true);
          isExitIntent = true;
          sessionStorage.setItem('exit-intent-shown', 'true');
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!showExitIntent) return null;

  return <PromoModal type="exit-intent" delay={0} />;
};

export default ExitIntentModal;