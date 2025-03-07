let questions = [
  { question: "Câu hỏi 1: 2 + 2?", correctAnswer: "4" },
  { question: "Câu hỏi 2: 5 + 3?", correctAnswer: "8" },
  { question: "Câu hỏi 3: 6 + 4?", correctAnswer: "10" },
];
let currentQuestionIndex = 0;
let score = 0;

function startQuiz() {
  const topic = document.getElementById("topic").value;
  const questionCount = document.getElementById("question-count").value;

  if (topic && questionCount > 0) {
    document.getElementById("setup-section").classList.add("hidden");
    document.getElementById("confirm-section").classList.remove("hidden");
    document.getElementById(
      "confirm-question"
    ).innerText = `Chủ đề: ${topic}\nSố câu hỏi: ${questionCount}\nBạn có chắc chắn muốn tiếp tục?`;
  } else {
    alert("Vui lòng nhập đầy đủ thông tin.");
  }
}

function startQuizFlow() {
  document.getElementById("confirm-section").classList.add("hidden");
  document.getElementById("quiz-section").classList.remove("hidden");
  showQuestion();
}

function showQuestion() {
  if (currentQuestionIndex < questions.length) {
    document.getElementById("current-question-text").innerText =
      questions[currentQuestionIndex].question;
  } else {
    finishQuiz();
  }
}

function submitAnswer() {
  const userAnswer = document.getElementById("user-answer").value.trim();
  if (userAnswer === questions[currentQuestionIndex].correctAnswer) {
    score++;
  }

  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  document.getElementById("quiz-section").classList.add("hidden");
  document.getElementById("results-section").classList.remove("hidden");
  document.getElementById(
    "final-score"
  ).innerText = `Điểm của bạn: ${score}/${questions.length}`;
}

function cancelQuiz() {
  document.getElementById("confirm-section").classList.add("hidden");
  document.getElementById("setup-section").classList.remove("hidden");
}

function resetQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  document.getElementById("results-section").classList.add("hidden");
  document.getElementById("setup-section").classList.remove("hidden");
}
