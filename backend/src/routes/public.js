const express = require("express");
const router = express.Router();
const {
  getCompetitionInfo,
  getLeaderboard,
} = require("../controllers/publicController");

console.log("Public routes loaded");

router.get("/competition-info", (req, res, next) => {
  console.log("Competition info route hit");
  getCompetitionInfo(req, res, next);
});

router.get("/leaderboard", getLeaderboard);

module.exports = router;
