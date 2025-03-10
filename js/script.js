// Global variables to store quiz state
let questions = []
let currentQuestionIndex = 0
let userAnswers = []
let currentScore = 0

async function generateQuestions() {
  const topic = document.getElementById("topic").value;
  const count = Number.parseInt(document.getElementById("question-count").value);

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
    const questionBlocks = content.split("---").map((q) => q.trim()).filter(Boolean);
    
    questions = questionBlocks.map(parseQuestion).filter(Boolean);
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
  }
}
