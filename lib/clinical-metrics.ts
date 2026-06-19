export type ClinicalMessage = {
  role: "client" | "trainee";
  text: string;
};

export type CoachSuggestion = {
  tone: "good" | "next" | "watch";
  eyebrow: string;
  title: string;
  body: string;
};

export type CoachSuggestionMatch = {
  matched: boolean;
  label: string;
  skill:
    | "allianceFrame"
    | "affectReflection"
    | "openQuestion"
    | "singleQuestion"
    | "collaboration"
    | "riskScreen"
    | "formulation";
};

export type ClinicalMetric = {
  key:
    | "alliance"
    | "empathicAccuracy"
    | "questionQuality"
    | "reflectionRatio"
    | "collaboration"
    | "riskScreen";
  label: string;
  value: number;
  display: string;
  detail: string;
};

export type ClinicalScores = {
  alliance: number;
  empathicAccuracy: number;
  questionQuality: number;
  reflectionRatio: number;
  collaboration: number;
  riskScreen: number;
};

export type ClinicalAnalysis = {
  metrics: ClinicalMetric[];
  scores: ClinicalScores;
  behaviorCounts: {
    traineeTurns: number;
    clientTurns: number;
    reflections: number;
    validations: number;
    openQuestions: number;
    closedQuestions: number;
    stackedQuestions: number;
    adviceMoves: number;
    collaborationMoves: number;
    riskCues: number;
    riskScreens: number;
  };
  suggestions: CoachSuggestion[];
  facultyRows: string[][];
};

export type CompletedClinicalSession = {
  personaName: string;
  duration: number;
  totalMessages: number;
  scores?: Partial<ClinicalScores> | Record<string, unknown>;
  messages?: ClinicalMessage[];
  createdAt: string;
};

const reflectionPatterns = [
  /\bsounds like\b/i,
  /\bit sounds\b/i,
  /\bseems like\b/i,
  /\byou'?re feeling\b/i,
  /\byou feel\b/i,
  /\bwhat i hear\b/i,
  /\bpart of you\b/i,
  /\bthat feels\b/i,
];

const validationPatterns = [
  /\bmakes sense\b/i,
  /\bi understand\b/i,
  /\bthat is understandable\b/i,
  /\bthat sounds hard\b/i,
  /\boverwhelming\b/i,
  /\bthank you for\b/i,
  /\bi appreciate\b/i,
];

const openQuestionPatterns = [
  /\bwhat\b[^?]*\?/i,
  /\bhow\b[^?]*\?/i,
  /\bwhen\b[^?]*\?/i,
  /\bwhere\b[^?]*\?/i,
  /\btell me\b[^?]*\?/i,
  /\bcan you say more\b/i,
  /\bcould you share\b/i,
];

const advicePatterns = [
  /\byou should\b/i,
  /\byou need to\b/i,
  /\byou have to\b/i,
  /\bjust try\b/i,
  /\btry to\b/i,
  /\bwhy don't you\b/i,
  /\bcalm down\b/i,
  /\bit will get better\b/i,
  /\byou'?ll be okay\b/i,
  /\beverything will be okay\b/i,
  /\bdon'?t worry\b/i,
  /\byou got this\b/i,
  /\bthings will improve\b/i,
  /\byou'?ll be fine\b/i,
  /\bit gets better\b/i,
];

const collaborationPatterns = [
  /\bwould it be okay\b/i,
  /\bis it okay if\b/i,
  /\bcan we\b/i,
  /\bwe could\b/i,
  /\btogether\b/i,
  /\bif you'?re comfortable\b/i,
  /\bpermission\b/i,
];

const riskCuePatterns = [
  /\bhopeless\b/i,
  /\bno point\b/i,
  /\bcan't go on\b/i,
  /\bend it\b/i,
  /\bdie\b/i,
  /\bkill myself\b/i,
  /\bsuicide\b/i,
  /\bhurt myself\b/i,
  /\bnot safe\b/i,
  /\bwouldn't wake up\b/i,
];

const riskScreenPatterns = [
  /\bare you safe\b/i,
  /\bsafe right now\b/i,
  /\bhurt(?:ing)? yourself\b/i,
  /\bkill yourself\b/i,
  /\bsuicid/i,
  /\bending your life\b/i,
  /\bwish you wouldn't wake up\b/i,
  /\bthoughts of death\b/i,
];

function countMatches(text: string, patterns: RegExp[]) {
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function clampScore(value: number) {
  return Math.max(1, Math.min(5, Number(value.toFixed(1))));
}

function metric(
  key: ClinicalMetric["key"],
  label: string,
  value: number,
  detail: string,
  display = `${value.toFixed(1)}/5`
): ClinicalMetric {
  return { key, label, value, display, detail };
}

function scoreBand(score: number) {
  if (score >= 4.2) return "strong";
  if (score >= 3.4) return "developing";
  if (score >= 2.6) return "needs practice";
  return "priority";
}

function questionCount(text: string) {
  return (text.match(/\?/g) ?? []).length;
}

function matchResult(
  matched: boolean,
  skill: CoachSuggestionMatch["skill"],
  label: string
): CoachSuggestionMatch {
  return { matched, skill, label };
}

export function evaluateCoachSuggestionMatch(
  suggestion: CoachSuggestion,
  traineeText: string
): CoachSuggestionMatch {
  const normalizedTitle = suggestion.title.toLowerCase();
  const hasReflection = countMatches(traineeText, reflectionPatterns) > 0;
  const hasValidation = countMatches(traineeText, validationPatterns) > 0;
  const hasOpenQuestion = countMatches(traineeText, openQuestionPatterns) > 0;
  const hasAdvice = countMatches(traineeText, advicePatterns) > 0;
  const hasCollaboration = countMatches(traineeText, collaborationPatterns) > 0;
  const hasRiskScreen = countMatches(traineeText, riskScreenPatterns) > 0;
  const questions = questionCount(traineeText);

  if (normalizedTitle.includes("screen for safety")) {
    return matchResult(hasRiskScreen, "riskScreen", "Safety screen matched");
  }

  if (normalizedTitle.includes("ask permission")) {
    return matchResult(
      hasCollaboration && !hasAdvice,
      "collaboration",
      "Permission language matched"
    );
  }

  if (normalizedTitle.includes("one clean question")) {
    return matchResult(
      questions === 1 && !hasAdvice,
      "singleQuestion",
      "Single question matched"
    );
  }

  if (normalizedTitle.includes("affect reflection")) {
    return matchResult(
      hasReflection || hasValidation,
      "affectReflection",
      "Reflection matched"
    );
  }

  if (normalizedTitle.includes("open the next question")) {
    return matchResult(
      hasOpenQuestion && questions <= 1,
      "openQuestion",
      "Open question matched"
    );
  }

  if (normalizedTitle.includes("open with alliance")) {
    return matchResult(
      hasOpenQuestion || hasCollaboration || /\buseful today\b/i.test(traineeText),
      "allianceFrame",
      "Alliance frame matched"
    );
  }

  return matchResult(
    (hasReflection || hasValidation) && hasOpenQuestion,
    "formulation",
    "Clinical formulation matched"
  );
}

export function analyzeClinicalSession(messages: ClinicalMessage[]): ClinicalAnalysis {
  const traineeMessages = messages.filter((message) => message.role === "trainee");
  const clientMessages = messages.filter((message) => message.role === "client");
  const latestTrainee = traineeMessages.at(-1)?.text ?? "";
  const allTraineeText = traineeMessages.map((message) => message.text).join("\n");
  const allClientText = clientMessages.map((message) => message.text).join("\n");

  const questionMarks = (allTraineeText.match(/\?/g) ?? []).length;
  const latestQuestionMarks = (latestTrainee.match(/\?/g) ?? []).length;
  const reflections = traineeMessages.reduce(
    (count, message) => count + countMatches(message.text, reflectionPatterns),
    0
  );
  const validations = traineeMessages.reduce(
    (count, message) => count + countMatches(message.text, validationPatterns),
    0
  );
  const openQuestions = traineeMessages.reduce(
    (count, message) => count + countMatches(message.text, openQuestionPatterns),
    0
  );
  const adviceMoves = traineeMessages.reduce(
    (count, message) => count + countMatches(message.text, advicePatterns),
    0
  );
  const collaborationMoves = traineeMessages.reduce(
    (count, message) => count + countMatches(message.text, collaborationPatterns),
    0
  );
  const riskCues = countMatches(allClientText, riskCuePatterns);
  const riskScreens = countMatches(allTraineeText, riskScreenPatterns);
  const stackedQuestions = traineeMessages.filter((message) => {
    const marks = (message.text.match(/\?/g) ?? []).length;
    return marks > 1;
  }).length;
  const closedQuestions = Math.max(0, questionMarks - openQuestions);
  const reflectionRatioValue = questionMarks === 0 ? reflections : reflections / questionMarks;

  const noData = traineeMessages.length === 0;
  const alliance = noData
    ? 0
    : clampScore(2.6 + validations * 0.35 + collaborationMoves * 0.45 + openQuestions * 0.15 - adviceMoves * 0.35);
  const empathicAccuracy = noData
    ? 0
    : clampScore(2.4 + reflections * 0.45 + validations * 0.3 - adviceMoves * 0.35 - stackedQuestions * 0.25);
  const questionQuality = noData
    ? 0
    : clampScore(3.1 + openQuestions * 0.3 - closedQuestions * 0.2 - stackedQuestions * 0.65);
  const reflectionRatio = noData ? 0 : clampScore(2.5 + Math.min(2, reflectionRatioValue) * 0.9 - Math.max(0, closedQuestions - reflections) * 0.2);
  const collaboration = noData
    ? 0
    : clampScore(2.6 + collaborationMoves * 0.55 + validations * 0.15 - adviceMoves * 0.35);
  const riskScreen =
    riskCues === 0 ? 5 : riskScreens > 0 ? 5 : 1;

  const riskDisplay = riskCues === 0 ? "Not cued" : riskScreens > 0 ? "Covered" : "Missed";
  const scores: ClinicalScores = {
    alliance,
    empathicAccuracy,
    questionQuality,
    reflectionRatio,
    collaboration,
    riskScreen,
  };

  return {
    scores,
    metrics: [
      metric("alliance", "Working alliance", alliance, noData ? "start a session to calculate" : "bond, task, and goal alignment"),
      metric("empathicAccuracy", "Empathic accuracy", empathicAccuracy, noData ? "waiting for trainee turn" : "reflection plus validation"),
      metric("questionQuality", "Question quality", questionQuality, noData ? "waiting for trainee turn" : "open, single-focus questions"),
      metric(
        "reflectionRatio",
        "Reflection ratio",
        reflectionRatio,
        noData ? "waiting for trainee turn" : `${reflections} reflections / ${questionMarks} questions`,
        noData ? "0:0" : `${reflectionRatioValue.toFixed(1)}:1`
      ),
      metric("collaboration", "Collaboration", collaboration, noData ? "waiting for trainee turn" : "permission, agenda, shared pacing"),
      metric(
        "riskScreen",
        "Risk screen",
        riskScreen,
        riskCues === 0 ? "no safety cue detected" : riskScreens > 0 ? "safety cue addressed" : "safety cue needs follow-up",
        riskDisplay
      ),
    ],
    behaviorCounts: {
      traineeTurns: traineeMessages.length,
      clientTurns: clientMessages.length,
      reflections,
      validations,
      openQuestions,
      closedQuestions,
      stackedQuestions,
      adviceMoves,
      collaborationMoves,
      riskCues,
      riskScreens,
    },
    suggestions: buildSuggestions({
      noData,
      latestTrainee,
      reflections,
      validations,
      openQuestions,
      stackedQuestions,
      adviceMoves,
      collaborationMoves,
      riskCues,
      riskScreens,
      reflectionRatioValue,
      closedQuestions,
    }),
    facultyRows: [
      ["Alliance", scoreBand(alliance || 1), `${alliance ? alliance.toFixed(1) : "0.0"}/5`, alliance >= 4 ? "Maintained bond while shaping the work." : "Name the shared task and ask for agreement."],
      ["Empathy", scoreBand(empathicAccuracy || 1), `${empathicAccuracy ? empathicAccuracy.toFixed(1) : "0.0"}/5`, reflections > 0 ? "Reflections are present; deepen affect language." : "Add a clear feeling reflection before assessment."],
      ["Questions", scoreBand(questionQuality || 1), `${questionQuality ? questionQuality.toFixed(1) : "0.0"}/5`, stackedQuestions > 0 ? "Reduce stacked questions." : "Keep questions open and single-focus."],
      ["Risk", riskDisplay, riskDisplay, riskCues > 0 && riskScreens === 0 ? "Safety language needs direct screening." : "Risk handling matches the available cue."],
    ],
  };
}

function buildSuggestions(input: {
  noData: boolean;
  latestTrainee: string;
  reflections: number;
  validations: number;
  openQuestions: number;
  stackedQuestions: number;
  adviceMoves: number;
  collaborationMoves: number;
  riskCues: number;
  riskScreens: number;
  reflectionRatioValue: number;
  closedQuestions: number;
}): CoachSuggestion[] {
  if (input.noData) {
    return [
      {
        tone: "good",
        eyebrow: "What worked",
        title: "Ready to establish frame",
        body: "Start with role clarity, consent, and one invitation into the client's concern.",
      },
      {
        tone: "next",
        eyebrow: "Next move",
        title: "Open with alliance",
        body: "Ask what would make the session useful today before moving into assessment.",
      },
      {
        tone: "watch",
        eyebrow: "Clinical watch",
        title: "Avoid early fixing",
        body: "Stay with the client's meaning before offering tools or reassurance.",
      },
    ];
  }

  const goodBody =
    input.reflections > 0 || input.validations > 0
      ? "You used reflection or validation, which supports alliance before assessment."
      : input.openQuestions > 0
        ? "You invited the client to elaborate instead of closing the topic too early."
        : "You stayed engaged with the client. Now make the next move more clinically specific.";

  let nextTitle = "Deepen the formulation";
  let nextBody = "Reflect the client's emotion, then ask one open question tied to the presenting concern.";

  if (input.riskCues > 0 && input.riskScreens === 0) {
    nextTitle = "Screen for safety";
    nextBody = "The client used safety-relevant language. Ask directly about thoughts of self-harm or not wanting to live.";
  } else if (input.stackedQuestions > 0) {
    nextTitle = "Use one clean question";
    nextBody = "The last exchange packed in too much. Ask one question, then leave room for the client to answer.";
  } else if (input.adviceMoves > 0) {
    nextTitle = "Ask permission first";
    nextBody = "Before offering advice, check whether the client wants coping ideas or more space to unpack the feeling.";
  } else if (input.reflections === 0) {
    nextTitle = "Add an affect reflection";
    nextBody = "Name the feeling you hear, then ask whether you are getting it right.";
  } else if (input.openQuestions === 0) {
    nextTitle = "Open the next question";
    nextBody = "Use a what or how question connected to the client's own words.";
  }

  let watchTitle = "Question-heavy drift";
  let watchBody = "Keep the reflection-to-question balance close to 1:1 so the client does not feel interviewed.";

  if (input.adviceMoves > 0) {
    watchTitle = "Premature advice";
    watchBody = "Premature advice can reduce collaboration when it arrives before the client feels understood.";
  } else if (input.closedQuestions > input.openQuestions) {
    watchTitle = "Closed-question drift";
    watchBody = "Too many closed questions can narrow the session before the concern is understood.";
  } else if (input.collaborationMoves === 0) {
    watchTitle = "Collaboration gap";
    watchBody = "Add permission language or a shared agenda so the client has more control in the work.";
  } else if (input.reflectionRatioValue >= 1) {
    watchTitle = "Maintain depth";
    watchBody = "The structure is solid. Keep linking reflections to concrete examples from the client.";
  }

  return [
    {
      tone: "good",
      eyebrow: "What worked",
      title: "Good therapeutic stance",
      body: goodBody,
    },
    {
      tone: "next",
      eyebrow: "Next move",
      title: nextTitle,
      body: nextBody,
    },
    {
      tone: "watch",
      eyebrow: "Clinical watch",
      title: watchTitle,
      body: watchBody,
    },
  ];
}

function scoreFromSession(session: CompletedClinicalSession, key: keyof ClinicalScores) {
  const value = session.scores?.[key];
  return typeof value === "number" ? value : 0;
}

function mean(values: number[]) {
  const valid = values.filter((value) => value > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function summarizeClinicalHistory(history: CompletedClinicalSession[]) {
  const completedSessions = history.length;
  const allianceMean = mean(history.map((session) => scoreFromSession(session, "alliance")));
  const empathicMean = mean(history.map((session) => scoreFromSession(session, "empathicAccuracy")));
  const questionMean = mean(history.map((session) => scoreFromSession(session, "questionQuality")));
  const collaborationMean = mean(history.map((session) => scoreFromSession(session, "collaboration")));
  const scored = [
    ["Working alliance", allianceMean],
    ["Empathic accuracy", empathicMean],
    ["Question quality", questionMean],
    ["Collaboration", collaborationMean],
  ] as const;
  const weakest = scored
    .filter(([, value]) => value > 0)
    .sort((a, b) => a[1] - b[1])[0];
  const latestRows = [...history]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5)
    .map((session) => [
      session.personaName,
      `${(scoreFromSession(session, "alliance") || 0).toFixed(1)}/5`,
      `${(scoreFromSession(session, "empathicAccuracy") || 0).toFixed(1)}/5`,
      `${session.totalMessages} turns`,
      new Date(session.createdAt).toLocaleDateString(),
    ]);

  return {
    completedSessions,
    allianceMean,
    allianceMeanDisplay: allianceMean ? `${allianceMean.toFixed(1)}/5` : "No data",
    empathicMeanDisplay: empathicMean ? `${empathicMean.toFixed(1)}/5` : "No data",
    questionMeanDisplay: questionMean ? `${questionMean.toFixed(1)}/5` : "No data",
    collaborationMeanDisplay: collaborationMean ? `${collaborationMean.toFixed(1)}/5` : "No data",
    practiceFocus: weakest?.[0] ?? "Start first case",
    latestRows,
  };
}
