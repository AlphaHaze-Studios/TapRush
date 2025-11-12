export function showAd() {
  console.log('[Ad Manager] Showing interstitial ad...');
  
  console.log('[Ad Manager] Ad would be displayed here.');
  console.log('[Ad Manager] Integration with AdMob or similar service needed.');
  
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log('[Ad Manager] Ad completed.');
      resolve();
    }, 100);
  });
}

export function showRewardedAd(onReward: () => void) {
  console.log('[Ad Manager] Showing rewarded ad...');
  
  setTimeout(() => {
    console.log('[Ad Manager] Rewarded ad completed. Granting reward...');
    onReward();
  }, 100);
}
