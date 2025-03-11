//Đag ở bản gốc chưa link gì cả, ae chỉnh sửa xong link vào script ở index.html

document.addEventListener("DOMContentLoaded", () => {
  const quizSetupForm = document.getElementById("quiz-setup-form");
  quizSetupForm.addEventListener("submit", handleQuizSetup);
});
//quizcreateFireworks
const setupSection = document.getElementById("setup-section");
const quizSection = document.getElementById("quiz-section");
const resultsSection = document.getElementById("results-section");
const quizSetupForm = document.getElementById("quiz-setup-form");
const loadingIndicator = document.getElementById("loading");
const questionContainer = document.getElementById("question-container");
const currentQuestionEl = document.getElementById("current-question");
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
const playAgainButton = document.getElementById("play-again-button");
const fireworksContainer = document.getElementById("fireworks-container");
function handleQuizSetup(e) {
  e.preventDefault();

  const topic = document.getElementById("topic").value;
  const difficulty = document.getElementById("difficulty").value;
  const questionCount = parseInt(
    document.getElementById("question-count").value
  );
  const multipleChoice = document.getElementById("multiple-choice").checked;
  const singleChoice = document.getElementById("single-choice").checked;
  const textAnswer = document.getElementById("text-answer").checked;

  // Validate inputs
  if (!topic) {
    alert("Vui lòng nhập chủ đề!");
    return;
  }

  if (questionCount < 1 || questionCount > 10) {
    alert("Số câu hỏi phải từ 1 đến 10!");
    return;
  }

  if (!multipleChoice && !singleChoice && !textAnswer) {
    alert("Vui lòng chọn ít nhất một loại câu hỏi!");
    return;
  }

  // Show loading indicator
  const loadingIndicator = document.getElementById("loading");
  loadingIndicator.classList.remove("hidden");

  // Generate questions (simulated for demo)
  setTimeout(() => {
    generateQuestions(topic, difficulty, questionCount, {
      multipleChoice,
      singleChoice,
      textAnswer,
    });
    loadingIndicator.classList.add("hidden");
  }, 1500);
}

function generateQuestions(topic, difficulty, count, questionTypes) {
  // Sample questions for demonstration
  const sampleQuestions = [
    {
      type: "single",
      question: "Đâu là ngôn ngữ lập trình phổ biến nhất cho phát triển web?",
      choices: ["A. Java", "B. JavaScript", "C. Python", "D. C#"],
      correctAnswer: "B",
      reason:
        "JavaScript là ngôn ngữ lập trình phổ biến nhất cho phát triển web vì nó chạy trên tất cả các trình duyệt.",
    },
    {
      type: "multiple",
      question: "Đâu là các framework JavaScript phổ biến?",
      choices: ["A. React", "B. Angular", "C. Django", "D. Vue"],
      correctAnswer: "A,B,D",
      reason:
        "React, Angular và Vue là các framework JavaScript phổ biến. Django là framework Python.",
    },
    {
      type: "text",
      question: "HTML là viết tắt của gì?",
      choices: [],
      correctAnswer: "HyperText Markup Language",
      reason:
        "HTML là viết tắt của HyperText Markup Language, ngôn ngữ đánh dấu siêu văn bản dùng để tạo cấu trúc cho trang web.",
    },
    {
      type: "single",
      question: "Đâu là thuộc tính CSS để thay đổi màu chữ?",
      choices: ["A. text-color", "B. font-color", "C. color", "D. text-style"],
      correctAnswer: "C",
      reason: 'Thuộc tính CSS để thay đổi màu chữ là "color".',
    },
    {
      type: "multiple",
      question: "Đâu là các thẻ HTML để tạo danh sách?",
      choices: ["A. <ul>", "B. <ol>", "C. <dl>", "D. <table>"],
      correctAnswer: "A,B,C",
      reason:
        "<ul>, <ol>, và <dl> là các thẻ HTML để tạo danh sách. <table> dùng để tạo bảng.",
    },
  ];

  // Filter questions based on selected types
  const filteredQuestions = sampleQuestions
    .filter((q) => {
      if (q.type === "single" && questionTypes.singleChoice) return true;
      if (q.type === "multiple" && questionTypes.multipleChoice) return true;
      if (q.type === "text" && questionTypes.textAnswer) return true;
      return false;
    })
    .slice(0, count);

  // Initialize quiz state
  questions = filteredQuestions;
  userAnswers = Array(filteredQuestions.length).fill(null);
  currentQuestionIndex = 0;
  currentScore = 0;

  // Update UI
  setupSection.classList.add("hidden");
  quizSection.classList.remove("hidden");

  totalQuestionsEl.textContent = questions.length;
  maxScoreEl.textContent = questions.length;
  currentScoreEl.textContent = "0";
  // Save questions to localStorage
  localStorage.setItem("questions", JSON.stringify(filteredQuestions));
  localStorage.setItem(
    "userAnswers",
    JSON.stringify(Array(filteredQuestions.length).fill(null))
  );
  // Display first question
  window.location.href = "../quiz/quiz.html";
}
