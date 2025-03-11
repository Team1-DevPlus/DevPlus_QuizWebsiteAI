// Initialize the database when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await window.quizDB.init();
    console.log("Database initialized in history page");

    // Load quiz history
    await loadQuizHistory();

    // Set up event listeners for filters
    setupFilterListeners();
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
});

// Load quiz history from IndexedDB
async function loadQuizHistory(filters = {}) {
  try {
    const quizzes = await window.quizDB.getQuizzes(filters);

    // Update stats
    updateStats(quizzes);

    // Separate quizzes by status
    const incompleteQuizzes = quizzes.filter(
      (quiz) => quiz.status === "incomplete"
    );
    const completedQuizzes = quizzes.filter(
      (quiz) => quiz.status === "completed"
    );

    // Render both lists
    renderQuizList("incomplete-list", incompleteQuizzes);
    renderQuizList("completed-list", completedQuizzes);

    console.log("Quiz history loaded");
  } catch (error) {
    console.error("Failed to load quiz history:", error);
    showErrorMessage("Failed to load quiz history. Please try again.");
  }
}

// Render a list of quizzes
function renderQuizList(containerId, quizzes) {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  // Clear existing content
  container.innerHTML = "";

  if (quizzes.length === 0) {
    container.innerHTML =
      '<p class="text-gray-500 text-center py-4">No quizzes found</p>';
    return;
  }

  // Create list
  const list = document.createElement("ul");
  list.className = "divide-y divide-gray-200";

  quizzes.forEach((quiz) => {
    const li = document.createElement("li");
    li.className = "hover:bg-gray-50";

    // Calculate time spent
    const timeSpent = quiz.endTime
      ? formatTimeSpent(quiz.endTime - quiz.startTime)
      : formatTimeSpent(quiz.lastSaved ? quiz.lastSaved - quiz.startTime : 0);

    // Format date
    const date = new Date(quiz.timestamp);
    const formattedDate = date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Calculate score badge class
    let scoreBadgeClass = "bg-yellow-100 text-yellow-800";
    if (quiz.status === "completed") {
      const percentage =
        quiz.scorePercentage || (quiz.finalScore / quiz.questionCount) * 100;
      if (percentage >= 80) {
        scoreBadgeClass = "bg-green-100 text-green-800";
      } else if (percentage < 60) {
        scoreBadgeClass = "bg-red-100 text-red-800";
      }
    }

    // Create quiz item HTML
    li.innerHTML = `
      <div class="px-4 py-4 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p class="text-sm font-medium text-primary-600 truncate">
              ${quiz.topic}
            </p>
            <div class="flex items-center">
              ${
                quiz.status === "completed"
                  ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${scoreBadgeClass}">
                  ${Math.round(
                    quiz.scorePercentage ||
                      (quiz.finalScore / quiz.questionCount) * 100
                  )}%
                </span>
                <span class="ml-2 text-xs text-gray-500">
                  ${quiz.finalScore || quiz.currentScore}/${
                      quiz.questionCount
                    } correct
                </span>`
                  : `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  In Progress
                </span>
                <span class="ml-2 text-xs text-gray-500">
                  ${quiz.currentScore || 0}/${quiz.questionCount} correct
                </span>`
              }
            </div>
          </div>
          <div class="flex flex-col items-end text-sm text-gray-500">
            <time datetime="${date.toISOString()}">${formattedDate}</time>
            <span>${timeSpent}</span>
          </div>
        </div>
        <div class="mt-2 sm:flex sm:justify-between">
          <div class="sm:flex">
            <p class="flex items-center text-sm text-gray-500">
              <span class="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-primary-500 mr-2"></span>
              ${quiz.questionCount} questions
            </p>
          </div>
          <div class="mt-2 sm:mt-0">
            ${
              quiz.status === "incomplete"
                ? `<div class="flex space-x-2">
                <button class="resume-quiz text-xs bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded"
                  data-id="${quiz.id}">Resume</button>
                <button class="delete-quiz text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                  data-id="${quiz.id}">Delete</button>
              </div>`
                : `<div class="flex space-x-2">
                <button class="retake-quiz text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                  data-id="${quiz.id}">Retake</button>
                <button class="delete-quiz text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                  data-id="${quiz.id}">Delete</button>
              </div>`
            }
          </div>
        </div>
      </div>
    `;

    list.appendChild(li);
  });

  container.appendChild(list);

  // Add event listeners to buttons
  addQuizActionListeners();
}

// Format time spent in minutes and seconds
function formatTimeSpent(milliseconds) {
  if (!milliseconds) return "0 min";

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds} sec`;
  } else if (remainingSeconds === 0) {
    return `${minutes} min`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")} min`;
  }
}

// Update statistics based on quiz data
function updateStats(quizzes) {
  const totalQuizzes = quizzes.length;
  const completedQuizzes = quizzes.filter(
    (quiz) => quiz.status === "completed"
  );

  // Calculate average score
  let averageScore = 0;
  if (completedQuizzes.length > 0) {
    const totalScore = completedQuizzes.reduce((sum, quiz) => {
      const percentage =
        quiz.scorePercentage || (quiz.finalScore / quiz.questionCount) * 100;
      return sum + percentage;
    }, 0);
    averageScore = Math.round(totalScore / completedQuizzes.length);
  }

  // Find best score
  let bestScore = 0;
  if (completedQuizzes.length > 0) {
    bestScore = Math.round(
      Math.max(
        ...completedQuizzes.map(
          (quiz) =>
            quiz.scorePercentage || (quiz.finalScore / quiz.questionCount) * 100
        )
      )
    );
  }

  // Update UI
  document.getElementById("total-quizzes").textContent = totalQuizzes;
  document.getElementById("average-score").textContent = `${averageScore}%`;
  document.getElementById("best-score").textContent = `${bestScore}%`;
}

// Add event listeners to quiz action buttons
function addQuizActionListeners() {
  // Resume quiz buttons
  document.querySelectorAll(".resume-quiz").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const quizId = Number.parseInt(event.target.dataset.id);
      window.location.href = `index.html?id=${quizId}`;
    });
  });

  // Retake quiz buttons
  document.querySelectorAll(".retake-quiz").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const quizId = Number.parseInt(event.target.dataset.id);
      try {
        const quiz = await window.quizDB.getQuiz(quizId);

        // Create a new quiz with the same topic and question count
        const newQuiz = {
          topic: quiz.topic,
          questionCount: quiz.questionCount,
          questions: quiz.questions,
          userAnswers: Array(quiz.questions.length).fill(null),
          currentQuestionIndex: 0,
          currentScore: 0,
          status: "incomplete",
          timestamp: Date.now(),
          startTime: Date.now(),
        };

        const newQuizId = await window.quizDB.saveQuiz(newQuiz);
        window.location.href = `index.html?id=${newQuizId}`;
      } catch (error) {
        console.error("Failed to retake quiz:", error);
        showErrorMessage("Failed to retake quiz. Please try again.");
      }
    });
  });

  // Delete quiz buttons
  document.querySelectorAll(".delete-quiz").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const quizId = Number.parseInt(event.target.dataset.id);
      if (confirm("Are you sure you want to delete this quiz?")) {
        try {
          await window.quizDB.deleteQuiz(quizId);
          // Reload quiz history
          await loadQuizHistory();
        } catch (error) {
          console.error("Failed to delete quiz:", error);
          showErrorMessage("Failed to delete quiz. Please try again.");
        }
      }
    });
  });
}

// Set up event listeners for filters
function setupFilterListeners() {
  const categorySelect = document.getElementById("category");
  const dateRangeSelect = document.getElementById("date-range");
  const sortSelect = document.getElementById("sort");

  const applyFilters = async () => {
    const filters = {};

    // Apply category filter
    if (categorySelect.value !== "all") {
      filters.topic = categorySelect.value;
    }

    // Apply date range filter
    if (dateRangeSelect.value !== "all") {
      const now = Date.now();
      let startTime;

      switch (dateRangeSelect.value) {
        case "week":
          startTime = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case "month":
          startTime = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case "year":
          startTime = now - 365 * 24 * 60 * 60 * 1000;
          break;
      }

      filters.startTime = startTime;
    }

    // Load quizzes with filters
    const quizzes = await window.quizDB.getQuizzes(filters);

    // Apply sorting
    switch (sortSelect.value) {
      case "date-desc":
        quizzes.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case "date-asc":
        quizzes.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case "score-desc":
        quizzes.sort((a, b) => {
          const scoreA =
            a.status === "completed"
              ? a.scorePercentage || (a.finalScore / a.questionCount) * 100
              : 0;
          const scoreB =
            b.status === "completed"
              ? b.scorePercentage || (b.finalScore / b.questionCount) * 100
              : 0;
          return scoreB - scoreA;
        });
        break;
      case "score-asc":
        quizzes.sort((a, b) => {
          const scoreA =
            a.status === "completed"
              ? a.scorePercentage || (a.finalScore / a.questionCount) * 100
              : 0;
          const scoreB =
            b.status === "completed"
              ? b.scorePercentage || (b.finalScore / b.questionCount) * 100
              : 0;
          return scoreA - scoreB;
        });
        break;
    }

    // Update stats
    updateStats(quizzes);

    // Separate quizzes by status
    const incompleteQuizzes = quizzes.filter(
      (quiz) => quiz.status === "incomplete"
    );
    const completedQuizzes = quizzes.filter(
      (quiz) => quiz.status === "completed"
    );

    // Render both lists
    renderQuizList("incomplete-list", incompleteQuizzes);
    renderQuizList("completed-list", completedQuizzes);
  };

  // Add event listeners
  categorySelect.addEventListener("change", applyFilters);
  dateRangeSelect.addEventListener("change", applyFilters);
  sortSelect.addEventListener("change", applyFilters);
}

// Show error message
function showErrorMessage(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className =
    "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg";
  errorDiv.textContent = message;

  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Add event listener for new quiz button
document.getElementById("new-quiz-btn")?.addEventListener("click", () => {
  window.location.href = "index.html";
});
