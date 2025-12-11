const mongoSanitize = require("express-mongo-sanitize");

const sanitizeConfig = {
  replaceWith: "_",

  onSanitize: ({ req, key }) => {
    console.warn(`⚠ Sanitized prohibited character in request: ${key}`);
  },
};

const applySanitization = (app) => {
  app.use(mongoSanitize(sanitizeConfig));
  console.log("✓ Input sanitization enabled");
};

const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  next();
};

module.exports = {
  applySanitization,
  sanitizeInput,
  sanitizeConfig,
};
