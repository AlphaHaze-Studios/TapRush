export function showAd() {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 100);
  });
}

export function showRewardedAd(onReward: () => void) {
  setTimeout(() => {
    onReward();
  }, 100);
}
