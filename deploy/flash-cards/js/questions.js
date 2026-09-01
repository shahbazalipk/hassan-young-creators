/**
 * Built-in quiz bank + age-based selection (offline fallback).
 * Bands: 4–6 very_easy, 7–9 easy, 10–12 moderate, 13–15 intermediate, 16+ advanced.
 */

export const DEFAULT_QUESTIONS = [
  // Easy
  {
    id: "e1",
    text: "What color do you get when you mix red and yellow?",
    options: ["Orange", "Purple", "Green", "Blue"],
    correct: 0,
    difficulty: "easy",
  },
  {
    id: "e2",
    text: "How many legs does a cat have?",
    options: ["2", "4", "6", "8"],
    correct: 1,
    difficulty: "easy",
  },
  {
    id: "e3",
    text: "What is 2 + 3?",
    options: ["4", "5", "6", "7"],
    correct: 1,
    difficulty: "easy",
  },
  {
    id: "e4",
    text: "Which animal says “moo”?",
    options: ["Dog", "Cat", "Cow", "Bird"],
    correct: 2,
    difficulty: "easy",
  },
  {
    id: "e5",
    text: "How many days are in a week?",
    options: ["5", "6", "7", "8"],
    correct: 2,
    difficulty: "easy",
  },
  {
    id: "e6",
    text: "Which shape has 3 sides?",
    options: ["Square", "Circle", "Triangle", "Oval"],
    correct: 2,
    difficulty: "easy",
  },
  {
    id: "e7",
    text: "What do bees make?",
    options: ["Milk", "Honey", "Bread", "Juice"],
    correct: 1,
    difficulty: "easy",
  },
  {
    id: "e8",
    text: "Which is bigger: 9 or 4?",
    options: ["4", "9", "Same", "0"],
    correct: 1,
    difficulty: "easy",
  },
  {
    id: "e9",
    text: "What do you use to write on paper?",
    options: ["Spoon", "Pencil", "Shoe", "Ball"],
    correct: 1,
    difficulty: "easy",
  },
  {
    id: "e10",
    text: "The sun rises in the…",
    options: ["West", "North", "East", "South"],
    correct: 2,
    difficulty: "easy",
  },
  {
    id: "e11",
    text: "How many fingers are on one hand?",
    options: ["3", "4", "5", "10"],
    correct: 2,
    difficulty: "easy",
  },
  {
    id: "e12",
    text: "Which fruit is yellow and curved?",
    options: ["Apple", "Banana", "Grape", "Cherry"],
    correct: 1,
    difficulty: "easy",
  },
  {
    id: "e13",
    text: "What is 10 − 1?",
    options: ["8", "9", "11", "7"],
    correct: 1,
    difficulty: "easy",
  },
  {
    id: "e14",
    text: "Which animal can fly?",
    options: ["Fish", "Elephant", "Bird", "Frog"],
    correct: 2,
    difficulty: "easy",
  },
  {
    id: "e15",
    text: "Ice is made of frozen…",
    options: ["Sand", "Water", "Air", "Fire"],
    correct: 1,
    difficulty: "easy",
  },
  {
    id: "e16",
    text: "What comes after Monday?",
    options: ["Sunday", "Tuesday", "Friday", "Saturday"],
    correct: 1,
    difficulty: "easy",
  },
  {
    id: "e17",
    text: "A baby dog is called a…",
    options: ["Kitten", "Cub", "Puppy", "Chick"],
    correct: 2,
    difficulty: "easy",
  },
  {
    id: "e18",
    text: "How many wheels does a bicycle have?",
    options: ["1", "2", "3", "4"],
    correct: 1,
    difficulty: "easy",
  },
  {
    id: "e19",
    text: "Which season is usually the coldest?",
    options: ["Summer", "Spring", "Winter", "Autumn"],
    correct: 2,
    difficulty: "easy",
  },
  {
    id: "e20",
    text: "What is 4 + 4?",
    options: ["6", "7", "8", "9"],
    correct: 2,
    difficulty: "easy",
  },

  // Medium
  {
    id: "m1",
    text: "What is 7 × 6?",
    options: ["36", "42", "48", "56"],
    correct: 1,
    difficulty: "medium",
  },
  {
    id: "m2",
    text: "How many continents are there on Earth?",
    options: ["5", "6", "7", "8"],
    correct: 2,
    difficulty: "medium",
  },
  {
    id: "m3",
    text: "What planet do we live on?",
    options: ["Mars", "Venus", "Earth", "Jupiter"],
    correct: 2,
    difficulty: "medium",
  },
  {
    id: "m4",
    text: "A hexagon has how many sides?",
    options: ["5", "6", "7", "8"],
    correct: 1,
    difficulty: "medium",
  },
  {
    id: "m5",
    text: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Rome"],
    correct: 2,
    difficulty: "medium",
  },
  {
    id: "m6",
    text: "Which gas do plants absorb?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"],
    correct: 2,
    difficulty: "medium",
  },
  {
    id: "m7",
    text: "What is 144 ÷ 12?",
    options: ["10", "11", "12", "14"],
    correct: 2,
    difficulty: "medium",
  },
  {
    id: "m8",
    text: "Which ocean is the largest?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correct: 3,
    difficulty: "medium",
  },
  {
    id: "m9",
    text: "How many minutes are in 2 hours?",
    options: ["60", "90", "120", "180"],
    correct: 2,
    difficulty: "medium",
  },
  {
    id: "m10",
    text: "What is H2O commonly known as?",
    options: ["Salt", "Water", "Sugar", "Air"],
    correct: 1,
    difficulty: "medium",
  },
  {
    id: "m11",
    text: "Which animal is a mammal?",
    options: ["Shark", "Eagle", "Dolphin", "Crocodile"],
    correct: 2,
    difficulty: "medium",
  },
  {
    id: "m12",
    text: "What is 15% of 200?",
    options: ["20", "25", "30", "35"],
    correct: 2,
    difficulty: "medium",
  },
  {
    id: "m13",
    text: "Who painted the Mona Lisa?",
    options: ["Picasso", "Van Gogh", "Da Vinci", "Rembrandt"],
    correct: 2,
    difficulty: "medium",
  },
  {
    id: "m14",
    text: "How many degrees in a right angle?",
    options: ["45", "90", "180", "360"],
    correct: 1,
    difficulty: "medium",
  },
  {
    id: "m15",
    text: "Which is a prime number?",
    options: ["9", "15", "21", "17"],
    correct: 3,
    difficulty: "medium",
  },
  {
    id: "m16",
    text: "The fastest land animal is the…",
    options: ["Lion", "Cheetah", "Horse", "Wolf"],
    correct: 1,
    difficulty: "medium",
  },
  {
    id: "m17",
    text: "What is the square root of 81?",
    options: ["7", "8", "9", "10"],
    correct: 2,
    difficulty: "medium",
  },
  {
    id: "m18",
    text: "Which organ pumps blood?",
    options: ["Lungs", "Brain", "Heart", "Liver"],
    correct: 2,
    difficulty: "medium",
  },
  {
    id: "m19",
    text: "How many sides does an octagon have?",
    options: ["6", "7", "8", "10"],
    correct: 2,
    difficulty: "medium",
  },
  {
    id: "m20",
    text: "Which language has the most native speakers?",
    options: ["English", "Spanish", "Mandarin Chinese", "Hindi"],
    correct: 2,
    difficulty: "medium",
  },

  // Hard
  {
    id: "h1",
    text: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correct: 2,
    difficulty: "hard",
  },
  {
    id: "h2",
    text: "Solve: 3² + 4² = ?",
    options: ["12", "25", "49", "7"],
    correct: 1,
    difficulty: "hard",
  },
  {
    id: "h3",
    text: "Which planet has the most moons (known)?",
    options: ["Earth", "Mars", "Saturn", "Mercury"],
    correct: 2,
    difficulty: "hard",
  },
  {
    id: "h4",
    text: "What is the speed of light approximately?",
    options: ["300 km/s", "3,000 km/s", "300,000 km/s", "3 million km/s"],
    correct: 2,
    difficulty: "hard",
  },
  {
    id: "h5",
    text: "Who developed the theory of relativity?",
    options: ["Newton", "Einstein", "Tesla", "Galileo"],
    correct: 1,
    difficulty: "hard",
  },
  {
    id: "h6",
    text: "What is the value of π rounded to 2 decimals?",
    options: ["3.12", "3.14", "3.16", "3.41"],
    correct: 1,
    difficulty: "hard",
  },
  {
    id: "h7",
    text: "DNA stands for…",
    options: [
      "Dynamic Nuclear Acid",
      "Deoxyribonucleic Acid",
      "Digital Nerve Array",
      "Dual Nitrogen Atom",
    ],
    correct: 1,
    difficulty: "hard",
  },
  {
    id: "h8",
    text: "What is 2⁵?",
    options: ["10", "16", "25", "32"],
    correct: 3,
    difficulty: "hard",
  },
  {
    id: "h9",
    text: "Which country has the most time zones?",
    options: ["USA", "Russia", "France", "China"],
    correct: 2,
    difficulty: "hard",
  },
  {
    id: "h10",
    text: "The process plants use to make food is called…",
    options: ["Respiration", "Photosynthesis", "Fermentation", "Digestion"],
    correct: 1,
    difficulty: "hard",
  },
  {
    id: "h11",
    text: "What is the smallest prime number?",
    options: ["0", "1", "2", "3"],
    correct: 2,
    difficulty: "hard",
  },
  {
    id: "h12",
    text: "Which element has atomic number 1?",
    options: ["Helium", "Hydrogen", "Carbon", "Oxygen"],
    correct: 1,
    difficulty: "hard",
  },
  {
    id: "h13",
    text: "In a right triangle, a² + b² = c² is…",
    options: ["Newton’s law", "Ohm’s law", "Pythagorean theorem", "Bernoulli’s principle"],
    correct: 2,
    difficulty: "hard",
  },
  {
    id: "h14",
    text: "What year did World War II end?",
    options: ["1918", "1939", "1945", "1965"],
    correct: 2,
    difficulty: "hard",
  },
  {
    id: "h15",
    text: "Which gas makes up most of Earth’s atmosphere?",
    options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Argon"],
    correct: 2,
    difficulty: "hard",
  },
  {
    id: "h16",
    text: "Solve for x: 2x + 6 = 20",
    options: ["5", "6", "7", "8"],
    correct: 2,
    difficulty: "hard",
  },
  {
    id: "h17",
    text: "The longest river in the world is often considered the…",
    options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
    correct: 1,
    difficulty: "hard",
  },
  {
    id: "h18",
    text: "What is the boiling point of water at sea level (°C)?",
    options: ["90", "100", "110", "212"],
    correct: 1,
    difficulty: "hard",
  },
  {
    id: "h19",
    text: "Which bone protects the brain?",
    options: ["Ribs", "Spine", "Skull", "Pelvis"],
    correct: 2,
    difficulty: "hard",
  },
  {
    id: "h20",
    text: "Binary number 1010 equals decimal…",
    options: ["8", "9", "10", "12"],
    correct: 2,
    difficulty: "hard",
  },
];

/** Dedicated 7–9 easy offline bank (legacy DEFAULT used easy/medium/hard labels). */
export const EASY_BAND_QUESTIONS = [
  {
    id: "ea1",
    text: "What is 8 + 7?",
    options: ["14", "15", "16", "17"],
    correct: 1,
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
  },
  {
    id: "ea2",
    text: "How many sides does a square have?",
    options: ["3", "4", "5", "6"],
    correct: 1,
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
  },
  {
    id: "ea3",
    text: "Which planet do we live on?",
    options: ["Mars", "Earth", "Jupiter", "Venus"],
    correct: 1,
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
  },
  {
    id: "ea4",
    text: "What is 20 − 9?",
    options: ["9", "10", "11", "12"],
    correct: 2,
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
  },
  {
    id: "ea5",
    text: "A week has how many days?",
    options: ["5", "6", "7", "8"],
    correct: 2,
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
  },
  {
    id: "ea6",
    text: "Which animal is known for hopping?",
    options: ["Elephant", "Kangaroo", "Whale", "Snake"],
    correct: 1,
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
  },
  {
    id: "ea7",
    text: "What is 6 × 3?",
    options: ["12", "15", "18", "21"],
    correct: 2,
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
  },
  {
    id: "ea8",
    text: "Ice is frozen…",
    options: ["Sand", "Water", "Air", "Metal"],
    correct: 1,
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
  },
  {
    id: "ea9",
    text: "Which word means the opposite of “big”?",
    options: ["Huge", "Small", "Tall", "Wide"],
    correct: 1,
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
  },
  {
    id: "ea10",
    text: "How many months are in a year?",
    options: ["10", "11", "12", "13"],
    correct: 2,
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
  },
  {
    id: "ea11",
    text: "What do bees make?",
    options: ["Milk", "Honey", "Bread", "Juice"],
    correct: 1,
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
  },
  {
    id: "ea12",
    text: "A triangle has how many sides?",
    options: ["2", "3", "4", "5"],
    correct: 1,
    difficulty: "easy",
    minAge: 7,
    maxAge: 9,
  },
];

// Remap legacy labels onto product vocabulary for offline selection.
for (const q of DEFAULT_QUESTIONS) {
  if (q.difficulty === "easy") {
    q.difficulty = "very_easy";
    q.minAge = 4;
    q.maxAge = 6;
  } else if (q.difficulty === "medium") {
    q.difficulty = "moderate";
    q.minAge = 10;
    q.maxAge = 12;
  } else if (q.difficulty === "hard") {
    q.difficulty = "intermediate";
    q.minAge = 13;
    q.maxAge = 15;
  }
}

DEFAULT_QUESTIONS.push(...EASY_BAND_QUESTIONS);

export function ageToDifficulty(age) {
  const n = Number(age);
  if (n <= 6) return "very_easy";
  if (n <= 9) return "easy";
  if (n <= 12) return "moderate";
  if (n <= 15) return "intermediate";
  return "advanced";
}

export function ageToBand(age) {
  const n = Number(age);
  if (n <= 6) return { id: "4-6", min: 4, max: 6, difficulty: "very_easy" };
  if (n <= 9) return { id: "7-9", min: 7, max: 9, difficulty: "easy" };
  if (n <= 12) return { id: "10-12", min: 10, max: 12, difficulty: "moderate" };
  if (n <= 15) return { id: "13-15", min: 13, max: 15, difficulty: "intermediate" };
  return { id: "16+", min: 16, max: 120, difficulty: "advanced" };
}

/** Map legacy bank labels onto the new difficulty vocabulary. */
function normalizeDifficulty(d) {
  const x = String(d || "").toLowerCase();
  if (x === "very_easy" || x === "very-easy") return "very_easy";
  if (x === "easy") return "easy";
  if (x === "moderate" || x === "medium") return "moderate";
  if (x === "intermediate" || x === "hard" || x === "medium_hard") return "intermediate";
  if (x === "advanced") return "advanced";
  return x;
}

function preferredDifficulties(bandDifficulty) {
  if (bandDifficulty === "very_easy") return ["very_easy", "easy"];
  if (bandDifficulty === "easy") return ["easy", "very_easy"];
  if (bandDifficulty === "moderate") return ["moderate", "easy", "very_easy"];
  if (bandDifficulty === "intermediate") return ["intermediate", "moderate", "easy"];
  return ["advanced", "intermediate", "moderate"];
}

/**
 * Local fallback selector (used only if cloud quiz API is unavailable).
 * NEVER spills to harder/older bands for younger children.
 */
export function selectQuestions(allQuestions, age, count, options = {}) {
  const band = ageToBand(age);
  const exclude = new Set(options.excludeIds || []);
  const used = new Set();
  const preferred = preferredDifficulties(band.difficulty);
  const allowed = new Set(preferred);

  const ageSafe = allQuestions.filter((q) => {
    if (!q?.id || exclude.has(q.id)) return false;
    const diff = normalizeDifficulty(q.difficulty);
    if (!allowed.has(diff)) return false;
    if (typeof q.minAge === "number" && typeof q.maxAge === "number") {
      if (age >= q.minAge && age <= q.maxAge) return true;
      // Soft lower-band: older learners may see easier questions, never harder.
      return age > q.maxAge && q.maxAge <= band.max;
    }
    // Legacy bank without min/max: map old labels by band.
    if (band.difficulty === "very_easy") return diff === "very_easy" || diff === "easy";
    if (band.difficulty === "easy") return diff === "easy" || diff === "very_easy";
    if (band.difficulty === "moderate") return diff === "moderate" || diff === "easy";
    if (band.difficulty === "intermediate") {
      return diff === "intermediate" || diff === "moderate";
    }
    return diff === "advanced" || diff === "intermediate" || diff === "moderate";
  });

  const picked = [];
  for (const diff of preferred) {
    const pool = shuffle(
      ageSafe.filter((q) => normalizeDifficulty(q.difficulty) === diff && !used.has(q.id))
    );
    for (const q of pool) {
      if (picked.length >= count) break;
      used.add(q.id);
      picked.push(q);
    }
    if (picked.length >= count) break;
  }

  // Deduplicate by id (safety)
  const unique = [];
  const seen = new Set();
  for (const q of shuffle(picked)) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    unique.push(q);
    if (unique.length >= count) break;
  }
  return unique;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createQuestionId() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
