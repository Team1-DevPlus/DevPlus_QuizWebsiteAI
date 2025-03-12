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
    
    // Get current sort order
    const sortSelect = document.getElementById("sort");
    const sortOrder = sortSelect ? sortSelect.value : "date-desc";

    // Apply sorting to all quizzes
    switch (sortOrder) {
      case "date-desc":
        quizzes.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case "date-asc":
        quizzes.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case "score-desc":
        quizzes.sort((a, b) => {
          const scoreA = a.status === "completed" ? (a.scorePercentage || (a.finalScore / a.questionCount) * 100) : -1;
          const scoreB = b.status === "completed" ? (b.scorePercentage || (b.finalScore / b.questionCount) * 100) : -1;
          return scoreB - scoreA;
        });
        break;
      case "score-asc":
        quizzes.sort((a, b) => {
          const scoreA = a.status === "completed" ? (a.scorePercentage || (a.finalScore / a.questionCount) * 100) : 999;
          const scoreB = b.status === "completed" ? (b.scorePercentage || (b.finalScore / b.questionCount) * 100) : 999;
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
      '<p class="text-gray-400 font-arcade text-center py-4">No quizzes found</p>';
    return;
  }

  // Create list
  const list = document.createElement("ul");
  list.className = "";

  quizzes.forEach((quiz) => {
    const li = document.createElement("li");
    li.className = "p-3";

    // Calculate time spent
    const timeSpent = quiz.endTime
      ? formatTimeSpent(quiz.endTime - quiz.startTime)
      : formatTimeSpent(quiz.lastSaved ? quiz.lastSaved - quiz.startTime : 0);

    // Format date
    const date = new Date(quiz.timestamp);
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
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
      <li class="bg-white/50 rounded-lg overflow-hidden p-4">
  <div class="flex items-center justify-between">
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <p class="text-sm font-semibold text-primary-600 truncate text-dark font-arcade">
        ${quiz.topic}
      </p>
      <div class="flex items-center">
        ${
          quiz.status === "completed"
            ? `<span class="px-3 py-1 text-xs font-bold rounded-full text-dark font-arcade ${scoreBadgeClass}">
                ${Math.round(
                  quiz.scorePercentage ||
                    (quiz.finalScore / quiz.questionCount) * 100
                )}%
              </span>
              <span class="ml-2 text-xs text-gray-500 ">
                ${quiz.finalScore || quiz.currentScore}/${
                quiz.questionCount
              } correct
              </span>`
            : `<span class="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 text-dark font-arcade">
                In Progress
              </span>
              <span class="ml-2 text-xs text-gray-500">
                ${quiz.currentScore || 0}/${quiz.questionCount} correct
              </span>`
        }
      </div>
    </div>
    <div class="text-sm text-gray-500 text-right text-dark font-arcade">
      <time datetime="${date.toISOString()}" class="block font-medium">${formattedDate}</time>
      <span class="text-xs">${timeSpent}</span>
    </div>
  </div>

  <div class="mt-3 flex flex-col sm:flex-row sm:justify-between">
    <p class="flex items-center text-sm text-dark font-arcade">
      <span class="h-2 w-2 rounded-full bg-primary-500 mr-2 text-dark font-arcade"></span>
      ${quiz.questionCount} questions
    </p>

    <div class="mt-2 sm:mt-0 flex space-x-3">
      ${
        quiz.status === "incomplete"
          ? `<button class="retake-quiz text-xs px-3 py-1 rounded-lg bg-green-300 hover:bg-green-700  font-medium shadow-sm transition text-dark font-arcade"
              data-id="${quiz.id}" aria-label="Resume Quiz">
              Resume
            </button>
            <button class="delete-quiz text-xs px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 font-medium shadow-sm transition text-dark font-arcade"
              data-id="${quiz.id}" aria-label="Delete Quiz">
              Delete
            </button>`
          : `<button class="retake-quiz text-xs px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700  font-medium shadow-sm transition text-dark font-arcade"
              data-id="${quiz.id}" aria-label="Retake Quiz">
              Retake
            </button>
            <button class="delete-quiz text-xs px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700  font-medium shadow-sm transition text-dark font-arcade"
              data-id="${quiz.id}" aria-label="Delete Quiz">
              Delete
            </button>`
      }
    </div>
  </div>
</li>

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
  // Remove existing event listeners by cloning and replacing elements
  document.querySelectorAll(".resume-quiz, .retake-quiz, .delete-quiz").forEach(button => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
  });

  // Resume quiz buttons
  document.querySelectorAll(".resume-quiz").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const quizId = Number.parseInt(event.target.dataset.id);
      window.location.href = `../home/Home.html?id=${quizId}`;
    });
  });

  // Retake quiz buttons
  document.querySelectorAll(".retake-quiz").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const quizId = Number.parseInt(event.target.dataset.id);
      try {
        const quiz = await window.quizDB.getQuiz(quizId);
        if (quiz.status === "incomplete") {
          // If quiz is incomplete, just resume it
          window.location.href = `../home/Home.html?id=${quizId}`;
        } else {
          // If quiz is completed, create a new one
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
          window.location.href = `../home/Home.html?id=${newQuizId}`;
        }
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
  const dateRangeSelect = document.getElementById("date-range");
  const sortSelect = document.getElementById("sort");

  const applyFilters = async () => {
    const filters = {};

    // Apply date range filter
    if (dateRangeSelect && dateRangeSelect.value !== "all") {
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

    // Load quizzes with filters and current sort order
    await loadQuizHistory(filters);
  };

  // Add event listeners
  if (dateRangeSelect) dateRangeSelect.addEventListener("change", applyFilters);
  if (sortSelect) sortSelect.addEventListener("change", applyFilters);
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
  window.location.href = "../../index.html";
});
