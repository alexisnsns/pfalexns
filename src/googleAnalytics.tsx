import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer: any[];
  }
}

interface GAProps {
  trackingId: string;
}

export default function GoogleAnalytics({ trackingId }: GAProps) {
  useEffect(() => {
    // Inject gtag.js script if it doesn't exist yet
    if (!document.querySelector("#ga-script")) {
      const script = document.createElement("script");
      script.id = "ga-script";
      script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
      script.async = true;
      document.head.appendChild(script);
    }

    // Initialize GA
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }

    gtag("js", new Date());
    gtag("config", trackingId);
  }, [trackingId]);

  return null;
}
