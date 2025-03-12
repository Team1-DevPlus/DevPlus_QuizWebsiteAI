// IndexedDB database setup and operations
const DB_NAME = "QuizAppDB";
const DB_VERSION = 1;
const QUIZ_STORE = "quizzes";
let db;

// Initialize the database
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject("Error opening database");
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log("Database opened successfully");
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store for quizzes
      if (!db.objectStoreNames.contains(QUIZ_STORE)) {
        const store = db.createObjectStore(QUIZ_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });

        // Create indexes
        store.createIndex("topic", "topic", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });

        console.log("Object store created");
      }
    };
  });
}

// Save a new quiz or update existing one
function saveQuiz(quizData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUIZ_STORE], "readwrite");
    const store = transaction.objectStore(QUIZ_STORE);

    // If quiz has an ID, it's an update
    const request = quizData.id ? store.put(quizData) : store.add(quizData);

    request.onsuccess = (event) => {
      // Return the ID of the saved quiz
      resolve(quizData.id || event.target.result);
    };

    request.onerror = (event) => {
      console.error("Error saving quiz:", event.target.error);
      reject("Failed to save quiz");
    };
  });
}

// Get a quiz by ID
function getQuiz(id) {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error("Database is not initialized yet.");
      reject("Database is not ready");
      return;
    }
    const transaction = db.transaction([QUIZ_STORE], "readonly");
    const store = transaction.objectStore(QUIZ_STORE);
    const request = store.get(id);

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error("Error getting quiz:", event.target.error);
      reject("Failed to get quiz");
    };
  });
}

// Delete a quiz by ID
function deleteQuiz(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUIZ_STORE], "readwrite");
    const store = transaction.objectStore(QUIZ_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (event) => {
      console.error("Error deleting quiz:", event.target.error);
      reject("Failed to delete quiz");
    };
  });
}

// Get all quizzes with optional filter
function getQuizzes(filter = {}) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUIZ_STORE], "readonly");
    const store = transaction.objectStore(QUIZ_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      let results = request.result;

      // Apply filters if provided
      if (filter.status) {
        results = results.filter((quiz) => quiz.status === filter.status);
      }

      if (filter.topic) {
        results = results.filter((quiz) =>
          quiz.topic.toLowerCase().includes(filter.topic.toLowerCase())
        );
      }

      // Sort by timestamp (newest first)
      results.sort((a, b) => b.timestamp - a.timestamp);

      resolve(results);
    };

    request.onerror = (event) => {
      console.error("Error getting quizzes:", event.target.error);
      reject("Failed to get quizzes");
    };
  });
}

// Export functions
window.quizDB = {
  init: initDB,
  saveQuiz,
  getQuiz,
  deleteQuiz,
  getQuizzes,
  get db() {
    return db;
  },
};

// Initialize the database immediately
initDB()
  .then((database) => {
    db = database;
    // Signal that the database is ready
    window.dispatchEvent(new Event("db-ready"));
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
  });
