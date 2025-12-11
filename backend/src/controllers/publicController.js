const { loadLeaderboard } = require("../services/leaderboardService");

const getCompetitionInfo = async (req, res) => {
  console.log("getCompetitionInfo called");
  try {
    const competitionInfo = {
      title: "EvalynX - Automated Content Submission Evaluation System",
      description:
        "A comprehensive platform for video content submission, evaluation, scoring, and result announcement for computer science competitions.",

      criteria: [
        {
          name: "Relevance to Learning Outcomes",
          weightage: 5,
          description:
            "How well the content aligns with educational objectives and learning outcomes",
        },
        {
          name: "Innovation & Creativity",
          weightage: 15,
          description:
            "Originality and creative approach in presenting the content",
        },
        {
          name: "Clarity & Accessibility",
          weightage: 10,
          description:
            "How clearly the content is presented and how accessible it is to the target audience",
        },
        {
          name: "Depth",
          weightage: 5,
          description:
            "The level of detail and thoroughness in covering the topic",
        },
        {
          name: "Interactivity & Engagement",
          weightage: 25,
          description:
            "How engaging and interactive the content is for viewers",
        },
        {
          name: "Use of Technology",
          weightage: 5,
          description:
            "Effective utilization of technology and tools in content creation",
        },
        {
          name: "Scalability & Adaptability",
          weightage: 10,
          description:
            "How well the content can be scaled and adapted for different contexts",
        },
        {
          name: "Alignment with Ethical Standards",
          weightage: 5,
          description:
            "Adherence to ethical guidelines and standards in content creation",
        },
        {
          name: "Practical Application",
          weightage: 10,
          description:
            "Real-world applicability and practical value of the content",
        },
        {
          name: "Video Quality",
          weightage: 10,
          description:
            "Technical quality of the video including audio, visuals, and production value",
        },
      ],

      totalScore: 100,

      rules: [
        "Each team must register with valid credentials and team member details (1-5 members)",
        "Teams must submit a valid video URL for evaluation",
        "Video submissions can be updated before the evaluation deadline",
        "Each team will be evaluated by exactly 3 approved evaluators",
        "Evaluators must be approved by the admin before they can evaluate submissions",
        "Evaluations are based on 10 predefined criteria with specific weightages",
        "Each criterion is scored according to its weightage (total 100 marks)",
        "Final team score is the average of all 3 evaluator assessments",
        "Results will be published only after all evaluations are complete",
        "The leaderboard ranks teams by their average score in descending order",
      ],

      timeline: {
        registrationOpen: "Teams and evaluators can register at any time",
        submissionDeadline: "To be announced by competition organizers",
        evaluationPeriod: "After admin assigns evaluators to teams",
        resultPublication:
          "After all evaluations are completed and admin publishes results",
      },

      contact: {
        email: "support@evalynx.com",
        website: "https://evalynx.com",
        helpdesk:
          "For technical support and inquiries, please contact us via email",
      },

      roles: {
        team: {
          description: "Participants who submit video content for evaluation",
          capabilities: [
            "Register and create account",
            "Submit and update video URL",
            "View evaluation scores and feedback",
            "View leaderboard after publication",
          ],
        },
        evaluator: {
          description: "Approved users who assess team submissions",
          capabilities: [
            "Register and await admin approval",
            "View assigned teams",
            "Evaluate submissions based on criteria",
            "Submit scores and comments",
          ],
        },
        admin: {
          description: "System administrators who manage the platform",
          capabilities: [
            "Approve/reject evaluator registrations",
            "Assign evaluators to teams (automatic or manual)",
            "Monitor evaluation progress",
            "Publish final results and leaderboard",
          ],
        },
      },
    };

    res.json({
      success: true,
      data: competitionInfo,
    });
  } catch (error) {
    console.error("Error fetching competition info:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch competition information",
        details: error.message,
      },
    });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const result = await loadLeaderboard();

    if (!result) {
      return res.json({
        success: true,
        published: false,
        message:
          "Results have not been published yet. Please check back later.",
        leaderboard: [],
      });
    }

    res.json({
      success: true,
      published: true,
      publishedAt: result.publishedAt,
      leaderboard: result.leaderboard,
      totalTeams: result.totalTeams,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch leaderboard",
        details: error.message,
      },
    });
  }
};

module.exports = {
  getCompetitionInfo,
  getLeaderboard,
};
