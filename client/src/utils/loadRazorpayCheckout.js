let razorpayScriptPromise = null;

export default function loadRazorpayCheckout() {
  if (typeof window === "undefined") return Promise.reject(new Error("Payment checkout is only available in a browser"));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      let script = document.querySelector('script[data-razorpay-checkout="true"]');
      const onLoad = () => {
        if (window.Razorpay) resolve(window.Razorpay);
        else reject(new Error("Payment checkout loaded but is unavailable"));
      };
      const onError = () => {
        script?.remove();
        reject(new Error("Unable to load payment checkout"));
      };

      if (script) {
        if (script.dataset.loaded === "true") return onError();
        script.addEventListener("load", onLoad, { once: true });
        script.addEventListener("error", onError, { once: true });
        return;
      }

      script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.dataset.razorpayCheckout = "true";
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        onLoad();
      }, { once: true });
      script.addEventListener("error", onError, { once: true });
      document.body.appendChild(script);
    }).catch(error => {
      razorpayScriptPromise = null;
      throw error;
    });
  }

  return razorpayScriptPromise;
}
