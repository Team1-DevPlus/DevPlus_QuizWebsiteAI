//Đag ở bản gốc chưa link gì cả, ae chỉnh sửa xong link vào script ở index.html
let currentQuestionIndex = 0;
let userAnswers = [];
let currentScore = 0;
let isCorrect = null;

const resultSection = document.getElementById("result-section");

document.addEventListener("DOMContentLoaded", () => {
  const questions = JSON.parse(localStorage.getItem("questions"));
  const userAnswers = JSON.parse(localStorage.getItem("userAnswers"));
  //DOM
  const quizSection = document.getElementById("quiz-section");
  const questionContainer = document.getElementById("question-container");
  const totalQuestionsEl = document.getElementById("total-questions");
  const currentScoreEl = document.getElementById("current-score");
  const maxScoreEl = document.getElementById("max-score");
  const prevButton = document.getElementById("prev-button");
  const nextButton = document.getElementById("next-button");
  const finishButton = document.getElementById("finish-button");
  const finalScoreEl = document.getElementById("final-score");
  const finalMaxScoreEl = document.getElementById("final-max-score");
  const resultMessageEl = document.getElementById("result-message");
  const detailedResultsEl = document.getElementById("detailed-results");
  // Event Listeners
  prevButton.addEventListener("click", previousQuestion);
  nextButton.addEventListener("click", nextQuestion);
  finishButton.addEventListener("click", finishQuiz);

  // Initialize quiz UI
  totalQuestionsEl.textContent = questions.length;
  maxScoreEl.textContent = questions.length;
  currentScoreEl.textContent = currentScore;

  displayCurrentQuestion();
  updateNavigationButtons();
  // Hàm hiển thị câu hỏi hiện tại
  function displayCurrentQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    questionContainer.innerHTML = `
        <p><strong>Câu ${currentQuestionIndex + 1}:</strong> ${
      currentQuestion.question
    }</p>
        <ul>
            ${currentQuestion.choices
              .map((choice) => `<li>${choice}</li>`)
              .join("")}
        </ul>
    `;

    const userAnswer = userAnswers[currentQuestionIndex];
    const showFeedback = userAnswer !== null;

    let questionHtml = `
    <h3 class="text-white font-medium mb-4">${currentQuestionIndex + 1}. ${
      currentQuestion.question
    }</h3>
    <div class="space-y-2">
  `;

    if (currentQuestion.type === "single") {
      // Single choice question
      currentQuestion.choices.forEach((choice) => {
        const optionLetter = choice[0]; // A, B, C, or D
        const isSelected = userAnswer === optionLetter;
        const isCorrect = currentQuestion.correctAnswer === optionLetter;

        let optionClass =
          "flex items-center p-6 rounded-md cursor-pointer transition-all";

        if (showFeedback) {
          if (isSelected && isCorrect) {
            optionClass += " answer-option correct disabled";
          } else if (isSelected && !isCorrect) {
            optionClass += " answer-option incorrect disabled";
          } else if (isCorrect) {
            optionClass += " answer-option correct disabled";
          } else {
            optionClass +=
              " answer-option disabled bg-white/10 border-2 border-transparent";
          }
        } else {
          optionClass += isSelected
            ? " answer-option selected bg-blue-500/50 border-2 border-blue-400"
            : " answer-option bg-white/10 hover:bg-white/20 border-2 border-transparent";
        }

        questionHtml += `
        <div class="${optionClass}" data-option="${optionLetter}" data-type="single">
          <input
            type="radio"
            name="question-${currentQuestionIndex}"
            class="mr-3 accent-yellow-400 w-4 h-4"
            ${isSelected ? "checked" : ""}
            ${showFeedback ? "disabled" : ""}
          >
          <span class="text-white">${choice}</span>

          ${
            showFeedback
              ? `
            <span class="ml-auto">
              ${isSelected && isCorrect ? "✓" : ""}
              ${isSelected && !isCorrect ? "✗" : ""}
              ${!isSelected && isCorrect ? "✓" : ""}
            </span>
          `
              : ""
          }
        </div>
      `;
      });

      if (showFeedback) {
        questionHtml += `
        <div class="mt-4 p-3 bg-white/10 rounded-md">
          <p class="text-white font-bold">Giải thích:</p>
          <p class="text-white">${currentQuestion.reason}</p>
        </div>
      `;
      }
    } else if (currentQuestion.type === "multiple") {
      // Multiple choice question
      const correctAnswers = currentQuestion.correctAnswer
        .split(",")
        .map((a) => a.trim());

      currentQuestion.choices.forEach((choice) => {
        const optionLetter = choice[0]; // A, B, C, or D
        const isSelected = Array.isArray(userAnswer)
          ? userAnswer.includes(optionLetter)
          : false;
        const isCorrect = correctAnswers.includes(optionLetter);

        let optionClass =
          "flex items-center p-3 rounded-md cursor-pointer transition-all";

        if (showFeedback) {
          if (isSelected && isCorrect) {
            optionClass += " answer-option correct disabled";
          } else if (isSelected && !isCorrect) {
            optionClass += " answer-option incorrect disabled";
          } else if (isCorrect) {
            optionClass += " answer-option correct disabled";
          } else {
            optionClass +=
              " answer-option disabled bg-white/10 border-2 border-transparent";
          }
        } else {
          optionClass += isSelected
            ? " answer-option selected bg-blue-500/50 border-2 border-blue-400"
            : " answer-option bg-white/10 hover:bg-white/20 border-2 border-transparent";
        }

        questionHtml += `
        <div class="${optionClass}" data-option="${optionLetter}" data-type="multiple">
          <input
            type="checkbox"
            name="question-${currentQuestionIndex}"
            class="mr-3 accent-yellow-400 w-4 h-4"
            ${isSelected ? "checked" : ""}
            ${showFeedback ? "disabled" : ""}
          >
          <span class="text-white">${choice}</span>

          ${
            showFeedback
              ? `
            <span class="ml-auto">
              ${isSelected && isCorrect ? "✓" : ""}
              ${isSelected && !isCorrect ? "✗" : ""}
              ${!isSelected && isCorrect ? "✓" : ""}
            </span>
          `
              : ""
          }
        </div>
      `;
      });

      if (!showFeedback) {
        questionHtml += `
        <button
          id="submit-multiple"
          class="w-full mt-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-arcade rounded-md border-b-4 border-blue-700 transition-all transform hover:scale-102 active:scale-98 active:translate-y-1"
        >
          SUBMIT ANSWER
        </button>
      `;
      }

      if (showFeedback) {
        questionHtml += `
        <div class="mt-4 p-3 bg-white/10 rounded-md">
          <p class="text-white font-bold">Giải thích:</p>
          <p class="text-white">${currentQuestion.reason}</p>
        </div>
      `;
      }
    } else if (currentQuestion.type === "text") {
      // Text answer question
      let textareaClass =
        "w-full p-3 rounded-md bg-white/10 text-white border-2";

      if (showFeedback) {
        // Check for approximate match
        const userAnswerLower = String(userAnswer).toLowerCase().trim();
        const correctAnswerLower = currentQuestion.correctAnswer
          .toLowerCase()
          .trim();

        const isCorrect =
          userAnswerLower === correctAnswerLower ||
          correctAnswerLower.includes(userAnswerLower) ||
          userAnswerLower.includes(correctAnswerLower);

        textareaClass += isCorrect ? " border-green-400" : " border-red-400";
      } else {
        textareaClass += " border-blue-400";
      }

      questionHtml += `
      <textarea
        id="text-answer"
        class="${textareaClass}"
        rows="4"
        placeholder="Nhập câu trả lời của bạn..."
        ${showFeedback ? `value="${userAnswer}" disabled` : ""}
      ></textarea>

      ${
        !showFeedback
          ? `
        <button
          id="submit-text"
          class="w-full mt-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-arcade rounded-md border-b-4 border-blue-700 transition-all transform hover:scale-102 active:scale-98 active:translate-y-1"
        >
          SUBMIT ANSWER
        </button>
      `
          : ""
      }

      ${
        showFeedback
          ? `
        <div class="mt-4 p-3 bg-white/10 rounded-md">
          <p class="text-white font-bold">Đáp án mẫu:</p>
          <p class="text-white">${currentQuestion.correctAnswer}</p>
          <p class="text-white font-bold mt-2">Giải thích:</p>
          <p class="text-white">${currentQuestion.reason}</p>
        </div>
      `
          : ""
      }
    `;
    }

    questionHtml += `
    </div>
  `;

    questionContainer.innerHTML = questionHtml;

    // Add event listeners to answer options
    const answerOptions = document.querySelectorAll(".answer-option");
    answerOptions.forEach((option) => {
      if (!option.classList.contains("disabled")) {
        option.addEventListener("click", handleAnswerSelection);
      }
    });

    // Add event listeners to submit buttons
    const submitMultipleBtn = document.getElementById("submit-multiple");
    if (submitMultipleBtn) {
      submitMultipleBtn.addEventListener("click", submitMultipleChoiceAnswer);
    }

    const submitTextBtn = document.getElementById("submit-text");
    if (submitTextBtn) {
      submitTextBtn.addEventListener("click", submitTextAnswer);
    }

    // Apply correct/incorrect background if needed
    if (isCorrect === true) {
      questionContainer.classList.add("correct-bg");
      questionContainer.classList.remove("incorrect-bg");
    } else if (isCorrect === false) {
      questionContainer.classList.add("incorrect-bg");
      questionContainer.classList.remove("correct-bg");
    } else {
      questionContainer.classList.remove("correct-bg", "incorrect-bg");
    }
  }
  function displayCurrentQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    questionContainer.innerHTML = `
        <p><strong>Câu ${currentQuestionIndex + 1}:</strong> ${
      currentQuestion.question
    }</p>
        <ul>
            ${currentQuestion.choices
              .map((choice) => `<li>${choice}</li>`)
              .join("")}
        </ul>
    `;

    const userAnswer = userAnswers[currentQuestionIndex];
    const showFeedback = userAnswer !== null;

    let questionHtml = `
    <h3 class="text-white font-medium mb-4">${currentQuestionIndex + 1}. ${
      currentQuestion.question
    }</h3>
    <div class="space-y-2">
  `;

    if (currentQuestion.type === "single") {
      // Single choice question
      currentQuestion.choices.forEach((choice) => {
        const optionLetter = choice[0]; // A, B, C, or D
        const isSelected = userAnswer === optionLetter;
        const isCorrect = currentQuestion.correctAnswer === optionLetter;

        let optionClass =
          "flex items-center p-6 rounded-md cursor-pointer transition-all";

        if (showFeedback) {
          if (isSelected && isCorrect) {
            optionClass += " answer-option correct disabled";
          } else if (isSelected && !isCorrect) {
            optionClass += " answer-option incorrect disabled";
          } else if (isCorrect) {
            optionClass += " answer-option correct disabled";
          } else {
            optionClass +=
              " answer-option disabled bg-white/10 border-2 border-transparent";
          }
        } else {
          optionClass += isSelected
            ? " answer-option selected bg-blue-500/50 border-2 border-blue-400"
            : " answer-option bg-white/10 hover:bg-white/20 border-2 border-transparent";
        }

        questionHtml += `
        <div class="${optionClass}" data-option="${optionLetter}" data-type="single">
          <input
            type="radio"
            name="question-${currentQuestionIndex}"
            class="mr-3 accent-yellow-400 w-4 h-4"
            ${isSelected ? "checked" : ""}
            ${showFeedback ? "disabled" : ""}
          >
          <span class="text-white">${choice}</span>

          ${
            showFeedback
              ? `
            <span class="ml-auto">
              ${isSelected && isCorrect ? "✓" : ""}
              ${isSelected && !isCorrect ? "✗" : ""}
              ${!isSelected && isCorrect ? "✓" : ""}
            </span>
          `
              : ""
          }
        </div>
      `;
      });

      if (showFeedback) {
        questionHtml += `
        <div class="mt-4 p-3 bg-white/10 rounded-md">
          <p class="text-white font-bold">Giải thích:</p>
          <p class="text-white">${currentQuestion.reason}</p>
        </div>
      `;
      }
    } else if (currentQuestion.type === "multiple") {
      // Multiple choice question
      const correctAnswers = currentQuestion.correctAnswer
        .split(",")
        .map((a) => a.trim());

      currentQuestion.choices.forEach((choice) => {
        const optionLetter = choice[0]; // A, B, C, or D
        const isSelected = Array.isArray(userAnswer)
          ? userAnswer.includes(optionLetter)
          : false;
        const isCorrect = correctAnswers.includes(optionLetter);

        let optionClass =
          "flex items-center p-3 rounded-md cursor-pointer transition-all";

        if (showFeedback) {
          if (isSelected && isCorrect) {
            optionClass += " answer-option correct disabled";
          } else if (isSelected && !isCorrect) {
            optionClass += " answer-option incorrect disabled";
          } else if (isCorrect) {
            optionClass += " answer-option correct disabled";
          } else {
            optionClass +=
              " answer-option disabled bg-white/10 border-2 border-transparent";
          }
        } else {
          optionClass += isSelected
            ? " answer-option selected bg-blue-500/50 border-2 border-blue-400"
            : " answer-option bg-white/10 hover:bg-white/20 border-2 border-transparent";
        }

        questionHtml += `
        <div class="${optionClass}" data-option="${optionLetter}" data-type="multiple">
          <input
            type="checkbox"
            name="question-${currentQuestionIndex}"
            class="mr-3 accent-yellow-400 w-4 h-4"
            ${isSelected ? "checked" : ""}
            ${showFeedback ? "disabled" : ""}
          >
          <span class="text-white">${choice}</span>

          ${
            showFeedback
              ? `
            <span class="ml-auto">
              ${isSelected && isCorrect ? "✓" : ""}
              ${isSelected && !isCorrect ? "✗" : ""}
              ${!isSelected && isCorrect ? "✓" : ""}
            </span>
          `
              : ""
          }
        </div>
      `;
      });

      if (!showFeedback) {
        questionHtml += `
        <button
          id="submit-multiple"
          class="w-full mt-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-arcade rounded-md border-b-4 border-blue-700 transition-all transform hover:scale-102 active:scale-98 active:translate-y-1"
        >
          SUBMIT ANSWER
        </button>
      `;
      }

      if (showFeedback) {
        questionHtml += `
        <div class="mt-4 p-3 bg-white/10 rounded-md">
          <p class="text-white font-bold">Giải thích:</p>
          <p class="text-white">${currentQuestion.reason}</p>
        </div>
      `;
      }
    } else if (currentQuestion.type === "text") {
      // Text answer question
      let textareaClass =
        "w-full p-3 rounded-md bg-white/10 text-white border-2";

      if (showFeedback) {
        // Check for approximate match
        const userAnswerLower = String(userAnswer).toLowerCase().trim();
        const correctAnswerLower = currentQuestion.correctAnswer
          .toLowerCase()
          .trim();

        const isCorrect =
          userAnswerLower === correctAnswerLower ||
          correctAnswerLower.includes(userAnswerLower) ||
          userAnswerLower.includes(correctAnswerLower);

        textareaClass += isCorrect ? " border-green-400" : " border-red-400";
      } else {
        textareaClass += " border-blue-400";
      }

      questionHtml += `
      <textarea
        id="text-answer"
        class="${textareaClass}"
        rows="4"
        placeholder="Nhập câu trả lời của bạn..."
        ${showFeedback ? `value="${userAnswer}" disabled` : ""}
      ></textarea>

      ${
        !showFeedback
          ? `
        <button
          id="submit-text"
          class="w-full mt-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-arcade rounded-md border-b-4 border-blue-700 transition-all transform hover:scale-102 active:scale-98 active:translate-y-1"
        >
          SUBMIT ANSWER
        </button>
      `
          : ""
      }

      ${
        showFeedback
          ? `
        <div class="mt-4 p-3 bg-white/10 rounded-md">
          <p class="text-white font-bold">Đáp án mẫu:</p>
          <p class="text-white">${currentQuestion.correctAnswer}</p>
          <p class="text-white font-bold mt-2">Giải thích:</p>
          <p class="text-white">${currentQuestion.reason}</p>
        </div>
      `
          : ""
      }
    `;
    }

    questionHtml += `
    </div>
  `;

    questionContainer.innerHTML = questionHtml;

    // Add event listeners to answer options
    const answerOptions = document.querySelectorAll(".answer-option");
    answerOptions.forEach((option) => {
      if (!option.classList.contains("disabled")) {
        option.addEventListener("click", handleAnswerSelection);
      }
    });

    // Add event listeners to submit buttons
    const submitMultipleBtn = document.getElementById("submit-multiple");
    if (submitMultipleBtn) {
      submitMultipleBtn.addEventListener("click", submitMultipleChoiceAnswer);
    }

    const submitTextBtn = document.getElementById("submit-text");
    if (submitTextBtn) {
      submitTextBtn.addEventListener("click", submitTextAnswer);
    }

    // Apply correct/incorrect background if needed
    if (isCorrect === true) {
      questionContainer.classList.add("correct-bg");
      questionContainer.classList.remove("incorrect-bg");
    } else if (isCorrect === false) {
      questionContainer.classList.add("incorrect-bg");
      questionContainer.classList.remove("correct-bg");
    } else {
      questionContainer.classList.remove("correct-bg", "incorrect-bg");
    }
  }

  // Handle answer selection
  function handleAnswerSelection(e) {
    const option = e.currentTarget;
    const optionLetter = option.dataset.option;
    const type = option.dataset.type;

    if (type === "single") {
      handleSingleChoiceSelect(optionLetter);
    } else if (type === "multiple") {
      handleMultipleChoiceSelect(option);
    }
  }

  // Handle single choice selection
  function handleSingleChoiceSelect(optionLetter) {
    // If already answered, don't allow changing
    if (userAnswers[currentQuestionIndex] !== null) return;

    userAnswers[currentQuestionIndex] = optionLetter;

    // Check if answer is correct
    const currentQuestion = questions[currentQuestionIndex];
    const isAnswerCorrect = optionLetter === currentQuestion.correctAnswer;

    if (isAnswerCorrect) {
      currentScore++;
      currentScoreEl.textContent = currentScore;
      isCorrect = true;
    } else {
      isCorrect = false;
    }

    // Show feedback
    displayCurrentQuestion();

    // Enable navigation to next question
    nextButton.disabled = false;
    nextButton.classList.remove("opacity-50", "cursor-not-allowed");

    // Reset the correct/incorrect state after a delay
    setTimeout(() => {
      isCorrect = null;
      displayCurrentQuestion();
    }, 1500);

    updateNavigationButtons();
  }

  // Handle multiple choice selection
  function handleMultipleChoiceSelect(option) {
    // If already answered, don't allow changing
    if (userAnswers[currentQuestionIndex] !== null) return;

    const optionLetter = option.dataset.option;
    const checkbox = option.querySelector('input[type="checkbox"]');

    // Toggle checkbox
    checkbox.checked = !checkbox.checked;

    // Toggle selected class
    if (checkbox.checked) {
      option.classList.add("selected");
    } else {
      option.classList.remove("selected");
    }
  }

  // Submit multiple choice answer
  function submitMultipleChoiceAnswer() {
    const selectedOptions = [];
    const checkboxes = document.querySelectorAll(
      'input[type="checkbox"]:checked'
    );

    checkboxes.forEach((checkbox) => {
      const option = checkbox.closest(".answer-option");
      if (option) {
        selectedOptions.push(option.dataset.option);
      }
    });

    if (selectedOptions.length === 0) return;

    userAnswers[currentQuestionIndex] = selectedOptions;

    // Check if answer is correct
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswers = currentQuestion.correctAnswer
      .split(",")
      .map((a) => a.trim());

    // Check if all selected answers are correct and all correct answers are selected
    const allCorrectSelected = correctAnswers.every((a) =>
      selectedOptions.includes(a)
    );
    const noIncorrectSelected = selectedOptions.every((a) =>
      correctAnswers.includes(a)
    );
    const isAnswerCorrect = allCorrectSelected && noIncorrectSelected;

    if (isAnswerCorrect) {
      currentScore++;
      currentScoreEl.textContent = currentScore;
      isCorrect = true;
    } else {
      isCorrect = false;
    }

    // Show feedback
    displayCurrentQuestion();

    // Enable navigation to next question
    nextButton.disabled = false;
    nextButton.classList.remove("opacity-50", "cursor-not-allowed");

    // Reset the correct/incorrect state after a delay
    setTimeout(() => {
      isCorrect = null;
      displayCurrentQuestion();
    }, 1500);

    updateNavigationButtons();
  }

  // Submit text answer
  function submitTextAnswer() {
    const textAnswer = document.getElementById("text-answer").value.trim();

    if (textAnswer.length === 0) return;

    userAnswers[currentQuestionIndex] = textAnswer;

    // Check if answer is correct (approximate match)
    const currentQuestion = questions[currentQuestionIndex];
    const userAnswerLower = textAnswer.toLowerCase();
    const correctAnswerLower = currentQuestion.correctAnswer.toLowerCase();

    const isAnswerCorrect =
      userAnswerLower === correctAnswerLower ||
      correctAnswerLower.includes(userAnswerLower) ||
      userAnswerLower.includes(correctAnswerLower);

    if (isAnswerCorrect) {
      currentScore++;
      currentScoreEl.textContent = currentScore;
      isCorrect = true;
    } else {
      isCorrect = false;
    }

    // Show feedback
    displayCurrentQuestion();

    // Enable navigation to next question
    nextButton.disabled = false;
    nextButton.classList.remove("opacity-50", "cursor-not-allowed");

    // Reset the correct/incorrect state after a delay
    setTimeout(() => {
      isCorrect = null;
      displayCurrentQuestion();
    }, 1500);

    updateNavigationButtons();
  }

  // Navigate to next question
  function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      displayCurrentQuestion();
      updateNavigationButtons();
    }
  }

  // Navigate to previous question
  function previousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      displayCurrentQuestion();
      updateNavigationButtons();
    }
  }

  // Update navigation buttons visibility
  function updateNavigationButtons() {
    // Show/hide previous button
    if (currentQuestionIndex > 0) {
      prevButton.classList.remove("hidden");
    } else {
      prevButton.classList.add("hidden");
    }

    // Show/hide next and finish buttons
    if (currentQuestionIndex < questions.length - 1) {
      nextButton.classList.remove("hidden");
      finishButton.classList.add("hidden");
    } else {
      nextButton.classList.add("hidden");

      // Only show finish button if all questions are answered
      const allAnswered = userAnswers.every((answer) => answer !== null);
      if (allAnswered) {
        finishButton.classList.remove(
          "hidden",
          "opacity-50",
          "cursor-not-allowed"
        );
        finishButton.disabled = false;
      } else {
        finishButton.classList.remove("hidden");
        finishButton.classList.add("opacity-50", "cursor-not-allowed");
        finishButton.disabled = true;
      }
    }
  }

  function finishQuiz() {
    // Ẩn phần quiz
    quizSection.classList.add("hidden");

    // Hiển thị phần kết quả
    resultSection.classList.remove("hidden");

    // Hiển thị điểm số
    finalScoreEl.textContent = currentScore;
    finalMaxScoreEl.textContent = questions.length;

    // Hiển thị thông báo kết quả
    const percentage = (currentScore / questions.length) * 100;
    let message = "";

    if (percentage === 100) {
      message = "PERFECT SCORE! YOU'RE A CHAMPION!";
    } else if (percentage >= 80) {
      message = "GREAT JOB! YOU'VE LEVELED UP!";
    } else if (percentage >= 60) {
      message = "GOOD EFFORT! KEEP PRACTICING!";
    } else if (percentage >= 40) {
      message = "NOT BAD! TRY AGAIN FOR A HIGHER SCORE!";
    } else {
      message = "GAME OVER! PRACTICE MORE AND TRY AGAIN!";
    }

    resultMessageEl.textContent = message;

    // Hiển thị chi tiết kết quả
    detailedResultsEl.innerHTML = "";

    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      let isCorrect = false;
      let userAnswerDisplay = "";
      let correctAnswerDisplay = "";

      if (question.type === "single") {
        isCorrect = userAnswer === question.correctAnswer;

        // Find the text of the user's answer
        if (userAnswer) {
          const userOption = question.choices.find((choice) =>
            choice.startsWith(userAnswer)
          );
          userAnswerDisplay = userOption || String(userAnswer);
        } else {
          userAnswerDisplay = "Chưa trả lời";
        }

        // Find the text of the correct answer
        const correctOption = question.choices.find((choice) =>
          choice.startsWith(question.correctAnswer)
        );
        correctAnswerDisplay = correctOption || question.correctAnswer;
      } else if (question.type === "multiple") {
        const correctAnswers = question.correctAnswer
          .split(",")
          .map((a) => a.trim());

        if (Array.isArray(userAnswer)) {
          isCorrect =
            correctAnswers.length === userAnswer.length &&
            correctAnswers.every((a) => userAnswer.includes(a)) &&
            userAnswer.every((a) => correctAnswers.includes(a));

          // Find the text of the user's answers
          userAnswerDisplay = userAnswer
            .map((ans) => {
              const option = question.choices.find((choice) =>
                choice.startsWith(ans)
              );
              return option || ans;
            })
            .join(", ");
        } else {
          userAnswerDisplay = "Chưa trả lời";
        }

        // Find the text of the correct answers
        correctAnswerDisplay = correctAnswers
          .map((ans) => {
            const option = question.choices.find((choice) =>
              choice.startsWith(ans)
            );
            return option || ans;
          })
          .join(", ");
      } else if (question.type === "text") {
        // Check for approximate match
        const userAnswerLower = String(userAnswer).toLowerCase().trim();
        const correctAnswerLower = question.correctAnswer.toLowerCase().trim();

        isCorrect =
          userAnswerLower === correctAnswerLower ||
          correctAnswerLower.includes(userAnswerLower) ||
          userAnswerLower.includes(correctAnswerLower);

        userAnswerDisplay = String(userAnswer || "Chưa trả lời");
        correctAnswerDisplay = question.correctAnswer;
      }

      const resultHtml = `
      <div class="p-3 bg-white/10 rounded-md">
        <h4 class="font-medium text-white">${index + 1}. ${
        question.question
      }</h4>
        <div class="mt-2 space-y-1 text-sm">
          <p>
            <span class="text-gray-300">Đáp án của bạn: </span>
            <span class="${isCorrect ? "text-green-400" : "text-red-400"}">
              ${userAnswerDisplay}
            </span>
          </p>
          <p>
            <span class="text-gray-300">Đáp án đúng: </span>
            <span class="text-green-400">${correctAnswerDisplay}</span>
          </p>
        </div>
      </div>
    `;

      detailedResultsEl.innerHTML += resultHtml;
    });

    // Lưu kết quả vào localStorage
    localStorage.setItem("currentScore", currentScore);
    localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
  }

  // Event Listener cho nút "Chơi lại"
  const playAgainButton = document.getElementById("play-again-button");
  playAgainButton.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html"; // Hoặc trang bạn muốn chuyển đến để chơi lại
  });
});
