const getCorsOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    return {
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
      ],
      exposedHeaders: ["Content-Range", "X-Content-Range"],
      maxAge: 600,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : ["http://localhost:5173"];

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],

    exposedHeaders: ["Content-Range", "X-Content-Range"],

    maxAge: 600,

    preflightContinue: false,

    optionsSuccessStatus: 204,
  };

  return corsOptions;
};

module.exports = getCorsOptions;
