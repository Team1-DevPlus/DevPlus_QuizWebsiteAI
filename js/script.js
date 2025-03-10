// Global variables to store quiz state
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let currentScore = 0;
let maxQuestions = 0;

// Question types
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  MATCHING: 'matching',
  ORDERING: 'ordering'
};

// Matching question handlers
let selectedMatchingItem = null;

async function generateQuestions() {
  const topic = document.getElementById("topic").value;
  const count = Number.parseInt(
    document.getElementById("question-count").value
  );

  if (!topic || isNaN(count) || count < 1 || count > 50) {
    alert("Vui lòng nhập chủ đề và số câu hỏi hợp lệ (1-50)!");
    return;
  }

  maxQuestions = count;
  
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
                Mỗi câu hỏi có thể là một trong các dạng sau:
                1. Câu hỏi trắc nghiệm (4 lựa chọn A, B, C, D)
                2. Câu nối (matching) - nối các cặp đáp án đúng
                3. Sắp xếp thứ tự (ordering) - sắp xếp các bước theo đúng thứ tự
                
                Trả về mỗi câu hỏi theo định dạng sau và phân tách bằng "---":
                
                Dạng câu hỏi: <multiple_choice/matching/ordering>
                
                Câu hỏi: <câu hỏi>
                
                Nếu là câu trắc nghiệm:
                A. <đáp án A>
                B. <đáp án B>
                C. <đáp án C>
                D. <đáp án D>
                Đáp án đúng: <chữ cái đáp án đúng>
                
                Nếu là câu nối:
                Cặp 1: <item 1> - <matching item 1>
                Cặp 2: <item 2> - <matching item 2>
                Cặp 3: <item 3> - <matching item 3>
                Cặp 4: <item 4> - <matching item 4>
                
                Nếu là sắp xếp thứ tự:
                Bước 1: <step 1>
                Bước 2: <step 2>
                Bước 3: <step 3>
                Bước 4: <step 4>
                
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
  
  let questionType = "";
  let question = "";
  let choices = [];
  let correctAnswer = "";
  let reason = "";
  let matchingPairs = [];
  let orderingSteps = [];

  lines.forEach((line) => {
    if (line.startsWith("Dạng câu hỏi:")) {
      questionType = line.replace("Dạng câu hỏi:", "").trim();
    } else if (line.startsWith("Câu hỏi:")) {
      question = line.replace("Câu hỏi:", "").trim();
    } else if (/^[A-D]\./.test(line)) {
      choices.push(line);
    } else if (line.startsWith("Đáp án đúng:")) {
      correctAnswer = line.replace("Đáp án đúng:", "").trim();
    } else if (line.startsWith("Cặp")) {
      const [left, right] = line.split("-").map(item => item.trim());
      matchingPairs.push({ left, right });
    } else if (line.startsWith("Bước")) {
      orderingSteps.push(line.replace(/^Bước \d+:/, "").trim());
    } else if (line.startsWith("Lý do:")) {
      reason = line.replace("Lý do:", "").trim();
    }
  });

  const questionData = {
    type: questionType,
    question,
    reason
  };

  switch (questionType) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      questionData.choices = choices;
      questionData.correctAnswer = correctAnswer;
      break;
    case QUESTION_TYPES.MATCHING:
      questionData.matchingPairs = matchingPairs;
      questionData.correctAnswer = matchingPairs.map(pair => `${pair.left}-${pair.right}`).join(',');
      break;
    case QUESTION_TYPES.ORDERING:
      questionData.orderingSteps = orderingSteps;
      questionData.correctAnswer = orderingSteps.join(',');
      break;
  }

  return questionData;
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

  switch (currentQuestion.type) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      questionHtml += displayMultipleChoice(currentQuestion, userAnswer, showFeedback);
      break;
    case QUESTION_TYPES.MATCHING:
      questionHtml += displayMatching(currentQuestion, userAnswer, showFeedback);
      break;
    case QUESTION_TYPES.ORDERING:
      questionHtml += displayOrdering(currentQuestion, userAnswer, showFeedback);
      break;
  }

  questionHtml += `
      </div>
    </div>
  `;

  container.innerHTML = questionHtml;
  
  // Initialize handlers based on question type
  switch (currentQuestion.type) {
    case QUESTION_TYPES.MATCHING:
      initMatchingHandlers();
      break;
    case QUESTION_TYPES.ORDERING:
      initOrderingHandlers();
      break;
  }
}

function displayMultipleChoice(question, userAnswer, showFeedback) {
  let html = '';
  question.choices.forEach((choice, index) => {
    const optionLetter = choice[0];
    const isSelected = userAnswer === optionLetter;
    const isCorrect = question.correctAnswer === optionLetter;

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

    html += `
      <div class="${optionClass}" onclick="selectAnswer('${optionLetter}')">
        <input type="radio" name="q${currentQuestionIndex}" value="${optionLetter}" ${
      isSelected ? "checked" : ""
    } ${showFeedback ? "disabled" : ""}>
        <span>${choice}</span>
        ${feedbackIcon}
      </div>
    `;
  });
  return html;
}

function displayMatching(question, userAnswer, showFeedback) {
  const pairs = question.matchingPairs;
  const shuffledPairs = [...pairs].sort(() => Math.random() - 0.5);
  
  let html = '<div class="matching-container">';
  
  // Left column
  html += '<div class="matching-column">';
  shuffledPairs.forEach((pair, index) => {
    html += `<div class="matching-item" data-index="${index}">${pair.left}</div>`;
  });
  html += '</div>';
  
  // Right column
  html += '<div class="matching-column">';
  shuffledPairs.forEach((pair, index) => {
    html += `<div class="matching-item" data-index="${index}">${pair.right}</div>`;
  });
  html += '</div>';
  
  html += '</div>';
  
  return html;
}

function displayOrdering(question, userAnswer, showFeedback) {
  const steps = question.orderingSteps;
  const shuffledSteps = [...steps].sort(() => Math.random() - 0.5);
  
  let html = '<div class="ordering-container">';
  shuffledSteps.forEach((step, index) => {
    html += `
      <div class="ordering-item" draggable="true" data-index="${index}">
        <span class="ordering-number">${index + 1}</span>
        <span class="ordering-text">${step}</span>
      </div>
    `;
  });
  html += '</div>';
  
  return html;
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

function resetQuiz() {
  // Hide all sections first
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
  currentQuestionIndex = 0;
  userAnswers = [];
  currentScore = 0;

  // Clear all containers
  document.getElementById("question-container").innerHTML = "";
  document.getElementById("detailed-results").innerHTML = "";
  document.getElementById("preview-container").innerHTML = "";

  // Reset background color
  resetBackgroundColor();
}

function startQuiz() {
  if (questions.length === 0) {
    alert("Không có câu hỏi nào để làm bài. Vui lòng tạo câu hỏi trước!");
    return;
  }

  // Hide all sections first
  document.getElementById("setup-section").classList.add("hidden");
  document.getElementById("preview-section").classList.add("hidden");
  document.getElementById("results-section").classList.add("hidden");

  // Show only quiz section
  document.getElementById("quiz-section").classList.remove("hidden");

  // Reset quiz state for a fresh start
  currentQuestionIndex = 0;
  userAnswers = Array(questions.length).fill(null);
  currentScore = 0;

  // Update UI elements
  document.getElementById("total-questions").textContent = questions.length;
  document.getElementById("max-score").textContent = questions.length;
  document.getElementById("current-score").textContent = "0";

  // Clear any previous question display
  document.getElementById("question-container").innerHTML = "";

  // Reset background and display first question
  resetBackgroundColor();
  displayCurrentQuestion();
  updateNavigationButtons();
}

function finishQuiz() {
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
    message = "Tuyệt vời! Bạn đã trả lời đúng tất cả các câu hỏi!";
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
  detailedResults.innerHTML = "";

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
    let questionHtml = `
      <div class="preview-question">
        <h3>${index + 1}. ${q.question}</h3>
        <div class="question-type">Dạng: ${getQuestionTypeName(q.type)}</div>
    `;

    switch (q.type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        questionHtml += `
          <ul>
            ${q.choices.map(choice => `<li>${choice}</li>`).join("")}
          </ul>
        `;
        break;
      case QUESTION_TYPES.MATCHING:
        questionHtml += `
          <div class="matching-preview">
            <div class="matching-column">
              ${q.matchingPairs.map(pair => `<div>${pair.left}</div>`).join("")}
            </div>
            <div class="matching-column">
              ${q.matchingPairs.map(pair => `<div>${pair.right}</div>`).join("")}
            </div>
          </div>
        `;
        break;
      case QUESTION_TYPES.ORDERING:
        questionHtml += `
          <ul>
            ${q.orderingSteps.map((step, i) => `<li>Bước ${i + 1}: ${step}</li>`).join("")}
          </ul>
        `;
        break;
    }

    questionHtml += `
        <div class="question-actions">
          <button onclick="deleteQuestion(${index})">🗑 Xóa</button>
          <button onclick="replaceQuestion(${index})">🔄 Thay thế</button>
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

function getQuestionTypeName(type) {
  switch (type) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      return "Trắc nghiệm";
    case QUESTION_TYPES.MATCHING:
      return "Câu nối";
    case QUESTION_TYPES.ORDERING:
      return "Sắp xếp thứ tự";
    default:
      return "Không xác định";
  }
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
                text: `Tạo 1 câu hỏi về chủ đề: ${topic}.
                Hãy chọn NGẪU NHIÊN một trong ba dạng câu hỏi sau:
                1. Câu hỏi trắc nghiệm (multiple_choice)
                2. Câu nối (matching)
                3. Sắp xếp thứ tự (ordering)
                
                Trả về theo định dạng sau:
                
                Dạng câu hỏi: <multiple_choice/matching/ordering>
                
                Câu hỏi: <câu hỏi>
                
                Nếu là câu trắc nghiệm (multiple_choice):
                A. <đáp án A>
                B. <đáp án B>
                C. <đáp án C>
                D. <đáp án D>
                Đáp án đúng: <chữ cái đáp án đúng>
                
                Nếu là câu nối (matching):
                Cặp 1: <item 1> - <matching item 1>
                Cặp 2: <item 2> - <matching item 2>
                Cặp 3: <item 3> - <matching item 3>
                Cặp 4: <item 4> - <matching item 4>
                
                Nếu là sắp xếp thứ tự (ordering):
                Bước 1: <step 1>
                Bước 2: <step 2>
                Bước 3: <step 3>
                Bước 4: <step 4>
                
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
    alert("Không thể thay thế câu hỏi. Vui lòng thử lại!");
  }
}

async function addNewQuestion() {
  if (questions.length >= maxQuestions) {
    alert(
      `Bài quiz chỉ có tối đa ${maxQuestions} câu hỏi. Không thể thêm câu hỏi mới!`
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
                text: `Tạo 1 câu hỏi trắc nghiệm về chủ đề: ${topic}.
                Câu hỏi có thể là một trong các dạng sau:
                1. Câu hỏi trắc nghiệm (4 lựa chọn A, B, C, D)
                2. Câu nối (matching) - nối các cặp đáp án đúng
                3. Sắp xếp thứ tự (ordering) - sắp xếp các bước theo đúng thứ tự
                
                Trả về theo định dạng:
                
                Dạng câu hỏi: <multiple_choice/matching/ordering>
                
                Câu hỏi: <câu hỏi>
                
                Nếu là câu trắc nghiệm:
                A. <đáp án A>
                B. <đáp án B>
                C. <đáp án C>
                D. <đáp án D>
                Đáp án đúng: <chữ cái đáp án đúng>
                
                Nếu là câu nối:
                Cặp 1: <item 1> - <matching item 1>
                Cặp 2: <item 2> - <matching item 2>
                Cặp 3: <item 3> - <matching item 3>
                Cặp 4: <item 4> - <matching item 4>
                
                Nếu là sắp xếp thứ tự:
                Bước 1: <step 1>
                Bước 2: <step 2>
                Bước 3: <step 3>
                Bước 4: <step 4>
                
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
      // Thêm câu hỏi mới vào danh sách
      questions.push(newQuestion);
      // Cập nhật giao diện xem trước
      showPreview();
    }
  } catch (error) {
    console.error("Lỗi khi thêm câu hỏi:", error);
    alert("Không thể thêm câu hỏi. Vui lòng thử lại!");
  }
}

// Matching question handlers
function initMatchingHandlers() {
  const matchingItems = document.querySelectorAll('.matching-item');
  matchingItems.forEach(item => {
    item.addEventListener('click', handleMatchingItemClick);
  });
}

function handleMatchingItemClick(event) {
  const item = event.target;
  const container = item.closest('.matching-container');
  
  if (!selectedMatchingItem) {
    // First selection
    selectedMatchingItem = item;
    item.classList.add('selected');
  } else {
    // Second selection
    const firstItem = selectedMatchingItem;
    const secondItem = item;
    
    // Check if items are in different columns
    if (firstItem.closest('.matching-column') !== secondItem.closest('.matching-column')) {
      // Check if the match is correct
      const firstIndex = firstItem.dataset.index;
      const secondIndex = secondItem.dataset.index;
      const currentQuestion = questions[currentQuestionIndex];
      const isCorrect = currentQuestion.matchingPairs[firstIndex].right === currentQuestion.matchingPairs[secondIndex].right;
      
      if (isCorrect) {
        firstItem.classList.add('correct');
        secondItem.classList.add('correct');
        firstItem.classList.remove('selected');
        secondItem.classList.remove('selected');
        
        // Update user answer
        const userAnswer = userAnswers[currentQuestionIndex] || [];
        userAnswer.push(`${firstIndex}-${secondIndex}`);
        userAnswers[currentQuestionIndex] = userAnswer;
        
        // Check if all pairs are matched
        if (userAnswer.length === currentQuestion.matchingPairs.length) {
          currentScore++;
          document.getElementById("current-score").textContent = currentScore;
          changeBackgroundColor(true);
          createFireworks();
          updateNavigationButtons();
        }
      } else {
        firstItem.classList.add('incorrect');
        secondItem.classList.add('incorrect');
        setTimeout(() => {
          firstItem.classList.remove('incorrect', 'selected');
          secondItem.classList.remove('incorrect', 'selected');
        }, 1000);
      }
    }
    
    selectedMatchingItem = null;
  }
}

// Ordering question handlers
function initOrderingHandlers() {
  const container = document.querySelector('.ordering-container');
  if (!container) return;
  
  const items = container.querySelectorAll('.ordering-item');
  items.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
  });
  
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('drop', handleDrop);
}

let draggedItem = null;

function handleDragStart(e) {
  draggedItem = this;
  this.classList.add('dragging');
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  draggedItem = null;
}

function handleDragOver(e) {
  e.preventDefault();
  const container = this;
  const afterElement = getDragAfterElement(container, e.clientY);
  const draggable = document.querySelector('.dragging');
  
  if (afterElement) {
    container.insertBefore(draggable, afterElement);
  } else {
    container.appendChild(draggable);
  }
}

function handleDrop(e) {
  e.preventDefault();
  updateOrderingAnswer();
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.ordering-item:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateOrderingAnswer() {
  const container = document.querySelector('.ordering-container');
  const items = container.querySelectorAll('.ordering-item');
  const currentQuestion = questions[currentQuestionIndex];
  
  const userOrder = Array.from(items).map(item => {
    const index = item.dataset.index;
    return currentQuestion.orderingSteps[index];
  }).join(',');
  
  userAnswers[currentQuestionIndex] = userOrder;
  
  // Check if order is correct
  if (userOrder === currentQuestion.correctAnswer) {
    currentScore++;
    document.getElementById("current-score").textContent = currentScore;
    changeBackgroundColor(true);
    createFireworks();
    updateNavigationButtons();
    
    // Disable dragging after correct answer
    items.forEach(item => {
      item.draggable = false;
      item.classList.add('correct');
    });
  }
}