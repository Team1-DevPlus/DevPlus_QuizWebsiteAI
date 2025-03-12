// Global variables to store quiz state
let questions = [];
let maxQuestions = 0;
let currentQuizId = null;
let autoSaveTimer = null;

// Make currentQuizId accessible globally
window.currentQuizId = null;

// Helper function to check if HTML elements exist
function checkElementsExist() {
  const elements = [
    "setup-section",
    "preview-section",
    "quiz-section",
    "results-section",
    "topic",
    "difficulty",
    "question-count",
    "multiple-choice",
    "single-choice",
    "text-answer",
    "loading",
    "preview-container",
    "question-container",
    "current-question",
    "total-questions",
    "current-score",
    "max-score",
  ];

  console.log("Checking if HTML elements exist:");
  elements.forEach((id) => {
    const element = document.getElementById(id);
    console.log(`- ${id}: ${element ? "exists" : "NOT FOUND"}`);
  });
}

// Helper function to check if JavaScript functions exist
function checkFunctionsExist() {
  const functions = [
    "generateQuestions",
    "resetQuiz",
    "startQuiz",
    "showPreview",
    "deleteQuestion",
    "replaceQuestion",
    "addNewQuestion",
    "finishQuiz",
    "goHome",
  ];

  console.log("Checking if JavaScript functions exist in window object:");
  functions.forEach((funcName) => {
    console.log(
      `- ${funcName}: ${
        typeof window[funcName] === "function" ? "exists" : "NOT FOUND"
      }`
    );
  });

  console.log(
    "Checking if quizModule exists:",
    window.quizModule ? "exists" : "NOT FOUND"
  );
  if (window.quizModule) {
    const moduleFunctions = [
      "initQuiz",
      "resetQuizState",
      "displayCurrentQuestion",
      "selectAnswer",
      "nextQuestion",
      "previousQuestion",
      "updateNavigationButtons",
      "resetBackgroundColor",
    ];

    console.log("Checking if quizModule functions exist:");
    moduleFunctions.forEach((funcName) => {
      console.log(
        `- ${funcName}: ${
          typeof window.quizModule[funcName] === "function"
            ? "exists"
            : "NOT FOUND"
        }`
      );
    });
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded event fired");
  checkElementsExist();
  checkFunctionsExist();

  if (window.quizDB && window.quizDB.db) {
    initializeApp(); // Start app if DB is ready
  } else {
    window.addEventListener("db-ready", initializeApp); // Wait for DB
  }
});

// Initialize the application
function initializeApp() {
  console.log("Database initialized, app ready");

  // Check URL parameters for quiz ID to resume
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get("id");

  if (quizId) {
    resumeQuiz(Number.parseInt(quizId));
    console.log(quizId);
  }
}

// Helper function to check visibility of sections
function checkSectionVisibility() {
  const setupSection = document.getElementById("setup-section");
  const previewSection = document.getElementById("preview-section");
  const quizSection = document.getElementById("quiz-section");
  const resultsSection = document.getElementById("results-section");

  console.log("Section visibility:");
  console.log(
    "- setup-section:",
    setupSection ? !setupSection.classList.contains("hidden") : "not found"
  );
  console.log(
    "- preview-section:",
    previewSection ? !previewSection.classList.contains("hidden") : "not found"
  );
  console.log(
    "- quiz-section:",
    quizSection ? !quizSection.classList.contains("hidden") : "not found"
  );
  console.log(
    "- results-section:",
    resultsSection ? !resultsSection.classList.contains("hidden") : "not found"
  );
}

// Generate questions using API
async function generateQuestions() {
  const topic = document.getElementById("topic").value;
  const level = document.getElementById("difficulty").value;
  const count = Number.parseInt(
    document.getElementById("question-count").value
  );

  if (!topic || isNaN(count) || count < 1 || count > 20) {
    alert("Please enter a valid topic and number of questions (1-20)!");
    return;
  }

  maxQuestions = count;

  // Show loading indicator
  document.getElementById("loading").classList.remove("hidden");

  // Get selected question types
  const multipleChoice = document.getElementById("multiple-choice").checked;
  const dragAndDrop = document.getElementById("single-choice").checked;
  const matchAnswer = document.getElementById("text-answer").checked;

  // Ensure at least one type is selected
  if (!multipleChoice && !dragAndDrop && !matchAnswer) {
    alert("Please select at least one question type!");
    document.getElementById("loading").classList.add("hidden");
    return;
  }

  // Calculate distribution of question types
  let questionTypes = [];
  if (multipleChoice) questionTypes.push("multiple-choice");
  if (dragAndDrop) questionTypes.push("drag-and-drop");
  if (matchAnswer) questionTypes.push("match-answer");

  // Distribute questions among selected types
  const distribution = distributeQuestions(count, questionTypes);
  console.log("Question distribution:", distribution);

  try {
    let allQuestions = [];

    // Generate multiple choice questions if selected
    if (multipleChoice && distribution["multiple-choice"] > 0) {
      console.log("Generating multiple choice questions...");
      const mcQuestions = await generateMultipleChoiceQuestions(
        topic,
        level,
        distribution["multiple-choice"]
      );
      console.log("Multiple choice questions generated:", mcQuestions.length);
      allQuestions = allQuestions.concat(mcQuestions);
    }

    // Generate drag and drop questions if selected
    if (dragAndDrop && distribution["drag-and-drop"] > 0) {
      console.log("Generating drag and drop questions...");
      const ddQuestions = await generateDragAndDropQuestions(
        topic,
        level,
        distribution["drag-and-drop"]
      );
      console.log("Drag and drop questions generated:", ddQuestions.length);
      allQuestions = allQuestions.concat(ddQuestions);
    }

    // Generate match answer questions if selected
    if (matchAnswer && distribution["match-answer"] > 0) {
      console.log("Generating match answer questions...");
      const maQuestions = await generateMatchAnswerQuestions(
        topic,
        level,
        distribution["match-answer"]
      );
      console.log("Match answer questions generated:", maQuestions.length);
      allQuestions = allQuestions.concat(maQuestions);
    }

    // Shuffle questions to mix different types
    questions = shuffleArray(allQuestions);
    console.log("Total questions generated:", questions.length);
  } catch (error) {
    console.error("Error generating questions:", error);
  }

  // Hide loading indicator
  document.getElementById("loading").classList.add("hidden");

  if (questions.length === 0) {
    alert("Unable to create questions. Please try again!");
    return;
  }

  // Initialize quiz
  const userAnswers = Array(questions.length).fill(null);
  const currentQuestionIndex = 0;
  const currentScore = 0;

  // Create and save the quiz to IndexedDB
  const quizData = {
    topic: document.getElementById("topic").value,
    questionCount: questions.length,
    questions: questions,
    userAnswers: userAnswers,
    currentQuestionIndex: currentQuestionIndex,
    currentScore: currentScore,
    status: "incomplete",
    timestamp: Date.now(),
    startTime: Date.now(),
  };

  try {
    currentQuizId = await window.quizDB.saveQuiz(quizData);
    window.currentQuizId = currentQuizId; // Make it accessible globally
    console.log("Quiz saved with ID:", currentQuizId);

    // Start auto-save timer
    startAutoSave();
  } catch (error) {
    console.error("Failed to save quiz:", error);
  }

  console.log("Hiding setup section...");
  document.getElementById("setup-section").classList.add("hidden");

  // Initialize quiz module
  window.quizModule.initQuiz(
    questions,
    userAnswers,
    currentQuestionIndex,
    currentScore
  );

  // Update UI elements for quiz section
  document.getElementById("total-questions").textContent = questions.length;
  document.getElementById("max-score").textContent = questions.length;
  document.getElementById("current-score").textContent = "0";

  // Make sure quiz section is hidden
  document.getElementById("quiz-section").classList.add("hidden");
  document.getElementById("results-section").classList.add("hidden");

  // Save to localStorage as backup
  localStorage.setItem("questions", JSON.stringify(quizData));
  localStorage.setItem(
    "userAnswers",
    JSON.stringify(Array(questions.length).fill(null))
  );

  // Show preview section
  console.log("Showing preview section...");
  document.getElementById("preview-section").classList.remove("hidden");

  // Check visibility of sections
  checkSectionVisibility();

  // Show preview
  showPreview();
  console.log("Preview should be visible now");

  // Check visibility again after showPreview
  checkSectionVisibility();
}

// Helper function to distribute questions among selected types
function distributeQuestions(totalCount, types) {
  const distribution = {};
  const typeCount = types.length;

  // Initialize all types with 0
  types.forEach((type) => {
    distribution[type] = 0;
  });

  // Basic distribution - divide evenly
  const baseCount = Math.floor(totalCount / typeCount);
  types.forEach((type) => {
    distribution[type] = baseCount;
  });

  // Distribute remaining questions
  let remaining = totalCount - baseCount * typeCount;
  for (let i = 0; i < remaining; i++) {
    distribution[types[i % typeCount]]++;
  }

  return distribution;
}

// Shuffle array function
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Generate multiple choice questions
async function generateMultipleChoiceQuestions(topic, level, count) {
  console.log(
    "generateMultipleChoiceQuestions called with",
    topic,
    level,
    count
  );
  const apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDijs4L5KVp8iU09EZIAfZALfxGD4q7epU";

  try {
    console.log("Sending API request for multiple choice questions");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Create ${count} unique **multiple-choice questions** about: "${topic}" at difficulty level: "${level}".
**Question Format:**
Each question must have:
- A clear and **well-structured** question statement.
- **Four answer options** labeled (A, B, C, D).
- **One correct answer** (marked as A, B, C, or D).
- A **detailed explanation** for the correct answer.
- Return the questions **separated by "---"** for easy parsing.

**Output Format:**
---
Question: <question>
A. <answer A>
B. <answer B>
C. <answer C>
D. <answer D>
Correct answer: <letter of correct answer>
Reason: <detailed explanation>
---

### **Requirements:**
✅ **Avoid vague, ambiguous, or opinion-based questions.**
✅ **Ensure answers are factual and verifiable.**
✅ **Use engaging real-world examples where possible.**
✅ **Ensure diverse question topics within the main theme.**
✅ **Vary the difficulty while keeping the format consistent.**

**Example Output:**
---
Question: What is the chemical symbol for gold?
A. Au
B. Ag
C. Fe
D. Pb
Correct answer: A
Reason: "Au" is the chemical symbol for gold, derived from the Latin word "Aurum".
---`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("API response received for multiple choice questions");

    if (
      !data ||
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      !data.candidates[0].content.parts[0]
    ) {
      console.error("Invalid API response format:", data);
      return [];
    }

    const content = data.candidates[0].content.parts[0].text || "";
    console.log("Content received:", content.substring(0, 100) + "...");

    const questionBlocks = content
      .split("---")
      .map((q) => q.trim())
      .filter(Boolean);
    console.log("Question blocks extracted:", questionBlocks.length);

    const parsedQuestions = questionBlocks
      .map((block, index) => {
        console.log(`Parsing question block ${index + 1}`);
        return parseMultipleChoiceQuestion(block);
      })
      .filter(Boolean);
    console.log("Parsed questions:", parsedQuestions.length);

    // Add type property to each question
    return parsedQuestions.map((q) => ({ ...q, type: "multiple-choice" }));
  } catch (error) {
    console.error("Error in generateMultipleChoiceQuestions:", error);
    return [];
  }
}

// Generate drag and drop questions (sequence ordering)
async function generateDragAndDropQuestions(topic, level, count) {
  const apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDijs4L5KVp8iU09EZIAfZALfxGD4q7epU";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Create ${count} unique **sequence ordering questions** about: "${topic}" at difficulty level: "${level}".
**Question Format:**
Each question must have:
- A clear instruction asking to arrange items in the correct order (chronological, procedural, etc.)
- **4-6 items** that need to be arranged in the correct sequence
- The items should be presented in a scrambled order
- The correct sequence (numbered 1-6)
- A **detailed explanation** for why this is the correct sequence

**Output Format:**
---
Question: <instruction to arrange items in correct order>
Items:
- <item 1>
- <item 2>
- <item 3>
- <item 4>
- <item 5 (optional)>
- <item 6 (optional)>
Correct sequence: <correct order as comma-separated numbers, e.g., "3,1,5,2,4,6">
Reason: <detailed explanation of the correct sequence>
---

### **Requirements:**
✅ **Create clear sequences with logical ordering**
✅ **Ensure the correct sequence is unambiguous**
✅ **Use real-world examples where possible**
✅ **Vary the types of sequences (time-based, process-based, etc.)**
✅ **Make sure the scrambled order is different from the correct order**

**Example Output:**
---
Question: Arrange the following events of World War II in chronological order.
Items:
- Pearl Harbor attack
- D-Day invasion
- Battle of Stalingrad
- German surrender
- Hitler's suicide
Correct sequence: 1,3,2,5,4
Reason: The correct chronological order is: Pearl Harbor attack (December 1941), Battle of Stalingrad (1942-1943), D-Day invasion (June 1944), Hitler's suicide (April 1945), and finally German surrender (May 1945).
---`,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const questionBlocks = content
    .split("---")
    .map((q) => q.trim())
    .filter(Boolean);

  const parsedQuestions = questionBlocks
    .map(parseDragAndDropQuestion)
    .filter(Boolean);

  // Add type property to each question
  return parsedQuestions.map((q) => ({ ...q, type: "drag-and-drop" }));
}

// Generate match answer questions
async function generateMatchAnswerQuestions(topic, level, count) {
  const apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDijs4L5KVp8iU09EZIAfZALfxGD4q7epU";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Create ${count} unique **matching questions** about: "${topic}" at difficulty level: "${level}".
**Question Format:**
Each question must have:
- A clear instruction asking to match items from column A with items from column B
- **4 items** in column A (labeled A, B, C, D)
- **4 items** in column B (labeled 1, 2, 3, 4)
- The correct matches (e.g., A-3, B-1, C-4, D-2)
- A **brief explanation** for each match

**Output Format:**
---
Question: <instruction to match items>
Column A:
A. <item A>
B. <item B>
C. <item C>
D. <item D>
Column B:
1. <item 1>
2. <item 2>
3. <item 3>
4. <item 4>
Correct matches: <matches in format "A-3,B-1,C-4,D-2">
Explanations:
- A-3: <explanation>
- B-1: <explanation>
- C-4: <explanation>
- D-2: <explanation>
---

### **Requirements:**
✅ **Create clear and unambiguous matches**
✅ **Ensure each item in Column A has exactly one match in Column B**
✅ **Use diverse and interesting content related to the topic**
✅ **Make sure the matches require knowledge and aren't obvious by wording**

**Example Output:**
---
Question: Match each element with its correct atomic number.
Column A:
A. Oxygen
B. Carbon
C. Gold
D. Iron
Column B:
1. 6
2. 8
3. 26
4. 79
Correct matches: A-2,B-1,C-4,D-3
Explanations:
- A-2: Oxygen has atomic number 8
- B-1: Carbon has atomic number 6
- C-4: Gold has atomic number 79
- D-3: Iron has atomic number 26
---`,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const questionBlocks = content
    .split("---")
    .map((q) => q.trim())
    .filter(Boolean);

  const parsedQuestions = questionBlocks
    .map(parseMatchAnswerQuestion)
    .filter(Boolean);

  // Add type property to each question
  return parsedQuestions.map((q) => ({ ...q, type: "match-answer" }));
}

// Parse multiple choice question from API response
function parseMultipleChoiceQuestion(content) {
  console.log(
    "parseMultipleChoiceQuestion called with content length:",
    content.length
  );

  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  console.log("Lines extracted:", lines.length);

  let question = "";
  const choices = [];
  let correctAnswer = "";
  let reason = "";

  lines.forEach((line) => {
    if (line.startsWith("Question:")) {
      question = line.replace("Question:", "").trim();
    } else if (/^[A-D]\./.test(line)) {
      choices.push(line);
    } else if (line.startsWith("Correct answer:")) {
      correctAnswer = line.replace("Correct answer:", "").trim();
    } else if (line.startsWith("Reason:")) {
      reason = line.replace("Reason:", "").trim();
    }
  });

  console.log(
    "Parsed question:",
    question ? question.substring(0, 30) + "..." : "none"
  );
  console.log("Choices:", choices.length);
  console.log("Correct answer:", correctAnswer);
  console.log("Reason:", reason ? "present" : "none");

  if (question && correctAnswer) {
    return { question, choices, correctAnswer, reason };
  } else {
    console.warn("Invalid question format, missing question or correct answer");
    return null;
  }
}

// Compatibility function for older code that still uses parseQuestion
function parseQuestion(content) {
  const parsedQuestion = parseMultipleChoiceQuestion(content);
  if (parsedQuestion) {
    return { ...parsedQuestion, type: "multiple-choice" };
  }
  return null;
}

// Parse drag and drop question from API response
function parseDragAndDropQuestion(content) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  let question = "";
  const items = [];
  let correctSequence = "";
  let reason = "";
  let collectingItems = false;

  lines.forEach((line) => {
    if (line.startsWith("Question:")) {
      question = line.replace("Question:", "").trim();
    } else if (line === "Items:") {
      collectingItems = true;
    } else if (collectingItems && line.startsWith("-")) {
      items.push(line.substring(1).trim());
    } else if (line.startsWith("Correct sequence:")) {
      collectingItems = false;
      correctSequence = line.replace("Correct sequence:", "").trim();
    } else if (line.startsWith("Reason:")) {
      reason = line.replace("Reason:", "").trim();
    }
  });

  // Convert sequence string to array of indices
  const sequenceArray = correctSequence
    .split(",")
    .map((num) => parseInt(num.trim()));

  return question && items.length > 0 && sequenceArray.length > 0
    ? { question, items, correctSequence: sequenceArray, reason }
    : null;
}

// Parse match answer question from API response
function parseMatchAnswerQuestion(content) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  let question = "";
  const columnA = [];
  const columnB = [];
  let correctMatches = "";
  const explanations = [];

  let collectingColumnA = false;
  let collectingColumnB = false;
  let collectingExplanations = false;

  lines.forEach((line) => {
    if (line.startsWith("Question:")) {
      question = line.replace("Question:", "").trim();
    } else if (line === "Column A:") {
      collectingColumnA = true;
      collectingColumnB = false;
      collectingExplanations = false;
    } else if (line === "Column B:") {
      collectingColumnA = false;
      collectingColumnB = true;
      collectingExplanations = false;
    } else if (collectingColumnA && /^[A-D]\./.test(line)) {
      columnA.push(line);
    } else if (collectingColumnB && /^[1-4]\./.test(line)) {
      columnB.push(line);
    } else if (line.startsWith("Correct matches:")) {
      collectingColumnA = false;
      collectingColumnB = false;
      correctMatches = line.replace("Correct matches:", "").trim();
    } else if (line === "Explanations:") {
      collectingExplanations = true;
    } else if (collectingExplanations && line.startsWith("-")) {
      explanations.push(line.substring(1).trim());
    }
  });

  // Parse matches into a structured format
  const matches = correctMatches.split(",").map((match) => {
    const [left, right] = match.trim().split("-");
    return { left, right };
  });

  return question &&
    columnA.length > 0 &&
    columnB.length > 0 &&
    matches.length > 0
    ? { question, columnA, columnB, matches, explanations }
    : null;
}

// Auto-save quiz progress every 30 seconds
function startAutoSave() {
  // Clear any existing timer
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }

  // Set up new timer
  autoSaveTimer = setInterval(async () => {
    if (currentQuizId) {
      try {
        const quizData = await window.quizDB.getQuiz(currentQuizId);
        if (quizData && quizData.status === "incomplete") {
          // Update with current state
          quizData.userAnswers = window.quizModule.getUserAnswers();
          quizData.currentQuestionIndex =
            window.quizModule.getCurrentQuestionIndex();
          quizData.currentScore = window.quizModule.getCurrentScore();
          quizData.lastSaved = Date.now();

          await window.quizDB.saveQuiz(quizData);
          console.log("Quiz auto-saved");
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }
  }, 30000); // 30 seconds
}

// Stop auto-save timer
function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
}

// Resume a quiz from IndexedDB
async function resumeQuiz(quizId) {
  try {
    const quizData = await window.quizDB.getQuiz(quizId);

    if (!quizData) {
      alert("Quiz not found!");
      return;
    }
    console.log(quizData);

    // Load quiz state
    questions = quizData.questions;
    currentQuizId = quizId;
    window.currentQuizId = quizId; // Make it accessible globally

    // Initialize quiz module with the loaded data
    window.quizModule.initQuiz(
      quizData.questions,
      quizData.userAnswers,
      quizData.currentQuestionIndex,
      quizData.currentScore
    );

    // Update UI
    document.getElementById("topic").value = quizData.topic;
    document.getElementById("question-count").value = quizData.questionCount;

    document.getElementById("setup-section").classList.add("hidden");
    document.getElementById("quiz-section").classList.remove("hidden");
    document.getElementById("total-questions").textContent = questions.length;
    document.getElementById("max-score").textContent = questions.length;
    document.getElementById("current-score").textContent =
      quizData.currentScore;

    window.quizModule.displayCurrentQuestion();
    window.quizModule.updateNavigationButtons();

    // Start auto-save
    startAutoSave();

    console.log("Quiz resumed:", quizId);
  } catch (error) {
    console.error("Failed to resume quiz:", error);
    alert("Failed to resume quiz. Please try again.");
  }
}

// Reset quiz to initial state
function resetQuiz() {
  // Stop auto-save
  stopAutoSave();

  // Hide all sections
  document.getElementById("results-section").classList.add("hidden");
  document.getElementById("quiz-section").classList.add("hidden");
  document.getElementById("preview-section").classList.add("hidden");

  // Show only setup section
  document.getElementById("setup-section").classList.remove("hidden");

  // Clear form fields
  document.getElementById("topic").value = "";
  document.getElementById("question-count").value = "";

  // Reset quiz state
  questions = [];
  currentQuizId = null;

  // Reset quiz module
  window.quizModule.resetQuizState();

  // Clear all containers
  document.getElementById("question-container").innerHTML = "";
  document.getElementById("detailed-results").innerHTML = "";
  document.getElementById("preview-container").innerHTML = "";

  // Reset background color
  window.quizModule.resetBackgroundColor();
}

// Start the quiz
function startQuiz() {
  console.log("startQuiz called");
  if (questions.length === 0) {
    alert("No questions available. Please create questions first!");
    return;
  }

  // Hide all sections first
  console.log("Hiding all sections");
  document.getElementById("setup-section").classList.add("hidden");
  document.getElementById("preview-section").classList.add("hidden");
  document.getElementById("results-section").classList.add("hidden");

  // Show only quiz section
  console.log("Showing quiz section");
  document.getElementById("quiz-section").classList.remove("hidden");

  // Check visibility
  checkSectionVisibility();

  // Initialize quiz module with fresh state
  console.log("Initializing quiz module");
  window.quizModule.initQuiz(
    questions,
    Array(questions.length).fill(null),
    0,
    0
  );

  // Update UI elements
  document.getElementById("total-questions").textContent = questions.length;
  document.getElementById("max-score").textContent = questions.length;
  document.getElementById("current-score").textContent = "0";

  // Clear any previous question display
  document.getElementById("question-container").innerHTML = "";

  // Reset background and display first question
  console.log("Displaying first question");
  window.quizModule.resetBackgroundColor();
  window.quizModule.displayCurrentQuestion();
  window.quizModule.updateNavigationButtons();
  console.log("Quiz started successfully");

  // Check visibility again
  checkSectionVisibility();
}

// Helper function to format code snippets in text
function formatCodeSnippets(text) {
  if (!text) return "";

  // Remove the reference to undefined 'type' variable
  console.log("formatCodeSnippet called with text length:", text.length);

  // First, escape HTML in the entire text to prevent XSS
  let escapedText = escapeHtml(text);

  // Pattern to match code blocks with language specification: ```language code```
  const codeBlockPattern = /```([a-zA-Z]*)\n([\s\S]*?)```/g;

  // Pattern to match inline code: `code`
  const inlineCodePattern = /`([^`]+)`/g;

  // Replace code blocks
  let formattedText = escapedText.replace(
    codeBlockPattern,
    (match, language, code) => {
      // Create a pre>code block with language class for potential syntax highlighting
      return `<pre class="code-block ${
        language ? "language-" + language : ""
      }"><code>${code}</code></pre>`;
    }
  );

  // Then replace inline code
  formattedText = formattedText.replace(inlineCodePattern, (match, code) => {
    return `<code class="inline-code">${code}</code>`;
  });

  return formattedText;
}

// Helper function to escape HTML special characters to prevent XSS
function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Show preview of questions
function showPreview() {
  console.log("showPreview called");
  // Hide all sections first
  document.getElementById("setup-section").classList.add("hidden");
  document.getElementById("quiz-section").classList.add("hidden");
  document.getElementById("results-section").classList.add("hidden");

  // Show only preview section
  document.getElementById("preview-section").classList.remove("hidden");
  console.log("Preview section should be visible now");

  // Check visibility
  checkSectionVisibility();

  const previewContainer = document.getElementById("preview-container");
  if (!previewContainer) {
    console.error("Preview container not found!");
    return;
  }

  previewContainer.innerHTML = "";
  console.log("Rendering", questions.length, "questions in preview");

  questions.forEach((q, index) => {
    console.log("Rendering question", index + 1, "type:", q.type);
    let questionContent = "";

    // Generate different preview content based on question type
    if (q.type === "multiple-choice") {
      // Multiple choice question preview - hide correct answer
      questionContent = `
        <div class="mt-2 space-y-2">
          ${q.choices
            .map(
              (choice) => `
            <div class="p-2 bg-white rounded border border-gray-200">
              ${formatCodeSnippets(choice)}
            </div>
          `
            )
            .join("")}
        </div>
      `;
    } else if (q.type === "drag-and-drop") {
      // Drag and drop question preview
      questionContent = `
        <div class="mt-2">
          <p class="text-sm text-gray-600 mb-2">Items to arrange:</p>
          <div class="space-y-2">
            ${q.items
              .map(
                (item, i) => `
              <div class="p-2 bg-white rounded border border-gray-200">
                ${formatCodeSnippets(item)}
              </div>
            `
              )
              .join("")}
          </div>
          <p class="text-sm text-gray-600 mt-3 mb-1">Type: Sequence Ordering</p>
        </div>
      `;
    } else if (q.type === "match-answer") {
      // Match answer question preview
      questionContent = `
        <div class="mt-2 grid grid-cols-2 gap-3">
          <div>
            <p class="text-sm text-gray-600 mb-2">Column A:</p>
            <div class="space-y-2">
              ${q.columnA
                .map(
                  (item) => `
                <div class="p-2 bg-white rounded border border-gray-200">
                  ${formatCodeSnippets(item)}
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-2">Column B:</p>
            <div class="space-y-2">
              ${q.columnB
                .map(
                  (item) => `
                <div class="p-2 bg-white rounded border border-gray-200">
                  ${formatCodeSnippets(item)}
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          <p class="text-sm text-gray-600 mt-2 col-span-2">Type: Matching</p>
        </div>
      `;
    } else {
      console.warn("Unknown question type:", q.type);
    }

    const questionHtml = `
      <div class="preview-question p-5 bg-gray-100 shadow-lg rounded-xl border border-gray-300 mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">${
          index + 1
        }. ${formatCodeSnippets(q.question)}</h3>
        
        ${questionContent}

        <!-- Action Buttons -->
        <div class="question-actions mt-4 flex justify-end gap-3">
          <button onclick="deleteQuestion(${index})"
            class="px-4 py-2 bg-red-500 text-white font-medium rounded-lg shadow hover:bg-red-600 transition transform hover:scale-105">
            🗑 Delete
          </button>
          <button onclick="replaceQuestion(${index})"
            class="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg shadow hover:bg-blue-600 transition transform hover:scale-105">
            🔄 Replace
          </button>
        </div>
      </div>
    `;
    previewContainer.innerHTML += questionHtml;
  });

  const addQuestionButton = document.querySelector(
    "#preview-section button[onclick='addNewQuestion()']"
  );
  if (!addQuestionButton) {
    console.error("Add question button not found!");
  } else {
    if (questions.length >= maxQuestions) {
      addQuestionButton.style.display = "none";
    } else {
      addQuestionButton.style.display = "inline-block";
    }
  }

  console.log("Preview rendering complete");

  // Check visibility again
  checkSectionVisibility();
}

// Delete question from list
function deleteQuestion(index) {
  questions.splice(index, 1);
  showPreview();
}

// Replace question with AI-generated one
async function replaceQuestion(index) {
  const topic = document.getElementById("topic").value;

  const existingQuestions = questions.map((q) => q.question);

  const apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDijs4L5KVp8iU09EZIAfZALfxGD4q7epU";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Create **1 unique multiple-choice question** on the topic: "${topic}".

⚠ **Important:** The generated question **must NOT duplicate** any of the following existing questions:
${existingQuestions.join("\n")}

### **Requirements:**
- The question must be **original** and **not similar** to the provided ones.
- Ensure **diversity in wording, structure, and concept** compared to the existing questions.
- The question must have **4 answer choices (A, B, C, D)** with **only 1 correct answer**.
- Provide a **detailed reason** for why the correct answer is correct.
- Return the question in the format below:

### **Output Format:**
---
Question: <question>
A. <answer A>
B. <answer B>
C. <answer C>
D. <answer D>
Correct answer: <letter of correct answer>
Reason: <detailed explanation>
---

### **Best Practices:**
✅ **Ensure factual accuracy and clarity** in the question.
✅ **Vary question difficulty** while keeping it engaging.
✅ **Use different question structures** (e.g., definitions, real-world applications, cause-effect).
✅ **Avoid rephrasing existing questions—generate truly new ones.**

---

This **ensures high-quality and unique question generation** while preventing duplicates. 🚀

                ---`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const newQuestion = parseQuestion(content);

    if (newQuestion) {
      questions[index] = newQuestion;
      showPreview();
    }
  } catch (error) {
    console.error("Error replacing question:", error);
  }
}

// Add new question
async function addNewQuestion() {
  if (questions.length >= maxQuestions) {
    alert(
      `The quiz can have a maximum of ${maxQuestions} questions. Cannot add more questions!`
    );
    return;
  }
  const topic = document.getElementById("topic").value;

  const apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDijs4L5KVp8iU09EZIAfZALfxGD4q7epU";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Create 1 multiple-choice question about: ${topic}.
                The question has 4 answer options (A, B, C, D), with only 1 correct answer.
                Return in the format:
                Question: <question>
                A. <answer A>
                B. <answer B>
                C. <answer C>
                D. <answer D>
                Correct answer: <letter of correct answer>
                Reason: <reason for correct answer>
                ---`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const newQuestion = parseQuestion(content);

    if (newQuestion) {
      // Add new question to list
      questions.push(newQuestion);
      // Update preview UI
      showPreview();
    }
  } catch (error) {
    console.error("Error adding question:", error);
    alert("Cannot add question. Please try again!");
  }
}

// Finish quiz and show results
async function finishQuiz() {
  // Get final state from quiz module
  const userAnswers = window.quizModule.getUserAnswers();
  const currentScore = window.quizModule.getCurrentScore();

  // Hide all sections first
  document.getElementById("setup-section").classList.add("hidden");
  document.getElementById("preview-section").classList.add("hidden");
  document.getElementById("quiz-section").classList.add("hidden");

  // Show only results section
  document.getElementById("results-section").classList.remove("hidden");

  // Update score display
  document.getElementById("final-score").textContent = currentScore;
  document.getElementById("final-max-score").textContent = questions.length;

  // Calculate percentage and animate score circle
  const percentage = (currentScore / questions.length) * 100;
  const scoreCircle = document.getElementById("score-circle");
  const circumference = 2 * Math.PI * 45; // 2πr where r=45

  // Set initial state (full offset = no fill)
  scoreCircle.style.strokeDasharray = circumference;
  scoreCircle.style.strokeDashoffset = circumference;

  // Animate the score circle
  setTimeout(() => {
    const offset = circumference - (percentage / 100) * circumference;
    scoreCircle.style.transition = "stroke-dashoffset 1.5s ease-in-out";
    scoreCircle.style.strokeDashoffset = offset;

    // Change color based on score
    if (percentage < 40) {
      scoreCircle.style.stroke = "#ef4444"; // Red for low scores
    } else if (percentage < 70) {
      scoreCircle.style.stroke = "#f59e0b"; // Amber for medium scores
    } else {
      scoreCircle.style.stroke = "#10b981"; // Green for high scores
    }
  }, 300);

  // Set result message and icon based on score
  let message = "";
  let icon = "";

  if (percentage === 100) {
    message = "Excellent! You answered all questions correctly!";
    icon = "🏆";
    setTimeout(() => {
      window.quizModule.createFireworks();
      setTimeout(() => window.quizModule.createFireworks(), 500);
    }, 300);
  } else if (percentage >= 80) {
    message = "Very good! You did great!";
    icon = "🎉";
  } else if (percentage >= 60) {
    message = "Good job! You passed the test!";
    icon = "👍";
  } else if (percentage >= 40) {
    message = "You need to try harder!";
    icon = "📚";
  } else {
    message = "Don't give up! Practice makes perfect.";
    icon = "🔄";
  }

  document.getElementById("result-message").textContent = message;
  document.getElementById("result-icon").textContent = icon;

  // Display detailed results for each question
  const detailedResults = document.getElementById("detailed-results");
  detailedResults.innerHTML = "";

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index] || "Not selected";
    let isCorrect = false;
    let resultHtml = "";

    // Generate different result content based on question type
    if (question.type === "multiple-choice") {
      isCorrect = userAnswer === question.correctAnswer;

      resultHtml = `
        <p class="text-gray-700">
          <strong>Your answer:</strong>
          <span class="font-semibold px-2 py-1 rounded
            ${
              isCorrect
                ? "text-green-700 bg-green-100 border border-green-400"
                : "text-red-700 bg-red-100 border border-red-400"
            }">
            ${userAnswer}
          </span>
        </p>
        <p class="text-gray-700 mt-1">
          <strong>Correct answer:</strong>
          <span class="font-semibold text-blue-600">
            ${question.correctAnswer}
          </span>
        </p>
        <p class="text-gray-700 mt-1">
          <strong>Reason:</strong>
          <span class="text-gray-800 italic">
            ${question.reason}
          </span>
        </p>
      `;
    } else if (question.type === "drag-and-drop") {
      // For drag and drop, check if the sequence matches
      const correctSequence = question.correctSequence.map((num) => num - 1); // Convert to 0-based

      isCorrect = true;
      if (userAnswer && userAnswer.length === correctSequence.length) {
        for (let i = 0; i < userAnswer.length; i++) {
          if (userAnswer[i] !== correctSequence[i]) {
            isCorrect = false;
            break;
          }
        }
      } else {
        isCorrect = false;
      }

      resultHtml = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <p class="font-semibold text-gray-700 mb-2">Your sequence:</p>
            <ol class="list-decimal pl-5 space-y-1">
              ${
                userAnswer && userAnswer.length
                  ? userAnswer
                      .map(
                        (idx) =>
                          `<li class="p-1 bg-white rounded border ${
                            isCorrect ? "border-green-300" : "border-red-300"
                          }">${question.items[idx]}</li>`
                      )
                      .join("")
                  : '<li class="text-red-500">Not answered</li>'
              }
            </ol>
          </div>
          <div>
            <p class="font-semibold text-gray-700 mb-2">Correct sequence:</p>
            <ol class="list-decimal pl-5 space-y-1">
              ${correctSequence
                .map(
                  (idx) =>
                    `<li class="p-1 bg-white rounded border border-green-300">${question.items[idx]}</li>`
                )
                .join("")}
            </ol>
          </div>
        </div>
        <p class="text-gray-700 mt-3">
          <strong>Explanation:</strong>
          <span class="text-gray-800 italic">
            ${question.reason}
          </span>
        </p>
      `;
    } else if (question.type === "match-answer") {
      // For match answer, check if all matches are correct
      const correctMatches = question.matches;

      isCorrect = true;
      if (userAnswer && userAnswer.length === correctMatches.length) {
        // Create a map of correct matches for easy lookup
        const correctMap = {};
        correctMatches.forEach((match) => {
          correctMap[match.left] = match.right;
        });

        // Check each user match against correct matches
        for (const match of userAnswer) {
          if (correctMap[match.left] !== match.right) {
            isCorrect = false;
            break;
          }
        }
      } else {
        isCorrect = false;
      }

      resultHtml = `
        <div class="mt-2">
          <p class="font-semibold text-gray-700 mb-2">Your matches:</p>
          <ul class="space-y-1">
            ${
              userAnswer && userAnswer.length
                ? userAnswer
                    .map((match) => {
                      const isMatchCorrect = correctMatches.some(
                        (m) => m.left === match.left && m.right === match.right
                      );

                      const leftItem = question.columnA.find((item) =>
                        item.startsWith(match.left + ".")
                      );
                      const rightItem = question.columnB.find((item) =>
                        item.startsWith(match.right + ".")
                      );

                      return `
                <li class="p-1 bg-white rounded border ${
                  isMatchCorrect ? "border-green-300" : "border-red-300"
                } flex items-center">
                  <span class="font-semibold mr-1">${match.left}</span> ↔ 
                  <span class="font-semibold mx-1">${match.right}</span>: 
                  <span class="ml-1">${leftItem?.substring(3) || ""}</span> ↔ 
                  <span class="ml-1">${rightItem?.substring(3) || ""}</span>
                  ${
                    isMatchCorrect
                      ? '<span class="text-green-600 ml-2">✓</span>'
                      : '<span class="text-red-600 ml-2">✗</span>'
                  }
                </li>
              `;
                    })
                    .join("")
                : '<li class="text-red-500">Not answered</li>'
            }
          </ul>
          
          <p class="font-semibold text-gray-700 mt-3 mb-2">Correct matches:</p>
          <ul class="space-y-1">
            ${correctMatches
              .map((match) => {
                const leftItem = question.columnA.find((item) =>
                  item.startsWith(match.left + ".")
                );
                const rightItem = question.columnB.find((item) =>
                  item.startsWith(match.right + ".")
                );

                return `
                <li class="p-1 bg-white rounded border border-green-300 flex items-center">
                  <span class="font-semibold mr-1">${match.left}</span> ↔ 
                  <span class="font-semibold mx-1">${match.right}</span>: 
                  <span class="ml-1">${leftItem?.substring(3) || ""}</span> ↔ 
                  <span class="ml-1">${rightItem?.substring(3) || ""}</span>
                </li>
              `;
              })
              .join("")}
          </ul>
        </div>
        
        <div class="mt-3">
          <p class="font-semibold text-gray-700 mb-1">Explanations:</p>
          <ul class="text-gray-800 italic space-y-1">
            ${question.explanations.map((exp) => `<li>${exp}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    const questionHtml = `
      <div class="result-question bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
        <!-- Question header with status badge -->
        <div class="flex justify-between items-center p-4 border-b ${
          isCorrect
            ? "bg-green-50 border-green-100"
            : "bg-red-50 border-red-100"
        }">
          <h4 class="text-lg font-semibold text-gray-900 flex items-center">
            <span class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 mr-3 font-bold">
              ${index + 1}
            </span>
            ${question.question}
          </h4>
          <span class="px-3 py-1 rounded-full text-sm font-medium ${
            isCorrect
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          } flex items-center">
            ${
              isCorrect
                ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>Correct'
                : '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>Incorrect'
            }
          </span>
        </div>
        
        <!-- Question content -->
        <div class="p-4">
          ${resultHtml}
        </div>
      </div>
    `;

    detailedResults.innerHTML += questionHtml;
  });

  // Stop auto-save
  stopAutoSave();

  // Update quiz status in IndexedDB
  if (currentQuizId) {
    try {
      const quizData = await window.quizDB.getQuiz(currentQuizId);
      if (quizData) {
        quizData.status = "completed";
        quizData.endTime = Date.now();
        quizData.finalScore = currentScore;
        quizData.scorePercentage = percentage;

        await window.quizDB.saveQuiz(quizData);
        console.log("Quiz marked as completed");
      }
    } catch (error) {
      console.error("Failed to update quiz status:", error);
    }
  }
}

// Add event listener for beforeunload to warn about leaving with unsaved progress
window.addEventListener("beforeunload", (event) => {
  if (
    currentQuizId &&
    questions.length > 0 &&
    window.quizModule.getUserAnswers().some((answer) => answer !== null) &&
    !document.getElementById("results-section").classList.contains("hidden")
  ) {
    // Save progress one last time
    const quizData = {
      id: currentQuizId,
      userAnswers: window.quizModule.getUserAnswers(),
      currentQuestionIndex: window.quizModule.getCurrentQuestionIndex(),
      currentScore: window.quizModule.getCurrentScore(),
      lastSaved: Date.now(),
    };

    // Use synchronous storage to ensure it saves before page unload
    try {
      const transaction = window.quizDB.db.transaction(
        ["quizzes"],
        "readwrite"
      );
      const store = transaction.objectStore("quizzes");
      store.put(quizData);
    } catch (error) {
      console.error("Failed to save on exit:", error);
    }

    // Show confirmation dialog
    event.preventDefault();
    event.returnValue =
      "You have an unfinished quiz. Progress has been automatically saved and you can continue later.";
    return event.returnValue;
  }
});

// Go back to home page
function goHome() {
  console.log("goHome called");

  // Kiểm tra xem người dùng đang ở trong quá trình làm quiz hay không
  if (
    !document.getElementById("quiz-section").classList.contains("hidden") &&
    window.quizModule.getUserAnswers().some((answer) => answer !== null)
  ) {
    // Hiển thị thông báo xác nhận
    const confirmLeave = confirm(
      "Bạn có chắc chắn muốn quay lại trang chủ? Tiến trình làm bài sẽ được lưu lại, nhưng bạn sẽ phải bắt đầu lại từ đầu khi quay lại."
    );

    if (confirmLeave) {
      // Lưu tiến trình trước khi rời đi
      if (currentQuizId) {
        try {
          const quizData = {
            id: currentQuizId,
            userAnswers: window.quizModule.getUserAnswers(),
            currentQuestionIndex: window.quizModule.getCurrentQuestionIndex(),
            currentScore: window.quizModule.getCurrentScore(),
            lastSaved: Date.now(),
          };

          // Lưu vào IndexedDB
          window.quizDB.saveQuiz(quizData);
          console.log("Quiz progress saved before leaving");
        } catch (error) {
          console.error("Failed to save quiz progress:", error);
        }
      }

      // Chuyển hướng về trang chủ
      window.location.href = "./Home.html";
    }
  } else {
    // Nếu không đang làm quiz hoặc chưa trả lời câu hỏi nào, chuyển hướng trực tiếp
    window.location.href = "./Home.html";
  }
}

// Export functions to global scope for HTML onclick handlers
window.generateQuestions = generateQuestions;
window.resetQuiz = resetQuiz;
window.startQuiz = startQuiz;
window.showPreview = showPreview;
window.deleteQuestion = deleteQuestion;
window.replaceQuestion = replaceQuestion;
window.addNewQuestion = addNewQuestion;
window.finishQuiz = finishQuiz;
window.goHome = goHome;
