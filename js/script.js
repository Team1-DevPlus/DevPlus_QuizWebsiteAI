// Global variables to store quiz state
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let currentScore = 0;

async function generateQuestions() {
  const topic = document.getElementById("topic").value;
  const count = Number.parseInt(
    document.getElementById("question-count").value
  );

  if (!topic || isNaN(count) || count < 1 || count > 10) {
    alert("Vui lòng nhập chủ đề và số câu hỏi hợp lệ (1-10)!");
    return;
  }

  // Hiển thị loading
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
                text: `Tạo ${count} câu hỏi trắc nghiệm khác nhau về chủ đề: ${topic}.
                Mỗi câu hỏi có 4 phương án trả lời (A, B, C, D), trong đó chỉ có 1 đáp án đúng.
                Trả về mỗi câu hỏi theo định dạng sau và phân tách bằng "---":
                Câu hỏi: <câu hỏi>
                A. <đáp án A>
                B. <đáp án B>
                C. <đáp án C>
                D. <đáp án D>
                Đáp án đúng: <chữ cái đáp án đúng>
                Lý do: <lý do đáp án đúng>
                ---
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
    console.error("Lỗi khi gọi API:", error);
  }

  // Ẩn loading
  document.getElementById("loading").classList.add("hidden");

  if (questions.length === 0) {
    alert("Không thể tạo câu hỏi. Vui lòng thử lại!");
    return;
  }

  // Khởi tạo quiz
  currentQuestionIndex = 0;
  userAnswers = Array(questions.length).fill(null);
  currentScore = 0;

  document.getElementById("setup-section").classList.add("hidden");
  document.getElementById("quiz-section").classList.remove("hidden");
  document.getElementById("total-questions").textContent = questions.length;
  document.getElementById("max-score").textContent = questions.length;
  document.getElementById("current-score").textContent = "0";

  // Reset background color
  showPreview();
}

function parseQuestion(content) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  let question = "";
  let choices = [];
  let correctAnswer = "";
  let reason = "";

  lines.forEach((line) => {
    if (line.startsWith("Câu hỏi:")) {
      question = line.replace("Câu hỏi:", "").trim();
    } else if (/^[A-D]\./.test(line)) {
      choices.push(line);
    } else if (line.startsWith("Đáp án đúng:")) {
      correctAnswer = line.replace("Đáp án đúng:", "").trim();
    } else if (line.startsWith("Lý do:")) {
      reason = line.replace("Lý do:", "").trim();
    }
  });

  return question && correctAnswer
    ? { question, choices, correctAnswer, reason }
    : null;
}

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
      optionClass += " selected";
    }

    questionHtml += `
            <div class="${optionClass}" onclick="selectAnswer('${optionLetter}')">
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

function selectAnswer(answer) {
  // If already answered, don't allow changing
  if (userAnswers[currentQuestionIndex] !== null) return;

  userAnswers[currentQuestionIndex] = answer;

  // Check if answer is correct
  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = answer === currentQuestion.correctAnswer;

  if (isCorrect) {
    currentScore++;
    document.getElementById("current-score").textContent = currentScore;

    // Thêm hiệu ứng nền xanh khi đúng
    changeBackgroundColor(true);

    // Hiệu ứng pháo hoa khi đúng
    createFireworks();
  } else {
    // Thêm hiệu ứng nền đỏ khi sai
    changeBackgroundColor(false);
  }

  // Show feedback
  displayCurrentQuestion();

  // Enable navigation to next question
  updateNavigationButtons();
}

// Hàm tạo hiệu ứng pháo hoa
function createFireworks() {
  const fireworksContainer = document.createElement("div");
  fireworksContainer.className = "fireworks-container";
  document.body.appendChild(fireworksContainer);

  // Tạo nhiều pháo hoa với màu sắc khác nhau
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

  // Tạo 50 hạt pháo hoa
  for (let i = 0; i < 100; i++) {
    createParticle(fireworksContainer, colors);
  }

  // Xóa container sau khi hiệu ứng kết thúc
  setTimeout(() => {
    fireworksContainer.remove();
  }, 3000);
}

function createParticle(container, colors) {
  const particle = document.createElement("div");
  particle.className = "firework-particle";

  // Vị trí ban đầu (giữa màn hình)
  const startX = window.innerWidth / 2;
  const startY = window.innerHeight / 2;

  // Màu ngẫu nhiên
  const color = colors[Math.floor(Math.random() * colors.length)];

  // Kích thước ngẫu nhiên
  const size = Math.random() * 8 + 4;

  // Góc và khoảng cách ngẫu nhiên
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 150 + 50;

  // Tốc độ ngẫu nhiên
  const duration = Math.random() * 1 + 1;

  // Vị trí đích
  const destX = startX + Math.cos(angle) * distance;
  const destY = startY + Math.sin(angle) * distance;

  // Thiết lập style
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

  // Xóa particle sau khi animation kết thúc
  setTimeout(() => {
    particle.remove();
  }, duration * 1000 + 100);
}

// Hàm thay đổi màu nền
function changeBackgroundColor(isCorrect) {
  const quizCard = document.querySelector(".quiz-card");
  const questionContainer = document.getElementById("question-container");

  // Xóa các class màu cũ
  quizCard.classList.remove("correct-background", "incorrect-background");
  questionContainer.classList.remove(
    "correct-background",
    "incorrect-background"
  );

  // Thêm class màu mới
  if (isCorrect) {
    quizCard.classList.add("correct-background");
    questionContainer.classList.add("correct-background");

    // Hiệu ứng rung nhẹ khi đúng
    quizCard.classList.add("correct-animation");
    setTimeout(() => {
      quizCard.classList.remove("correct-animation");
    }, 500);
  } else {
    quizCard.classList.add("incorrect-background");
    questionContainer.classList.add("incorrect-background");

    // Hiệu ứng rung mạnh khi sai
    quizCard.classList.add("incorrect-animation");
    setTimeout(() => {
      quizCard.classList.remove("incorrect-animation");
    }, 500);
  }

  // Tự động reset màu sau 1.5 giây
  setTimeout(() => {
    resetBackgroundColor();
  }, 1500);
}

// Hàm reset màu nền về mặc định
function resetBackgroundColor() {
  const quizCard = document.querySelector(".quiz-card");
  const questionContainer = document.getElementById("question-container");

  quizCard.classList.remove(
    "correct-background",
    "incorrect-background",
    "correct-animation",
    "incorrect-animation"
  );
  questionContainer.classList.remove(
    "correct-background",
    "incorrect-background"
  );
}

function nextQuestion() {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    resetBackgroundColor(); // Reset màu khi chuyển câu hỏi
    displayCurrentQuestion();
    updateNavigationButtons();
  }
}

function previousQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    resetBackgroundColor(); // Reset màu khi chuyển câu hỏi
    displayCurrentQuestion();
    updateNavigationButtons();
  }
}

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

function finishQuiz() {
  document.getElementById("quiz-section").classList.add("hidden");
  document.getElementById("results-section").classList.remove("hidden");

  document.getElementById("final-score").textContent = currentScore;
  document.getElementById("final-max-score").textContent = questions.length;

  const percentage = (currentScore / questions.length) * 100;
  let message = "";

  if (percentage === 100) {
    message = "Tuyệt vời! Bạn đã trả lời đúng tất cả các câu hỏi!";
    // Hiệu ứng pháo hoa khi hoàn thành xuất sắc
    setTimeout(() => {
      createFireworks();
      setTimeout(() => createFireworks(), 500);
    }, 300);
  } else if (percentage >= 80) {
    message = "Rất tốt! Bạn đã làm rất tốt!";
  } else if (percentage >= 60) {
    message = "Khá tốt! Bạn đã vượt qua bài kiểm tra!";
  } else if (percentage >= 40) {
    message = "Bạn cần cố gắng hơn nữa!";
  } else {
    message = "Hãy tiếp tục học tập và thử lại!";
  }

  document.getElementById("result-message").textContent = message;

  // Hiển thị danh sách chi tiết từng câu hỏi
  const detailedResults = document.getElementById("detailed-results");
  detailedResults.innerHTML = ""; // Xóa nội dung cũ

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index] || "Chưa chọn";
    const isCorrect = userAnswer === question.correctAnswer;
    const resultClass = isCorrect ? "correct-answer" : "incorrect-answer";

    const questionHtml = `
      <div class="result-question">
        <h4>${index + 1}. ${question.question}</h4>
        <p><strong>Đáp án của bạn:</strong> <span class="${resultClass}">${userAnswer}</span></p>
        <p><strong>Đáp án đúng:</strong> <span class="correct-answer">${
          question.correctAnswer
        }</span></p>
        <p><strong>Lý Do:</strong> <span class="correct-answer">${
          question.reason
        }</span></p>
      </div>
    `;

    detailedResults.innerHTML += questionHtml;
  });
}

function resetQuiz() {
  // Reset to setup screen
  document.getElementById("results-section").classList.add("hidden");
  document.getElementById("setup-section").classList.remove("hidden");

  // Clear form fields
  document.getElementById("topic").value = "";
  document.getElementById("question-count").value = "";

  // Reset quiz state
  questions = [];
  currentQuestionIndex = 0;
  userAnswers = [];
  currentScore = 0;

  // Reset background color
  resetBackgroundColor();
}

function showPreview() {
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
          <button onclick="deleteQuestion(${index})">🗑 Xóa</button>
          <button onclick="replaceQuestion(${index})">🔄 Thay thế</button>
        </div>
      </div>
    `;
    previewContainer.innerHTML += questionHtml;
  });

  // Hiển thị phần preview và nút bắt đầu
  document.getElementById("setup-section").classList.add("hidden");
  document.getElementById("preview-section").classList.remove("hidden");
}

// Xóa câu hỏi khỏi danh sách
function deleteQuestion(index) {
  questions.splice(index, 1);
  showPreview();
}

// Thay thế câu hỏi bằng AI
async function replaceQuestion(index) {
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
                text: `Tạo 1 câu hỏi trắc nghiệm về chủ đề: ${topic}.
                Câu hỏi có 4 phương án trả lời (A, B, C, D), chỉ có 1 đáp án đúng.
                Trả về theo định dạng:
                Câu hỏi: <câu hỏi>
                A. <đáp án A>
                B. <đáp án B>
                C. <đáp án C>
                D. <đáp án D>
                Đáp án đúng: <chữ cái đáp án đúng>
                Lý do: <lý do đáp án đúng>
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
    console.error("Lỗi khi thay thế câu hỏi:", error);
  }
}

// Khi nhấn "Bắt đầu làm bài"
function startQuiz() {
  document.getElementById("preview-section").classList.add("hidden");
  document.getElementById("quiz-section").classList.remove("hidden");

  currentQuestionIndex = 0;
  userAnswers = Array(questions.length).fill(null);
  currentScore = 0;

  document.getElementById("total-questions").textContent = questions.length;
  document.getElementById("max-score").textContent = questions.length;
  document.getElementById("current-score").textContent = "0";

  resetBackgroundColor();
  displayCurrentQuestion();
  updateNavigationButtons();
}
