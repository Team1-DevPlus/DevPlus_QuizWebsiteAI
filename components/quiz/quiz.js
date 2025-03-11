// Quiz module for handling quiz functionality
window.quizModule = (() => {
  let questions = [];
  let currentQuestionIndex = 0;
  let userAnswers = [];
  let currentScore = 0;

  // Initialize quiz with provided data
  function initQuiz(quizQuestions, answers, questionIndex, score) {
    questions = quizQuestions;
    userAnswers = answers || Array(questions.length).fill(null);
    currentQuestionIndex = questionIndex || 0;
    currentScore = score || 0;
  }

  // Reset quiz state
  function resetQuizState() {
    questions = [];
    currentQuestionIndex = 0;
    userAnswers = [];
    currentScore = 0;
  }

  // Display current question
  function displayCurrentQuestion() {
    const container = document.getElementById("question-container");
    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) return;

    document.getElementById("current-question").textContent =
      currentQuestionIndex + 1;

    const userAnswer = userAnswers[currentQuestionIndex];
    const showFeedback = userAnswer !== null;

    let questionHtml = `
          <div class="question-block">
              <h3>${currentQuestionIndex + 1}. ${currentQuestion.question}</h3>
              <div class="answer-options">
      `;

    currentQuestion.choices.forEach((choice, index) => {
      const optionLetter = choice[0]; // A, B, C, or D
      const isSelected = userAnswer === optionLetter;
      const isCorrect = currentQuestion.correctAnswer === optionLetter;

      let optionClass = "answer-option";
      let feedbackIcon = "";

      if (showFeedback) {
        if (isSelected) {
          optionClass += isCorrect ? " correct" : " incorrect";
          feedbackIcon = isCorrect
            ? '<span class="feedback-icon">✓</span>'
            : '<span class="feedback-icon">✗</span>';
        } else if (isCorrect) {
          optionClass += " correct";
          feedbackIcon = '<span class="feedback-icon">✓</span>';
        }
      } else if (isSelected) {
        optionClass += "selected";
      }

      questionHtml += `
              <div class="${optionClass}" onclick="window.quizModule.selectAnswer('${optionLetter}')">
                  <input type="radio" name="q${currentQuestionIndex}" value="${optionLetter}" ${
        isSelected ? "checked" : ""
      } ${showFeedback ? "disabled" : ""}>
                  <span>${choice}</span>
                  ${feedbackIcon}
              </div>
          `;
    });

    questionHtml += `
              </div>
          </div>
      `;

    container.innerHTML = questionHtml;
  }

  // Handle answer selection
  async function selectAnswer(answer) {
    // If already answered, don't allow changing
    if (userAnswers[currentQuestionIndex] !== null) return;

    userAnswers[currentQuestionIndex] = answer;

    // Check if answer is correct
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      currentScore++;
      document.getElementById("current-score").textContent = currentScore;

      // Add green background effect when correct
      changeBackgroundColor(true);

      // Fireworks effect when correct
      createFireworks();
    } else {
      // Add red background effect when incorrect
      changeBackgroundColor(false);
    }

    // Show feedback
    displayCurrentQuestion();

    // Enable navigation to next question
    updateNavigationButtons();

    // Save progress to IndexedDB immediately
    try {
      const quizId = window.currentQuizId; // Get current quiz ID from global scope
      if (quizId) {
        const quizData = await window.quizDB.getQuiz(quizId);
        if (quizData && quizData.status === "incomplete") {
          // Update with current state
          quizData.userAnswers = userAnswers;
          quizData.currentQuestionIndex = currentQuestionIndex;
          quizData.currentScore = currentScore;
          quizData.lastSaved = Date.now();

          await window.quizDB.saveQuiz(quizData);
          console.log("Answer saved to database");
        }
      }
    } catch (error) {
      console.error("Failed to save answer:", error);
    }
  }

  // Navigate to next question
  function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      resetBackgroundColor(); // Reset color when changing question
      displayCurrentQuestion();
      updateNavigationButtons();
    }
  }

  // Navigate to previous question
  function previousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      resetBackgroundColor(); // Reset color when changing question
      displayCurrentQuestion();
      updateNavigationButtons();
    }
  }

  // Update navigation buttons visibility
  function updateNavigationButtons() {
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const finishBtn = document.getElementById("finish-btn");

    // Show/hide previous button
    if (currentQuestionIndex > 0) {
      prevBtn.classList.remove("hidden");
    } else {
      prevBtn.classList.add("hidden");
    }

    // Show/hide next button
    if (currentQuestionIndex < questions.length - 1) {
      nextBtn.classList.remove("hidden");
      finishBtn.classList.add("hidden");
    } else {
      nextBtn.classList.add("hidden");

      // Only show finish button if all questions are answered
      const allAnswered = userAnswers.every((answer) => answer !== null);
      if (allAnswered) {
        finishBtn.classList.remove("hidden");
      } else {
        finishBtn.classList.add("hidden");
      }
    }
  }

  // Change background color based on answer correctness
  function changeBackgroundColor(isCorrect) {
    const quizCard = document.querySelector(".quiz-card");
    const questionContainer = document.getElementById("question-container");

    if (!quizCard || !questionContainer) {
      console.error("Quiz card or question container not found in the DOM.");
      return; // Stop execution if elements are missing
    }

    // Remove old color classes
    quizCard.classList.remove("correct-background", "incorrect-background");
    questionContainer.classList.remove(
      "correct-background",
      "incorrect-background"
    );

    // Add new color class
    if (isCorrect) {
      quizCard.classList.add("correct-background");
      questionContainer.classList.add("correct-background");

      // Gentle shake animation when correct
      quizCard.classList.add("correct-animation");
      setTimeout(() => {
        quizCard.classList.remove("correct-animation");
      }, 500);
    } else {
      quizCard.classList.add("incorrect-background");
      questionContainer.classList.add("incorrect-background");

      // Strong shake animation when incorrect
      quizCard.classList.add("incorrect-animation");
      setTimeout(() => {
        quizCard.classList.remove("incorrect-animation");
      }, 500);
    }

    // Auto reset color after 1.5 seconds
    setTimeout(() => {
      resetBackgroundColor();
    }, 1500);
  }

  // Reset background color to default
  function resetBackgroundColor() {
    const quizCard = document.querySelector(".quiz-card");
    const questionContainer = document.getElementById("question-container");

    // Check if elements exist before accessing their classList
    if (quizCard) {
      quizCard.classList.remove(
        "correct-background",
        "incorrect-background",
        "correct-animation",
        "incorrect-animation"
      );
    }

    if (questionContainer) {
      questionContainer.classList.remove(
        "correct-background",
        "incorrect-background"
      );
    }
  }

  // Create fireworks effect
  function createFireworks() {
    const fireworksContainer = document.createElement("div");
    fireworksContainer.className = "fireworks-container";
    document.body.appendChild(fireworksContainer);

    // Create multiple fireworks with different colors
    const colors = [
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#FFFF00",
      "#FF00FF",
      "#00FFFF",
      "#FFA500",
      "#800080",
    ];

    // Create 50 firework particles
    for (let i = 0; i < 100; i++) {
      createParticle(fireworksContainer, colors);
    }

    // Remove container after effect ends
    setTimeout(() => {
      fireworksContainer.remove();
    }, 3000);
  }

  // Create individual firework particle
  function createParticle(container, colors) {
    const particle = document.createElement("div");
    particle.className = "firework-particle";

    // Initial position (center of screen)
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;

    // Random color
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Random size
    const size = Math.random() * 8 + 4;

    // Random angle and distance
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 150 + 50;

    // Random speed
    const duration = Math.random() * 1 + 1;

    // Target position
    const destX = startX + Math.cos(angle) * distance;
    const destY = startY + Math.sin(angle) * distance;

    // Set style
    particle.style.backgroundColor = color;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.position = "fixed";
    particle.style.borderRadius = "50%";
    particle.style.zIndex = "9999";
    particle.style.opacity = "1";
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;

    container.appendChild(particle);

    // Animation
    setTimeout(() => {
      particle.style.transition = `all ${duration}s cubic-bezier(0.1, 0.5, 0.5, 1)`;
      particle.style.left = `${destX}px`;
      particle.style.top = `${destY}px`;
      particle.style.opacity = "0";
    }, 10);

    // Remove particle after animation ends
    setTimeout(() => {
      particle.remove();
    }, duration * 1000 + 100);
  }

  // Getters for quiz state
  function getUserAnswers() {
    return userAnswers;
  }

  function getCurrentQuestionIndex() {
    return currentQuestionIndex;
  }

  function getCurrentScore() {
    return currentScore;
  }

  // Public API
  return {
    initQuiz,
    resetQuizState,
    displayCurrentQuestion,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    updateNavigationButtons,
    changeBackgroundColor,
    resetBackgroundColor,
    createFireworks,
    getUserAnswers,
    getCurrentQuestionIndex,
    getCurrentScore,
  };
})();

// Export functions to global scope for HTML onclick handlers
window.nextQuestion = window.quizModule.nextQuestion;
window.previousQuestion = window.quizModule.previousQuestion;
