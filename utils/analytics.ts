// Simple analytics utility for tracking user events and page views

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // In a real application, this would send data to PostHog, Mixpanel, Google Analytics, etc.
  // For now, we log it to the console to simulate tracking.
  console.log(`[Analytics Event] ${eventName}`, properties || {});
  
  // Example of how you might send this to your own backend if desired:
  // fetch('/api/analytics/event', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ eventName, properties, timestamp: new Date().toISOString() })
  // }).catch(console.error);
};

export const trackPageView = (pageName: string) => {
  console.log(`[Analytics PageView] ${pageName}`);
};
