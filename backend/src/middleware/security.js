const helmet = require("helmet");

const getHelmetConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const enableHelmet = process.env.ENABLE_HELMET !== "false";

  if (!enableHelmet) {
    return null;
  }

  const config = {
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        }
      : false,

    crossOriginEmbedderPolicy: false,

    crossOriginOpenerPolicy: { policy: "same-origin" },

    crossOriginResourcePolicy: { policy: "cross-origin" },

    dnsPrefetchControl: { allow: false },

    expectCt: isProduction
      ? {
          maxAge: 86400,
          enforce: true,
        }
      : false,

    frameguard: { action: "deny" },

    hidePoweredBy: true,

    hsts: isProduction
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false,

    ieNoOpen: true,

    noSniff: true,

    originAgentCluster: true,

    permittedCrossDomainPolicies: { permittedPolicies: "none" },

    referrerPolicy: { policy: "no-referrer" },

    xssFilter: true,
  };

  return config;
};

const applyHelmet = (app) => {
  const config = getHelmetConfig();

  if (config) {
    app.use(helmet(config));
    console.log("✓ Helmet security headers enabled");
  } else {
    console.log("⚠ Helmet security headers disabled");
  }
};

module.exports = {
  getHelmetConfig,
  applyHelmet,
};
