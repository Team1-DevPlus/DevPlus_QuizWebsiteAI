// Quiz module for handling quiz functionality
window.quizModule = (() => {
  let questions = [];
  let currentQuestionIndex = 0;
  let userAnswers = [];
  let currentScore = 0;

  // Initialize quiz with provided data
  function initQuiz(quizQuestions, answers, questionIndex, score) {
    console.log(
      "quizModule.initQuiz called with",
      quizQuestions.length,
      "questions"
    );
    questions = quizQuestions;
    userAnswers = answers || Array(questions.length).fill(null);
    currentQuestionIndex = questionIndex || 0;
    currentScore = score || 0;
  }

  // Reset quiz state
  function resetQuizState() {
    console.log("quizModule.resetQuizState called");
    questions = [];
    currentQuestionIndex = 0;
    userAnswers = [];
    currentScore = 0;
  }

  // Display current question
  function displayCurrentQuestion() {
    console.log(
      "quizModule.displayCurrentQuestion called, currentQuestionIndex:",
      currentQuestionIndex
    );
    const container = document.getElementById("question-container");
    if (!container) {
      console.error("Question container not found!");
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) {
      console.error("No question found at index", currentQuestionIndex);
      return;
    }

    console.log("CurrentQuestion:", currentQuestion);

    console.log("Displaying question of type:", currentQuestion.type);
    document.getElementById("current-question").textContent =
      currentQuestionIndex + 1;

    const userAnswer = userAnswers[currentQuestionIndex];
    const showFeedback = userAnswer !== null;

    // Check question type and display accordingly
    if (currentQuestion.type === "multiple-choice") {
      displayMultipleChoiceQuestion(
        container,
        currentQuestion,
        userAnswer,
        showFeedback
      );
    } else if (currentQuestion.type === "drag-and-drop") {
      displayDragAndDropQuestion(
        container,
        currentQuestion,
        userAnswer,
        showFeedback
      );
    } else if (currentQuestion.type === "match-answer") {
      displayMatchAnswerQuestion(
        container,
        currentQuestion,
        userAnswer,
        showFeedback
      );
    } else {
      // Fallback to multiple choice display if type is not specified
      console.warn(
        "Unknown question type, falling back to multiple-choice:",
        currentQuestion.type
      );
      displayMultipleChoiceQuestion(
        container,
        currentQuestion,
        userAnswer,
        showFeedback
      );
    }
  }

  // Display multiple choice question
  function displayMultipleChoiceQuestion(
    container,
    currentQuestion,
    userAnswer,
    showFeedback
  ) {
    let questionHtml = `
          <div class="question-block">
        <h3 class="text-xl font-bold mb-4">${
          currentQuestionIndex + 1
        }. ${formatCodeSnippets(currentQuestion.question)}</h3>
        <div class="answer-options space-y-3">
      `;

    console.log("currentQuestion: ", currentQuestion);

    currentQuestion.choices.forEach((choice, index) => {
      const optionLetter = choice[0]; // A, B, C, or D
      console.log("CHOICE:", choice);
      const isSelected = userAnswer === optionLetter;
      const isCorrect = currentQuestion.correctAnswer === optionLetter;

      let optionClass =
        "answer-option p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition";
      let feedbackIcon = "";

      if (showFeedback) {
        if (isSelected) {
          optionClass += isCorrect
            ? " correct bg-green-100 border-green-500"
            : " incorrect bg-red-100 border-red-500";
          feedbackIcon = isCorrect
            ? '<span class="feedback-icon text-green-600 ml-2">✓</span>'
            : '<span class="feedback-icon text-red-600 ml-2">✗</span>';
        } else if (isCorrect) {
          optionClass += " correct bg-green-100 border-green-500";
          feedbackIcon =
            '<span class="feedback-icon text-green-600 ml-2">✓</span>';
        }
      } else if (isSelected) {
        optionClass += " selected bg-blue-100 border-blue-500";
      }

      questionHtml += `
              <div class="${optionClass}" onclick="window.quizModule.selectAnswer('${optionLetter}')">
                  <input type="radio" name="q${currentQuestionIndex}" value="${optionLetter}" ${
        isSelected ? "checked" : ""
      } ${showFeedback ? "disabled" : ""}>
                  <span>${formatCodeSnippets(choice)}</span>
                  ${feedbackIcon}
              </div>
          `;
    });

    questionHtml += `
              </div>
          </div>
      `;

    if (showFeedback) {
      questionHtml += `
        <div class="explanation mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 class="font-bold text-blue-800">Explanation:</h4>
          <p class="text-gray-700">${currentQuestion.reason}</p>
        </div>
      `;
    }

    container.innerHTML = questionHtml;
  }

  // Display drag and drop question
  function displayDragAndDropQuestion(
    container,
    currentQuestion,
    userAnswer,
    showFeedback
  ) {
    const items = currentQuestion.items;

    let questionHtml = `
      <div class="question-block">
        <h3 class="text-xl font-bold mb-4">${
          currentQuestionIndex + 1
        }. ${formatCodeSnippets(currentQuestion.question)}</h3>
    `;

    if (showFeedback) {
      // Show items in correct order with feedback
      questionHtml += `<div class="correct-sequence p-4 bg-green-50 rounded-lg mb-4">
        <h4 class="font-bold text-green-800 mb-2">Correct Sequence:</h4>
        <ol class="list-decimal pl-5 space-y-2">`;

      // Display items in correct order
      const correctOrder = [...currentQuestion.items];
      const correctSequence = currentQuestion.correctSequence;

      for (let i = 0; i < correctSequence.length; i++) {
        const itemIndex = correctSequence[i] - 1; // Convert to 0-based index
        if (itemIndex >= 0 && itemIndex < correctOrder.length) {
          questionHtml += `<li class="p-2 bg-white rounded border border-green-300">${correctOrder[itemIndex]}</li>`;
        }
      }

      questionHtml += `</ol></div>`;

      // Show user's answer
      if (userAnswer && userAnswer.length) {
        questionHtml += `<div class="user-sequence p-4 bg-blue-50 rounded-lg mb-4">
          <h4 class="font-bold text-blue-800 mb-2">Your Answer:</h4>
          <ol class="list-decimal pl-5 space-y-2">`;

        for (let i = 0; i < userAnswer.length; i++) {
          const itemIndex = userAnswer[i];
          if (itemIndex >= 0 && itemIndex < items.length) {
            const isCorrect = itemIndex === correctSequence[i] - 1;
            const itemClass = isCorrect
              ? "border-green-500 bg-green-50"
              : "border-red-500 bg-red-50";
            const icon = isCorrect
              ? '<span class="text-green-600 ml-2">✓</span>'
              : '<span class="text-red-600 ml-2">✗</span>';

            questionHtml += `<li class="p-2 rounded border ${itemClass}">${items[itemIndex]} ${icon}</li>`;
          }
        }

        questionHtml += `</ol></div>`;
      }

      // Show explanation
      questionHtml += `
        <div class="explanation mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 class="font-bold text-blue-800">Explanation:</h4>
          <p class="text-gray-700">${currentQuestion.reason}</p>
        </div>
      `;
    } else {
      // Show draggable interface for answering
      questionHtml += `
        <div class="drag-drop-container">
          <div class="items-container mb-6">
            <h4 class="font-bold mb-2">Items (Drag to reorder):</h4>
            <ul id="sortable-items" class="space-y-2">
      `;

      // Create a shuffled array of indices
      const shuffledIndices = Array.from({ length: items.length }, (_, i) => i);
      for (let i = shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIndices[i], shuffledIndices[j]] = [
          shuffledIndices[j],
          shuffledIndices[i],
        ];
      }

      // Display items in shuffled order
      shuffledIndices.forEach((index, i) => {
        questionHtml += `
          <li class="item p-3 bg-white border border-gray-300 rounded-lg cursor-move flex justify-between items-center" 
              data-index="${index}">
            <span>${formatCodeSnippets(items[index])}</span>
            <span class="handle text-gray-400">⋮⋮</span>
          </li>
        `;
      });

      questionHtml += `
            </ul>
          </div>
          <button id="submit-sequence" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            Submit Answer
          </button>
        </div>
      `;
    }

    questionHtml += `</div>`;

    container.innerHTML = questionHtml;

    // Initialize drag and drop functionality if not in feedback mode
    if (!showFeedback) {
      initDragAndDrop();
    }
  }

  // Display match answer question
  function displayMatchAnswerQuestion(
    container,
    currentQuestion,
    userAnswer,
    showFeedback
  ) {
    const columnA = currentQuestion.columnA;
    const columnB = currentQuestion.columnB;

    let questionHtml = `
      <div class="question-block">
        <h3 class="text-xl font-bold mb-4">${
          currentQuestionIndex + 1
        }. ${formatCodeSnippets(currentQuestion.question)}</h3>
    `;

    if (showFeedback) {
      // Show correct matches with feedback
      questionHtml += `
        <div class="correct-matches grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-blue-50 rounded-lg">
            <h4 class="font-bold text-blue-800 mb-2">Column A</h4>
            <ul class="space-y-2">
      `;

      // Display Column A
      columnA.forEach((item, index) => {
        questionHtml += `<li class="p-2 bg-white rounded border border-blue-300">${item}</li>`;
      });

      questionHtml += `
            </ul>
          </div>
          <div class="p-4 bg-blue-50 rounded-lg">
            <h4 class="font-bold text-blue-800 mb-2">Column B</h4>
            <ul class="space-y-2">
      `;

      // Display Column B
      columnB.forEach((item, index) => {
        questionHtml += `<li class="p-2 bg-white rounded border border-blue-300">${item}</li>`;
      });

      questionHtml += `
            </ul>
          </div>
        </div>
        
        <div class="correct-matches p-4 bg-green-50 rounded-lg mb-4">
          <h4 class="font-bold text-green-800 mb-2">Correct Matches:</h4>
          <ul class="space-y-2">
      `;

      // Display correct matches
      currentQuestion.matches.forEach((match) => {
        const leftItem = columnA.find((item) =>
          item.startsWith(match.left + ".")
        );
        const rightItem = columnB.find((item) =>
          item.startsWith(match.right + ".")
        );

        questionHtml += `
          <li class="p-2 bg-white rounded border border-green-300 flex items-center">
            <span class="font-bold mr-2">${match.left}</span> ↔ 
            <span class="font-bold mx-2">${match.right}</span>: 
            <span class="ml-2">${leftItem?.substring(3) || ""}</span> ↔ 
            <span class="ml-2">${rightItem?.substring(3) || ""}</span>
          </li>
        `;
      });

      questionHtml += `</ul></div>`;

      // Show user's answer if available
      if (userAnswer && userAnswer.length) {
        questionHtml += `
          <div class="user-matches p-4 bg-blue-50 rounded-lg mb-4">
            <h4 class="font-bold text-blue-800 mb-2">Your Matches:</h4>
            <ul class="space-y-2">
        `;

        userAnswer.forEach((userMatch) => {
          const correctMatch = currentQuestion.matches.find(
            (m) => m.left === userMatch.left
          );
          const isCorrect =
            correctMatch && correctMatch.right === userMatch.right;

          const leftItem = columnA.find((item) =>
            item.startsWith(userMatch.left + ".")
          );
          const rightItem = columnB.find((item) =>
            item.startsWith(userMatch.right + ".")
          );

          const itemClass = isCorrect
            ? "border-green-500 bg-green-50"
            : "border-red-500 bg-red-50";
          const icon = isCorrect
            ? '<span class="text-green-600 ml-2">✓</span>'
            : '<span class="text-red-600 ml-2">✗</span>';

          questionHtml += `
            <li class="p-2 rounded border ${itemClass} flex items-center">
              <span class="font-bold mr-2">${userMatch.left}</span> ↔ 
              <span class="font-bold mx-2">${userMatch.right}</span>: 
              <span class="ml-2">${leftItem?.substring(3) || ""}</span> ↔ 
              <span class="ml-2">${rightItem?.substring(3) || ""}</span>
              ${icon}
            </li>
          `;
        });

        questionHtml += `</ul></div>`;
      }

      // Show explanations
      if (currentQuestion.explanations && currentQuestion.explanations.length) {
        questionHtml += `
          <div class="explanation mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 class="font-bold text-blue-800">Explanations:</h4>
            <ul class="mt-2 space-y-1">
        `;

        currentQuestion.explanations.forEach((explanation) => {
          questionHtml += `<li class="text-gray-700">${explanation}</li>`;
        });

        questionHtml += `</ul></div>`;
      }
    } else {
      // Show interactive matching interface with lines connecting items
      questionHtml += `
        <div class="match-container relative">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="column-a">
              <h4 class="font-bold text-blue-800 mb-3 text-center">Column A</h4>
              <ul id="column-a-items" class="space-y-4">
        `;

      // Display Column A items - removed connect buttons
      columnA.forEach((item, index) => {
        const itemLetter = item[0]; // A, B, C, or D
        questionHtml += `
            <li class="match-item-a p-3 bg-white rounded border border-blue-300 flex items-center cursor-pointer" 
                data-item="${itemLetter}">
              <span>${formatCodeSnippets(item)}</span>
            </li>
          `;
      });

      questionHtml += `
              </ul>
            </div>
            <div class="column-b">
              <h4 class="font-bold text-blue-800 mb-3 text-center">Column B</h4>
              <ul id="column-b-items" class="space-y-4">
        `;

      // Display Column B items - removed connect buttons
      columnB.forEach((item, index) => {
        const itemNumber = item[0]; // 1, 2, 3, or 4
        questionHtml += `
            <li class="p-3 bg-white rounded border border-blue-300 flex items-center cursor-pointer text-left" 
                data-item="${itemNumber}">
              <span>${item}</span>
            </li>
          `;
      });

      questionHtml += `
              </ul>
            </div>
          </div>
          
          <!-- SVG for drawing connection lines -->
          <svg id="connection-lines" class="absolute top-0 left-0 w-full h-full pointer-events-none" style="z-index: 1;">
            <!-- Connection lines will be drawn here -->
          </svg>
          
          <!-- Current connections display -->
          <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 class="font-bold text-gray-700 mb-2">Your Connections:</h4>
            <ul id="current-connections" class="space-y-2">
              <!-- No connections yet -->
              <li class="text-gray-500 italic" id="no-connections-message">No connections made yet</li>
            </ul>
          </div>
          
          <button id="submit-matches" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            Submit Matches
          </button>
          <button id="reset-matches" class="mt-4 ml-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
            Reset Matches
          </button>
        </div>
      `;
    }

    questionHtml += `</div>`;

    container.innerHTML = questionHtml;

    // Initialize match answer event listeners if not in feedback mode
    if (!showFeedback) {
      initMatchAnswerEvents();
    }
  }

  // Initialize drag and drop functionality
  function initDragAndDrop() {
    const sortableList = document.getElementById("sortable-items");
    if (!sortableList) return;

    // Make list items draggable
    const items = sortableList.querySelectorAll(".item");
    let draggedItem = null;

    items.forEach((item) => {
      // Make item draggable
      item.setAttribute("draggable", "true");

      // Add event listeners
      item.addEventListener("dragstart", function () {
        draggedItem = this;
        setTimeout(() => this.classList.add("dragging"), 0);
      });

      item.addEventListener("dragend", function () {
        this.classList.remove("dragging");
        draggedItem = null;
      });

      item.addEventListener("dragover", function (e) {
        e.preventDefault();
      });

      item.addEventListener("dragenter", function (e) {
        e.preventDefault();
        if (this !== draggedItem) this.classList.add("drag-over");
      });

      item.addEventListener("dragleave", function () {
        this.classList.remove("drag-over");
      });

      item.addEventListener("drop", function (e) {
        e.preventDefault();
        if (this !== draggedItem) {
          const allItems = Array.from(sortableList.querySelectorAll(".item"));
          const draggedPos = allItems.indexOf(draggedItem);
          const droppedPos = allItems.indexOf(this);

          if (draggedPos < droppedPos) {
            sortableList.insertBefore(draggedItem, this.nextSibling);
          } else {
            sortableList.insertBefore(draggedItem, this);
          }

          this.classList.remove("drag-over");
        }
      });
    });

    // Add submit button event listener
    const submitBtn = document.getElementById("submit-sequence");
    submitBtn.addEventListener("click", function () {
      const orderedItems = Array.from(sortableList.querySelectorAll(".item"));
      const userSequence = orderedItems.map((item) =>
        parseInt(item.dataset.index)
      );

      // Submit the answer
      selectDragAndDropAnswer(userSequence);
    });
  }

  // Initialize match answer event listeners
  function initMatchAnswerEvents() {
    // Current state of connections
    const connections = [];
    let selectedItemA = null;

    // Get elements
    const itemsA = document.querySelectorAll(".match-item-a");
    const itemsB = document.querySelectorAll(".match-item-b");
    const connectionsList = document.getElementById("current-connections");
    const noConnectionsMsg = document.getElementById("no-connections-message");
    const submitBtn = document.getElementById("submit-matches");
    const resetBtn = document.getElementById("reset-matches");
    const svg = document.getElementById("connection-lines");

    if (!connectionsList || !submitBtn || !resetBtn || !svg) {
      console.error("Required elements for match answer not found");
      return;
    }

    // Function to update connections display
    function updateConnectionsDisplay() {
      // Clear current connections list
      connectionsList.innerHTML = "";

      if (connections.length === 0) {
        connectionsList.appendChild(noConnectionsMsg);
      } else {
        connections.forEach((conn, index) => {
          const li = document.createElement("li");
          li.className =
            "p-2 bg-white rounded border border-blue-200 flex justify-between items-center";

          // Find the full text of the items
          const itemAText =
            Array.from(itemsA)
              .find((el) => el.dataset.item === conn.left)
              ?.textContent.trim() || "";
          const itemBText =
            Array.from(itemsB)
              .find((el) => el.dataset.item === conn.right)
              ?.textContent.trim() || "";

          li.innerHTML = `
            <div class="flex items-center">
              <span class="font-bold mr-2">${conn.left}</span> ↔ 
              <span class="font-bold mx-2">${conn.right}</span>
            </div>
            <button class="delete-connection px-2 py-1 text-red-600 hover:bg-red-100 rounded transition" 
                    data-index="${index}">
              ✕
            </button>
          `;
          connectionsList.appendChild(li);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll(".delete-connection").forEach((btn) => {
          btn.addEventListener("click", function () {
            const index = parseInt(this.dataset.index);
            connections.splice(index, 1);
            updateConnectionsDisplay();
            drawConnectionLines();
          });
        });
      }
    }

    // Function to draw connection lines
    function drawConnectionLines() {
      // Clear existing lines
      svg.innerHTML = "";

      connections.forEach((conn) => {
        const itemA = Array.from(itemsA).find(
          (el) => el.dataset.item === conn.left
        );
        const itemB = Array.from(itemsB).find(
          (el) => el.dataset.item === conn.right
        );

        if (itemA && itemB) {
          // Get positions
          const rectA = itemA.getBoundingClientRect();
          const rectB = itemB.getBoundingClientRect();
          const svgRect = svg.getBoundingClientRect();

          // Calculate positions relative to SVG
          const x1 = rectA.right - svgRect.left;
          const y1 = rectA.top + rectA.height / 2 - svgRect.top;
          const x2 = rectB.left - svgRect.left;
          const y2 = rectB.top + rectB.height / 2 - svgRect.top;

          // Create line
          const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          line.setAttribute("x1", x1);
          line.setAttribute("y1", y1);
          line.setAttribute("x2", x2);
          line.setAttribute("y2", y2);
          line.setAttribute("stroke", "#3b82f6");
          line.setAttribute("stroke-width", "2");

          svg.appendChild(line);
        }
      });
    }

    // Add event listeners to items in Column A
    itemsA.forEach((item) => {
      item.addEventListener("click", function () {
        const itemLetter = this.dataset.item;

        // Deselect previously selected item
        if (selectedItemA) {
          document.querySelectorAll(".match-item-a").forEach((el) => {
            el.classList.remove("selected-item");
          });
        }

        // Select this item
        selectedItemA = itemLetter;
        this.classList.add("selected-item");
      });
    });

    // Add event listeners to items in Column B
    itemsB.forEach((item) => {
      item.addEventListener("click", function () {
        if (!selectedItemA) {
          alert("Please select an item from Column A first");
          return;
        }

        const itemNumber = this.dataset.item;

        // Check if this connection already exists
        const existingConnection = connections.findIndex(
          (c) => c.left === selectedItemA
        );
        if (existingConnection !== -1) {
          connections[existingConnection].right = itemNumber;
        } else {
          // Add new connection
          connections.push({
            left: selectedItemA,
            right: itemNumber,
          });
        }

        // Reset selection
        document.querySelectorAll(".match-item-a").forEach((el) => {
          el.classList.remove("selected-item");
        });
        selectedItemA = null;

        // Update connections display
        updateConnectionsDisplay();

        // Draw connection lines
        drawConnectionLines();
      });
    });

    // Add event listener to reset button
    resetBtn.addEventListener("click", function () {
      connections.length = 0;
      selectedItemA = null;
      document.querySelectorAll(".match-item-a").forEach((el) => {
        el.classList.remove("selected-item");
      });
      updateConnectionsDisplay();
      drawConnectionLines();
    });

    // Add event listener to submit button
    submitBtn.addEventListener("click", function () {
      const currentQuestion = questions[currentQuestionIndex];

      // Check if all items from Column A are connected
      if (connections.length !== currentQuestion.columnA.length) {
        alert(
          `Please connect all ${currentQuestion.columnA.length} items from Column A before submitting.`
        );
        return;
      }

      // Submit the answer
      selectMatchAnswer(connections);
    });

    // Initialize connections display
    updateConnectionsDisplay();

    // Add window resize listener to redraw lines
    window.addEventListener("resize", drawConnectionLines);
  }

  // Handle multiple choice answer selection
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

  // Handle drag and drop answer selection
  async function selectDragAndDropAnswer(userSequence) {
    // If already answered, don't allow changing
    if (userAnswers[currentQuestionIndex] !== null) return;

    userAnswers[currentQuestionIndex] = userSequence;

    // Check if answer is correct
    const currentQuestion = questions[currentQuestionIndex];
    const correctSequence = currentQuestion.correctSequence.map(
      (num) => num - 1
    ); // Convert to 0-based

    // Check if sequences match
    let isCorrect = true;
    if (userSequence.length === correctSequence.length) {
      for (let i = 0; i < userSequence.length; i++) {
        if (userSequence[i] !== correctSequence[i]) {
          isCorrect = false;
          break;
        }
      }
    } else {
      isCorrect = false;
    }

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
      const quizId = window.currentQuizId;
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

  // Handle match answer selection
  async function selectMatchAnswer(matches) {
    // If already answered, don't allow changing
    if (userAnswers[currentQuestionIndex] !== null) return;

    userAnswers[currentQuestionIndex] = matches;

    // Check if answer is correct
    const currentQuestion = questions[currentQuestionIndex];
    const correctMatches = currentQuestion.matches;

    // Check if all matches are correct
    let isCorrect = true;
    if (matches.length === correctMatches.length) {
      // Create a map of correct matches for easy lookup
      const correctMap = {};
      correctMatches.forEach((match) => {
        correctMap[match.left] = match.right;
      });

      // Check each user match against correct matches
      for (const match of matches) {
        if (correctMap[match.left] !== match.right) {
          isCorrect = false;
          break;
        }
      }
    } else {
      isCorrect = false;
    }

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
      const quizId = window.currentQuizId;
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
    const quizSection = document.getElementById("quiz-section");
    const questionContainer = document.getElementById("question-container");

    if (!questionContainer) {
      console.error("Question container not found in the DOM.");
      return; // Stop execution if elements are missing
    }

    // Remove old color classes
    if (quizSection) {
      quizSection.classList.remove(
        "correct-background",
        "incorrect-background"
      );
    }
    questionContainer.classList.remove(
      "correct-background",
      "incorrect-background"
    );

    // Add new color class
    if (isCorrect) {
      if (quizSection) {
        quizSection.classList.add("correct-background");
      }
      questionContainer.classList.add("correct-background");

      // Gentle shake animation when correct
      if (quizSection) {
        quizSection.classList.add("correct-animation");
        setTimeout(() => {
          quizSection.classList.remove("correct-animation");
        }, 500);
      }
    } else {
      if (quizSection) {
        quizSection.classList.add("incorrect-background");
      }
      questionContainer.classList.add("incorrect-background");

      // Strong shake animation when incorrect
      if (quizSection) {
        quizSection.classList.add("incorrect-animation");
        setTimeout(() => {
          quizSection.classList.remove("incorrect-animation");
        }, 500);
      }
    }

    // Auto reset color after 1.5 seconds
    setTimeout(() => {
      resetBackgroundColor();
    }, 1500);
  }

  // Reset background color to default
  function resetBackgroundColor() {
    const quizSection = document.getElementById("quiz-section");
    const questionContainer = document.getElementById("question-container");

    // Check if elements exist before accessing their classList
    if (quizSection) {
      quizSection.classList.remove(
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

  // Helper function to format code snippets in text
  function formatCodeSnippets(text) {
    if (!text) return "";

    // Remove the reference to undefined 'type' variable
    console.log("formatCodeSnippet called with text length:", text.length);

    // First, escape HTML in the entire text to prevent XSS
    let escapedText = escapeHtml(text);

    // Pattern to match code blocks with language specification: ```language code```
    const codeBlockPattern = /```([a-zA-Z]*)\n([\s\S]*?)```/g;

    // Pattern to match inline code: `code`
    const inlineCodePattern = /`([^`]+)`/g;

    // Replace code blocks
    let formattedText = escapedText.replace(
      codeBlockPattern,
      (match, language, code) => {
        // Create a pre>code block with language class for potential syntax highlighting
        return `<pre class="code-block ${
          language ? "language-" + language : ""
        }"><code>${code}</code></pre>`;
      }
    );

    // Then replace inline code
    formattedText = formattedText.replace(inlineCodePattern, (match, code) => {
      return `<code class="inline-code">${code}</code>`;
    });

    return formattedText;
  }

  // Helper function to escape HTML special characters to prevent XSS
  function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
    formatCodeSnippets,
    escapeHtml,
  };
})();

// Export functions to global scope for HTML onclick handlers
window.nextQuestion = window.quizModule.nextQuestion;
window.previousQuestion = window.quizModule.previousQuestion;
