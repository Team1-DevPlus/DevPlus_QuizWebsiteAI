// Global variables to store quiz state
let questions = [];
let maxQuestions = 0;
let currentQuizId = null;
let autoSaveTimer = null;

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
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

---
Question: Which planet is known as the Red Planet?
A. Earth
B. Venus
C. Mars
D. Jupiter
Correct answer: C
Reason: Mars is called the Red Planet because of its reddish appearance due to iron oxide on its surface.

---

This ensures high-quality, structured, and **accurate multiple-choice questions** for your quiz system. 🚀
                `,
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

    questions = questionBlocks.map(parseQuestion).filter(Boolean);
  } catch (error) {
    console.error("Error calling API:", error);
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
    console.log("Quiz saved with ID:", currentQuizId);

    // Start auto-save timer
    startAutoSave();
  } catch (error) {
    console.error("Failed to save quiz:", error);
  }

  document.getElementById("setup-section").classList.add("hidden");
  document.getElementById("quiz-section").classList.remove("hidden");
  document.getElementById("total-questions").textContent = questions.length;
  document.getElementById("max-score").textContent = questions.length;
  document.getElementById("current-score").textContent = "0";

  // Save to localStorage as backup
  localStorage.setItem("questions", JSON.stringify(quizData));
  localStorage.setItem(
    "userAnswers",
    JSON.stringify(Array(questions.length).fill(null))
  );

  // Show preview
  showPreview();
}

// Parse question from API response
function parseQuestion(content) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
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

  return question && correctAnswer
    ? { question, choices, correctAnswer, reason }
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
  if (questions.length === 0) {
    alert("No questions available. Please create questions first!");
    return;
  }

  // Hide all sections first
  document.getElementById("setup-section").classList.add("hidden");
  document.getElementById("preview-section").classList.add("hidden");
  document.getElementById("results-section").classList.add("hidden");

  // Show only quiz section
  document.getElementById("quiz-section").classList.remove("hidden");

  // Initialize quiz module with fresh state
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
  window.quizModule.resetBackgroundColor();
  window.quizModule.displayCurrentQuestion();
  window.quizModule.updateNavigationButtons();
}

// Show preview of questions
function showPreview() {
  // Hide all sections first
  document.getElementById("setup-section").classList.add("hidden");
  document.getElementById("quiz-section").classList.add("hidden");
  document.getElementById("results-section").classList.add("hidden");

  // Show only preview section
  document.getElementById("preview-section").classList.remove("hidden");

  const previewContainer = document.getElementById("preview-container");
  previewContainer.innerHTML = "";

  questions.forEach((q, index) => {
    const questionHtml = `
<div class="preview-question p-5 bg-gray-100 shadow-lg rounded-xl border border-gray-300">
  <h3 class="text-lg font-semibold text-gray-800 mb-3">${index + 1}. ${
      q.question
    }</h3>

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
  if (questions.length >= maxQuestions) {
    addQuestionButton.style.display = "none";
  } else {
    addQuestionButton.style.display = "inline-block";
  }
}

// Delete question from list
function deleteQuestion(index) {
  questions.splice(index, 1);
  showPreview();
}
function tryAgain() {
  // Hide all sections first
  document.getElementById("setup-section").classList.add("hidden");
  document.getElementById("quiz-section").classList.add("hidden");
  document.getElementById("results-section").classList.add("hidden");

  // Show only preview section
  document.getElementById("preview-section").classList.remove("hidden");

  const previewContainer = document.getElementById("preview-container");
  previewContainer.innerHTML = "";

  questions.forEach((q, index) => {
    const questionHtml = `
      <div class="preview-question">
        <h3>${index + 1}. ${q.question}</h3>
        <ul>
          ${q.choices.map((choice, i) => `<li>${choice}</li>`).join("")}
        </ul>
        <div class="question-actions">
        </div>
      </div>
    `;
    previewContainer.innerHTML += questionHtml;
  });

  const addQuestionButton = document.querySelector(
    "#preview-section button[onclick='addNewQuestion()']"
  );
  if (questions.length >= maxQuestions) {
    addQuestionButton.style.display = "none";
  } else {
    addQuestionButton.style.display = "inline-block";
  }
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

  document.getElementById("final-score").textContent = currentScore;
  document.getElementById("final-max-score").textContent = questions.length;

  const percentage = (currentScore / questions.length) * 100;
  let message = "";

  if (percentage === 100) {
    message = "Excellent! You answered all questions correctly!";
    setTimeout(() => {
      window.quizModule.createFireworks();
      setTimeout(() => window.quizModule.createFireworks(), 500);
    }, 300);
  } else if (percentage >= 80) {
    message = "Very good! You did great!";
  } else if (percentage >= 60) {
    message = "Good job! You passed the test!";
  } else if (percentage >= 40) {
    message = "You need to try harder!";
  } else {
    message = "Keep studying and try again!";
  }

  document.getElementById("result-message").textContent = message;

  // Display detailed results for each question
  const detailedResults = document.getElementById("detailed-results");
  detailedResults.innerHTML = "";

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index] || "Not selected";
    const isCorrect = userAnswer === question.correctAnswer;
    const resultClass = isCorrect ? "correct-answer" : "incorrect-answer";

    const questionHtml = `
<div class="result-question p-4  rounded-lg shadow-lg border mb-4">
  <h4 class="text-lg font-semibold text-gray-900 mb-2">
    ${index + 1}. ${question.question}
  </h4>
  <p class="text-gray-700">
    <strong>Your answer:</strong>
    <span class="font-semibold px-2 py-1 rounded
      ${
        resultClass === "correct"
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

  // Add a button to view history
  // const resultsSection = document.getElementById("results-section")
  // if (!document.getElementById("view-history-btn")) {
  //   const historyBtn = document.createElement("button")
  //   historyBtn.id = "view-history-btn"
  //   historyBtn.className = "btn btn-secondary"
  //   historyBtn.textContent = "View History"
  //   historyBtn.onclick = () => (window.location.href = "history.html")

  //   // Insert before the "Try Again" button
  //   const resetBtn = document.querySelector("#results-section button.btn-primary")
  //   resultsSection.insertBefore(historyBtn, resetBtn)
  // }
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

// Export functions to global scope for HTML onclick handlers
window.generateQuestions = generateQuestions;
window.resetQuiz = resetQuiz;
window.startQuiz = startQuiz;
window.showPreview = showPreview;
window.deleteQuestion = deleteQuestion;
window.replaceQuestion = replaceQuestion;
window.addNewQuestion = addNewQuestion;
window.finishQuiz = finishQuiz;
