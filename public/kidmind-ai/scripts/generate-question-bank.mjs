#!/usr/bin/env node
/** Generates question-bank-data.js from structured age-tiered content */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function q(id, ageMin, ageMax, difficulty, subject, topic, question, options, correctIndex, explanation) {
  return {
    id,
    ageMin,
    ageMax,
    difficulty,
    subject,
    topic,
    category: subject,
    question,
    options,
    correctIndex,
    explanation
  };
}

const bank = [];

function addTier(ageMin, ageMax, difficulty, items) {
  items.forEach(function (item) {
    bank.push(q(
      item[0], ageMin, ageMax, difficulty, item[1], item[2], item[3], item[4], item[5], item[6]
    ));
  });
}

/* Ages 5–6: very_easy */
addTier(5, 6, "very_easy", [
  ["q_56_col_01", "Colors", "Primary Colors", "What color do you get when you mix blue and yellow?", ["Green", "Purple", "Orange", "Pink"], 0, "Blue and yellow make green."],
  ["q_56_col_02", "Colors", "Color Names", "Which color is a ripe strawberry?", ["Blue", "Red", "Gray", "Brown"], 1, "Ripe strawberries are red."],
  ["q_56_col_03", "Colors", "Color Names", "What color is grass?", ["Green", "Purple", "Black", "Silver"], 0, "Healthy grass is usually green."],
  ["q_56_col_04", "Colors", "Rainbow", "How many main colors are in a rainbow?", ["3", "5", "7", "10"], 2, "A rainbow has seven main colors."],
  ["q_56_col_05", "Colors", "Color Names", "Which color is the sun?", ["Yellow", "Green", "Pink", "Gray"], 0, "The sun looks yellow in the sky."],
  ["q_56_col_06", "Colors", "Color Names", "Snow is usually what color?", ["White", "Red", "Orange", "Purple"], 0, "Fresh snow looks white."],
  ["q_56_an_01", "Animals", "Farm Animals", "Which animal says 'woof'?", ["Cat", "Dog", "Cow", "Duck"], 1, "Dogs bark and say woof."],
  ["q_56_an_02", "Animals", "Farm Animals", "Which animal gives us milk?", ["Fish", "Cow", "Snake", "Bee"], 1, "Cows give us milk."],
  ["q_56_an_03", "Animals", "Pets", "Which animal has whiskers and says 'meow'?", ["Dog", "Cat", "Horse", "Hen"], 1, "Cats say meow."],
  ["q_56_an_04", "Animals", "Birds", "Which animal can fly and has feathers?", ["Fish", "Bird", "Frog", "Worm"], 1, "Birds have feathers and can fly."],
  ["q_56_an_05", "Animals", "Wild Animals", "Which animal is the king of the jungle?", ["Tiger", "Lion", "Bear", "Fox"], 1, "Lions are called the king of the jungle."],
  ["q_56_an_06", "Animals", "Body Parts", "How many legs does a spider have?", ["4", "6", "8", "10"], 2, "Most spiders have eight legs."],
  ["q_56_fr_01", "Fruits", "Fruit Names", "Which fruit is yellow and monkeys love it?", ["Apple", "Banana", "Grape", "Cherry"], 1, "Bananas are yellow and sweet."],
  ["q_56_fr_02", "Fruits", "Fruit Names", "Which fruit is red and often grows on trees?", ["Banana", "Apple", "Lemon", "Coconut"], 1, "Apples are often red."],
  ["q_56_fr_03", "Fruits", "Fruit Names", "Which fruit is small, round, and purple or green?", ["Mango", "Grape", "Melon", "Peach"], 1, "Grapes grow in bunches."],
  ["q_56_fr_04", "Fruits", "Fruit Names", "Oranges are mostly what color?", ["Orange", "Blue", "Black", "White"], 0, "Oranges are orange in color."],
  ["q_56_fr_05", "Fruits", "Healthy Eating", "Fruits are good for your ___?", ["Body", "Shoes", "Bed", "Toys"], 0, "Fruits have vitamins that help your body."],
  ["q_56_nu_01", "Numbers", "Counting", "What number comes after 9?", ["8", "10", "11", "7"], 1, "After 9 comes 10."],
  ["q_56_nu_02", "Numbers", "Counting", "How many eyes do you have?", ["1", "2", "3", "4"], 1, "Most people have two eyes."],
  ["q_56_nu_03", "Numbers", "Counting", "What number comes between 4 and 6?", ["3", "5", "7", "8"], 1, "5 is between 4 and 6."],
  ["q_56_nu_04", "Numbers", "Counting", "How many wheels does a bicycle have?", ["1", "2", "3", "4"], 1, "A bicycle has two wheels."],
  ["q_56_nu_05", "Numbers", "Counting", "Which is the smallest number?", ["1", "5", "9", "10"], 0, "1 is the smallest here."],
  ["q_56_sh_01", "Shapes", "Basic Shapes", "Which shape has three sides?", ["Circle", "Square", "Triangle", "Star"], 2, "A triangle has three sides."],
  ["q_56_sh_02", "Shapes", "Basic Shapes", "Which shape is round like a ball?", ["Square", "Circle", "Triangle", "Rectangle"], 1, "A circle is round."],
  ["q_56_sh_03", "Shapes", "Basic Shapes", "A square has how many sides?", ["3", "4", "5", "6"], 1, "A square has four equal sides."],
  ["q_56_sh_04", "Shapes", "Basic Shapes", "Which shape looks like a door?", ["Circle", "Rectangle", "Triangle", "Oval"], 1, "Many doors are rectangle shaped."],
  ["q_56_ma_01", "Basic Math", "Addition", "What is 1 + 2?", ["2", "3", "4", "5"], 1, "1 + 2 = 3."],
  ["q_56_ma_02", "Basic Math", "Addition", "What is 2 + 2?", ["3", "4", "5", "6"], 1, "2 + 2 = 4."],
  ["q_56_ma_03", "Basic Math", "Addition", "What is 3 + 1?", ["3", "4", "5", "2"], 1, "3 + 1 = 4."],
  ["q_56_ma_04", "Basic Math", "Subtraction", "What is 5 − 2?", ["2", "3", "4", "1"], 1, "5 − 2 = 3."],
  ["q_56_ma_05", "Basic Math", "Counting", "If you have 4 candies and eat 1, how many are left?", ["2", "3", "4", "5"], 1, "4 − 1 = 3 candies left."],
  ["q_56_al_01", "Alphabet", "Letters", "Which letter does 'Ball' start with?", ["A", "B", "C", "D"], 1, "Ball starts with B."],
  ["q_56_al_02", "Alphabet", "Letters", "Which letter does 'Dog' start with?", ["B", "C", "D", "E"], 2, "Dog starts with D."],
  ["q_56_al_03", "Alphabet", "Vowels", "Which of these is a vowel?", ["B", "T", "A", "K"], 2, "A is a vowel (A, E, I, O, U)."],
  ["q_56_al_04", "Alphabet", "Letters", "How many letters are in the English alphabet?", ["10", "20", "26", "30"], 2, "There are 26 letters in the English alphabet."],
  ["q_56_al_05", "Alphabet", "Letters", "Which letter comes after M?", ["L", "N", "O", "P"], 1, "N comes after M."],
  ["q_56_en_01", "English", "Simple Words", "What is the opposite of 'hot'?", ["Warm", "Cold", "Big", "Fast"], 1, "Cold is the opposite of hot."],
  ["q_56_en_02", "English", "Simple Words", "Which word names a thing you read?", ["Spoon", "Book", "Shoe", "Hat"], 1, "A book is something you read."],
  ["q_56_sc_01", "Science", "Nature", "What do plants need from the sun?", ["Light", "Shoes", "Toys", "Music"], 0, "Plants need sunlight to grow."],
  ["q_56_sc_02", "Science", "Weather", "Rain comes from ___?", ["Clouds", "Rocks", "Cars", "Books"], 0, "Rain falls from clouds."],
  ["q_56_lo_01", "Logic", "Patterns", "What comes next: 1, 2, 3, ___?", ["2", "4", "5", "1"], 1, "The pattern counts up: 4 comes next."],
  ["q_56_lo_02", "Logic", "Odd One Out", "Which is not a fruit: apple, banana, car, grape?", ["Apple", "Banana", "Car", "Grape"], 2, "A car is not a fruit."]
]);

/* Ages 7–8: easy */
addTier(7, 8, "easy", [
  ["q_78_ma_01", "Math", "Addition", "What is 15 + 7?", ["20", "21", "22", "23"], 2, "15 + 7 = 22."],
  ["q_78_ma_02", "Math", "Subtraction", "What is 20 − 8?", ["10", "11", "12", "13"], 2, "20 − 8 = 12."],
  ["q_78_ma_03", "Math", "Addition", "What is 9 + 6?", ["14", "15", "16", "13"], 1, "9 + 6 = 15."],
  ["q_78_ma_04", "Math", "Subtraction", "What is 18 − 9?", ["8", "9", "10", "7"], 1, "18 − 9 = 9."],
  ["q_78_ma_05", "Math", "Place Value", "In the number 47, what does the 4 stand for?", ["4", "40", "47", "7"], 1, "The 4 is in the tens place, so it means 40."],
  ["q_78_ma_06", "Math", "Addition", "What is 25 + 13?", ["36", "37", "38", "39"], 2, "25 + 13 = 38."],
  ["q_78_sc_01", "Science", "Human Body", "Which organ helps you breathe?", ["Heart", "Lungs", "Stomach", "Skin"], 1, "Lungs help you breathe air."],
  ["q_78_sc_02", "Science", "Animals", "Do fish live in water or on land?", ["Water", "Land", "Sky", "Trees"], 0, "Fish live in water."],
  ["q_78_sc_03", "Science", "Materials", "Is ice solid or liquid water?", ["Solid", "Liquid", "Gas", "Plasma"], 0, "Ice is frozen solid water."],
  ["q_78_sc_04", "Science", "Plants", "Which part of a plant is usually underground?", ["Leaf", "Flower", "Root", "Petal"], 2, "Roots grow underground."],
  ["q_78_sc_05", "Science", "Space", "What star gives Earth light and heat?", ["Moon", "Sun", "Mars", "Polaris"], 1, "The sun gives us light and heat."],
  ["q_78_gk_01", "General Knowledge", "Geography", "Which is a continent?", ["Paris", "Africa", "Pacific", "Everest"], 1, "Africa is a continent."],
  ["q_78_gk_02", "General Knowledge", "Countries", "What country is famous for the kangaroo?", ["Canada", "Australia", "Japan", "Egypt"], 1, "Kangaroos live in Australia."],
  ["q_78_gk_03", "General Knowledge", "Landmarks", "The Eiffel Tower is in which city?", ["London", "Paris", "Rome", "Berlin"], 1, "The Eiffel Tower is in Paris, France."],
  ["q_78_gk_04", "General Knowledge", "Sports", "How many players are on a soccer team on the field?", ["5", "7", "11", "15"], 2, "A soccer team fields 11 players."],
  ["q_78_vo_01", "Vocabulary", "Synonyms", "Which word means the same as 'big'?", ["Small", "Large", "Tiny", "Short"], 1, "Large means the same as big."],
  ["q_78_vo_02", "Vocabulary", "Antonyms", "What is the opposite of 'happy'?", ["Glad", "Sad", "Joyful", "Excited"], 1, "Sad is the opposite of happy."],
  ["q_78_vo_03", "Vocabulary", "Spelling", "Which word is spelled correctly?", ["Frend", "Friend", "Freind", "Frind"], 1, "Friend is spelled correctly."],
  ["q_78_vo_04", "Vocabulary", "Word Meaning", "A 'library' is a place for ___?", ["Swimming", "Books", "Cooking", "Driving"], 1, "Libraries hold books to borrow and read."],
  ["q_78_lo_01", "Logic", "Sequences", "What comes next: 5, 10, 15, ___?", ["16", "18", "20", "25"], 2, "The pattern adds 5 each time."],
  ["q_78_lo_02", "Logic", "Odd One Out", "Which does not belong: circle, square, triangle, apple?", ["Circle", "Square", "Triangle", "Apple"], 3, "Apple is not a shape."],
  ["q_78_lo_03", "Logic", "Reasoning", "If today is Monday, what day is tomorrow?", ["Sunday", "Tuesday", "Wednesday", "Friday"], 1, "The day after Monday is Tuesday."],
  ["q_78_lo_04", "Logic", "Patterns", "Complete: A, B, C, ___?", ["E", "D", "F", "G"], 1, "D comes after C in the alphabet."],
  ["q_78_en_01", "English", "Grammar", "Which is a complete sentence?", ["Running fast.", "The cat sleeps.", "Under the table.", "Blue sky."], 1, "It has a subject and verb."],
  ["q_78_en_02", "English", "Grammar", "Which word is a verb?", ["Jump", "Table", "Happy", "Blue"], 0, "Jump is an action word — a verb."],
  ["q_78_en_03", "English", "Punctuation", "Which sentence asks a question?", ["I like pizza.", "Do you like pizza?", "Pizza is tasty.", "Eat pizza."], 1, "It ends with a question mark."],
  ["q_78_hb_01", "Good Habits", "Health", "Why brush your teeth?", ["Keep teeth healthy", "Grow taller instantly", "Skip school", "Stay awake all night"], 0, "Brushing keeps teeth clean and healthy."],
  ["q_78_hb_02", "Good Habits", "Safety", "What should you do at a red traffic light?", ["Run", "Stop", "Jump", "Sleep"], 1, "Red means stop."],
  ["q_78_pa_01", "Physical Activity", "Exercise", "Running helps make your ___ stronger.", ["Heart", "Hair", "Nails only", "Eyelashes"], 0, "Running is good for your heart."],
  ["q_78_pa_02", "Physical Activity", "Sports", "Before sports, you should ___?", ["Warm up", "Eat candy only", "Skip water", "Never move"], 0, "Warming up helps prevent injury."]
]);

/* Ages 9–10: medium */
addTier(9, 10, "medium", [
  ["q_910_ma_01", "Math", "Multiplication", "What is 6 × 4?", ["20", "22", "24", "26"], 2, "6 × 4 = 24."],
  ["q_910_ma_02", "Math", "Multiplication", "What is 8 × 7?", ["54", "55", "56", "58"], 2, "8 × 7 = 56."],
  ["q_910_ma_03", "Math", "Division", "What is 36 ÷ 6?", ["5", "6", "7", "8"], 1, "36 ÷ 6 = 6."],
  ["q_910_ma_04", "Math", "Division", "What is 45 ÷ 5?", ["7", "8", "9", "10"], 2, "45 ÷ 5 = 9."],
  ["q_910_ma_05", "Math", "Fractions", "What is half of 50?", ["20", "25", "30", "40"], 1, "Half of 50 is 25."],
  ["q_910_ma_06", "Math", "Geometry", "How many degrees in a right angle?", ["45", "90", "180", "360"], 1, "A right angle is 90 degrees."],
  ["q_910_ge_01", "Geography", "Capitals", "What is the capital of the United Kingdom?", ["Paris", "London", "Dublin", "Rome"], 1, "London is the capital of the UK."],
  ["q_910_ge_02", "Geography", "Continents", "Which is the largest continent?", ["Europe", "Asia", "Australia", "Antarctica"], 1, "Asia is the largest continent."],
  ["q_910_ge_03", "Geography", "Landforms", "A very dry area with little rain is a ___?", ["Desert", "River", "Lake", "Forest"], 0, "Deserts are dry regions."],
  ["q_910_ge_04", "Geography", "Maps", "North is usually at the ___ of a map.", ["Bottom", "Top", "Middle", "Side only"], 1, "Maps usually show north at the top."],
  ["q_910_hi_01", "History", "Ancient World", "The pyramids were built in ancient ___?", ["Mexico", "Egypt", "China", "Brazil"], 1, "Famous pyramids are in Egypt."],
  ["q_910_hi_02", "History", "Explorers", "Who sailed to America in 1492?", ["Columbus", "Einstein", "Shakespeare", "Newton"], 0, "Christopher Columbus sailed in 1492."],
  ["q_910_hi_03", "History", "Inventions", "The wheel is an important early ___?", ["Invention", "Animal", "Planet", "Ocean"], 0, "The wheel was a key invention."],
  ["q_910_sc_01", "Science", "Matter", "Water can be solid, liquid, or ___?", ["Gas", "Wood", "Metal", "Rock"], 0, "Water can exist as ice, liquid, or vapor (gas)."],
  ["q_910_sc_02", "Science", "Electricity", "Which material conducts electricity well?", ["Rubber", "Copper", "Plastic", "Wood"], 1, "Copper is a good conductor."],
  ["q_910_sc_03", "Science", "Biology", "The human body has how many main senses?", ["3", "5", "7", "10"], 1, "Sight, hearing, smell, taste, and touch — five senses."],
  ["q_910_sc_04", "Science", "Earth Science", "Earth rotates around the ___?", ["Moon", "Sun", "Mars", "Jupiter"], 1, "Earth orbits the sun."],
  ["q_910_en_01", "English Grammar", "Parts of Speech", "Which word is an adjective in 'The tall tree'?", ["The", "Tall", "Tree", "None"], 1, "Tall describes the tree."],
  ["q_910_en_02", "English Grammar", "Tenses", "What is the past tense of 'walk'?", ["Walked", "Walking", "Walks", "Walken"], 0, "The past tense of walk is walked."],
  ["q_910_en_03", "English Grammar", "Punctuation", "Where does a comma belong in a list?", ["Between items", "Inside every word", "Only at the end", "Never"], 0, "Commas separate items in a list."],
  ["q_910_en_04", "English Grammar", "Plurals", "What is the plural of 'mouse' (animal)?", ["Mouses", "Mice", "Mouse", "Mices"], 1, "The plural of mouse is mice."],
  ["q_910_co_01", "Computer Basics", "Hardware", "Which device shows pictures on a screen?", ["Monitor", "Mouse", "Keyboard", "Speaker"], 0, "A monitor displays images."],
  ["q_910_co_02", "Computer Basics", "Input Devices", "You type letters using a ___?", ["Keyboard", "Printer", "Monitor", "Speaker"], 0, "A keyboard is used for typing."],
  ["q_910_co_03", "Computer Basics", "Internet", "WWW stands for ___?", ["World Wide Web", "Wild Water Wave", "Wide Word Work", "Web Window Wall"], 0, "WWW means World Wide Web."],
  ["q_910_co_04", "Computer Basics", "Software", "Which is an operating system?", ["Windows", "Chair", "Pencil", "Bicycle"], 0, "Windows is a computer operating system."],
  ["q_910_lo_01", "Logic", "Number Patterns", "What comes next: 3, 6, 9, 12, ___?", ["13", "14", "15", "16"], 2, "The pattern adds 3 each time."],
  ["q_910_lo_02", "Logic", "Reasoning", "All squares are rectangles. Is every rectangle a square?", ["Yes", "No", "Sometimes always", "Only blue ones"], 1, "Rectangles are not always squares."],
  ["q_910_gk_01", "General Knowledge", "Science", "Which planet is known as the Red Planet?", ["Venus", "Mars", "Jupiter", "Mercury"], 1, "Mars is called the Red Planet."],
  ["q_910_gk_02", "General Knowledge", "Nature", "Which gas do humans need to breathe?", ["Oxygen", "Helium", "Smoke", "Steam"], 0, "Humans breathe oxygen from the air."]
]);

/* Ages 11–12: medium_hard */
addTier(11, 12, "medium_hard", [
  ["q_1112_ma_01", "Mathematics", "Percentages", "What is 10% of 80?", ["6", "8", "10", "12"], 1, "10% of 80 = 8."],
  ["q_1112_ma_02", "Mathematics", "Algebra", "Solve: x + 5 = 12", ["5", "6", "7", "8"], 2, "x = 12 − 5 = 7."],
  ["q_1112_ma_03", "Mathematics", "Geometry", "Area of a square with side 5 cm?", ["10 cm²", "20 cm²", "25 cm²", "30 cm²"], 2, "Area = 5 × 5 = 25 cm²."],
  ["q_1112_ma_04", "Mathematics", "Ratios", "If the ratio is 2:3 and total is 10, how many for 2 parts?", ["2", "4", "6", "8"], 1, "2 parts out of 5 → 4 of 10."],
  ["q_1112_bi_01", "Biology", "Cells", "What is the basic unit of life?", ["Atom", "Cell", "Rock", "Star"], 1, "The cell is the basic unit of life."],
  ["q_1112_bi_02", "Biology", "Human Body", "Which blood cells fight infection?", ["Red cells", "White cells", "Platelets only", "Plasma only"], 1, "White blood cells fight germs."],
  ["q_1112_bi_03", "Biology", "Photosynthesis", "Plants make food using sunlight in ___?", ["Leaves", "Roots only", "Bark only", "Seeds only"], 0, "Photosynthesis happens mainly in leaves."],
  ["q_1112_ph_01", "Physics", "Forces", "What force pulls objects toward Earth?", ["Gravity", "Magnetism only", "Friction only", "Light"], 0, "Gravity pulls objects toward Earth."],
  ["q_1112_ph_02", "Physics", "Energy", "Sound travels through ___?", ["Vacuum only", "Matter like air", "Nothing", "Only water"], 1, "Sound needs a medium like air to travel."],
  ["q_1112_ph_03", "Physics", "Electricity", "Opposite charges ___ each other.", ["Attract", "Repel always", "Ignore", "Destroy"], 0, "Opposite charges attract."],
  ["q_1112_ch_01", "Chemistry", "Elements", "H2O is the formula for ___?", ["Salt", "Water", "Gold", "Iron"], 1, "H2O is water."],
  ["q_1112_ch_02", "Chemistry", "States", "When liquid water becomes gas, it ___?", ["Evaporates", "Freezes", "Burns", "Rocks"], 0, "Evaporation turns liquid to gas."],
  ["q_1112_ch_03", "Chemistry", "Acids", "Lemon juice is slightly ___?", ["Acidic", "Alkaline only", "Neutral always", "Solid metal"], 0, "Lemon juice is acidic."],
  ["q_1112_wg_01", "World Geography", "Oceans", "Which ocean is between America and Europe?", ["Atlantic", "Indian", "Arctic", "Pacific only"], 0, "The Atlantic lies between Europe and the Americas."],
  ["q_1112_wg_02", "World Geography", "Countries", "Mount Fuji is in ___?", ["China", "Japan", "India", "Thailand"], 1, "Mount Fuji is in Japan."],
  ["q_1112_wg_03", "World Geography", "Climate", "The equator is a line around Earth's ___?", ["Middle", "North Pole", "South Pole only", "Moon"], 0, "The equator circles Earth's middle."],
  ["q_1112_cd_01", "Coding Basics", "Programming", "A loop in code repeats ___?", ["Instructions", "Electricity", "Paper", "Colors"], 0, "Loops repeat instructions."],
  ["q_1112_cd_02", "Coding Basics", "Programming", "In coding, a 'bug' means a ___?", ["Error", "Insect only", "Success", "Keyboard"], 0, "A bug is an error in code."],
  ["q_1112_cd_03", "Coding Basics", "Binary", "Computers use 0 and 1 called ___?", ["Binary", "Rainbow", "Decimal only", "Letters only"], 0, "Binary uses 0s and 1s."],
  ["q_1112_ai_01", "AI Basics", "Machine Learning", "AI learns from ___?", ["Data", "Magic", "Silence only", "Empty boxes"], 0, "AI systems learn patterns from data."],
  ["q_1112_ai_02", "AI Basics", "Applications", "Voice assistants like Siri use ___?", ["Artificial Intelligence", "Only batteries", "Paper maps", "Chalk"], 0, "Voice assistants use AI technology."],
  ["q_1112_ai_03", "AI Basics", "Ethics", "AI should be used ___?", ["Responsibly", "To cheat always", "Without rules", "To harm others"], 0, "AI should be used responsibly and safely."],
  ["q_1112_ct_01", "Critical Thinking", "Logic", "Evidence helps you make better ___?", ["Decisions", "Noise", "Mistakes only", "Guesses only"], 0, "Good decisions use evidence."],
  ["q_1112_ct_02", "Critical Thinking", "Analysis", "To solve a problem, first ___?", ["Understand it", "Give up", "Ignore facts", "Skip steps"], 0, "Understanding the problem comes first."],
  ["q_1112_ct_03", "Critical Thinking", "Bias", "Listening to different views reduces ___?", ["Bias", "Learning", "Knowledge", "Respect"], 0, "Hearing many views can reduce bias."],
  ["q_1112_en_01", "English", "Literature", "A story's main character is the ___?", ["Protagonist", "Index", "Margin", "Cover"], 0, "The protagonist is the main character."],
  ["q_1112_en_02", "English", "Grammar", "Which sentence uses correct subject-verb agreement?", ["She walk home.", "She walks home.", "She walking home.", "She walkes home."], 1, "She walks — third person singular takes -s."],
  ["q_1112_lo_01", "Logic", "Sequences", "Fibonacci: 1, 1, 2, 3, 5, ___?", ["6", "7", "8", "9"], 2, "5 + 3 = 8."],
  ["q_1112_lo_02", "Logic", "Deduction", "If A=B and B=C, then A ___ C?", ["Equals", "Hides", "Deletes", "Floats"], 0, "A equals C by transitivity."]
]);

/* Ages 13–15: advanced */
addTier(13, 15, "advanced", [
  ["q_1315_ma_01", "Algebra", "Equations", "Solve: 2x − 3 = 11", ["5", "6", "7", "8"], 2, "2x = 14, so x = 7."],
  ["q_1315_ma_02", "Algebra", "Quadratics", "What is (x + 2)(x + 2) when x=1?", ["4", "6", "9", "16"], 2, "(1+2)² = 9."],
  ["q_1315_ma_03", "Algebra", "Slope", "In y = 2x + 3, the slope is ___?", ["2", "3", "5", "x"], 0, "Slope m = 2 in y = mx + b."],
  ["q_1315_ma_04", "Mathematics", "Powers", "What is 5²?", ["10", "20", "25", "30"], 2, "5² = 25."],
  ["q_1315_sc_01", "Advanced Science", "Physics", "Speed equals distance divided by ___?", ["Time", "Mass", "Color", "Volume"], 0, "Speed = distance ÷ time."],
  ["q_1315_sc_02", "Advanced Science", "Chemistry", "The periodic table lists ___?", ["Elements", "Planets", "Countries", "Languages"], 0, "It organizes chemical elements."],
  ["q_1315_sc_03", "Advanced Science", "Biology", "DNA carries genetic ___?", ["Information", "Water only", "Rocks", "Wind"], 0, "DNA stores genetic information."],
  ["q_1315_sc_04", "Advanced Science", "Astronomy", "A light-year measures ___?", ["Distance", "Weight", "Temperature", "Sound"], 0, "A light-year is a distance."],
  ["q_1315_pr_01", "Programming", "Code Basics", "Which language is often used for web pages?", ["JavaScript", "Only binary", "Morse code", "Braille"], 0, "JavaScript runs in web browsers."],
  ["q_1315_pr_02", "Programming", "Variables", "A variable in code stores ___?", ["Data", "Electricity only", "Paper", "Paint"], 0, "Variables hold data values."],
  ["q_1315_pr_03", "Programming", "Logic", "An 'if' statement is a ___ structure?", ["Conditional", "Musical", "Physical", "Chemical"], 0, "If statements are conditionals."],
  ["q_1315_pr_04", "Programming", "Functions", "A function groups reusable ___?", ["Code", "Shoes", "Clouds", "Sand"], 0, "Functions bundle reusable code."],
  ["q_1315_ai_01", "Artificial Intelligence", "ML", "Training data teaches a model to ___?", ["Recognize patterns", "Cook food", "Drive nails", "Grow plants"], 0, "Models learn patterns from training data."],
  ["q_1315_ai_02", "Artificial Intelligence", "NLP", "Chatbots understand human ___?", ["Language", "Gravity", "Magnets", "Rocks"], 0, "NLP deals with human language."],
  ["q_1315_ai_03", "Artificial Intelligence", "Ethics", "Bias in AI can cause unfair ___?", ["Outcomes", "Weather", "Gravity", "Sunlight"], 0, "Biased data can produce unfair results."],
  ["q_1315_cs_01", "Cyber Security", "Passwords", "Strong passwords should be ___?", ["Long and unique", "Your name only", "12345", "Shared with everyone"], 0, "Strong passwords are long and unique."],
  ["q_1315_cs_02", "Cyber Security", "Phishing", "Phishing tries to steal your ___?", ["Information", "Shoes", "Hair color", "Shadow"], 0, "Phishing tricks people into giving information."],
  ["q_1315_cs_03", "Cyber Security", "Privacy", "Two-factor authentication adds extra ___?", ["Security", "Weight", "Color", "Sound"], 0, "2FA adds a second security step."],
  ["q_1315_ca_01", "Current Affairs", "Environment", "Climate change affects global ___?", ["Temperature", "Moon size", "Alphabet", "Shoe sizes"], 0, "Climate change raises global temperatures."],
  ["q_1315_ca_02", "Current Affairs", "Technology", "Renewable energy includes solar and ___?", ["Wind", "Coal only", "Plastic", "Smoke"], 0, "Wind and solar are renewable sources."],
  ["q_1315_wh_01", "World History", "World Wars", "World War I began in ___?", ["1914", "1939", "1776", "2001"], 0, "WWI started in 1914."],
  ["q_1315_wh_02", "World History", "Civil Rights", "Martin Luther King Jr. fought for ___?", ["Equality", "War", "Pollution", "Silence"], 0, "He advocated for civil rights and equality."],
  ["q_1315_wh_03", "World History", "Ancient Rome", "Ancient Rome was a powerful ___?", ["Empire", "Planet", "Ocean", "Comet"], 0, "Rome was a famous ancient empire."],
  ["q_1315_lr_01", "Logical Reasoning", "Syllogisms", "All mammals breathe air. Whales are mammals. Whales ___?", ["Breathe air", "Live in space", "Are rocks", "Are plants"], 0, "Whales are mammals, so they breathe air."],
  ["q_1315_lr_02", "Logical Reasoning", "Fallacies", "Attacking a person instead of their argument is a ___?", ["Fallacy", "Proof", "Theorem", "Law"], 0, "It's an ad hominem fallacy."],
  ["q_1315_ps_01", "Problem Solving", "Strategy", "Breaking a big problem into smaller parts is ___?", ["Decomposition", "Ignoring", "Guessing", "Deleting"], 0, "Decomposition splits problems into parts."],
  ["q_1315_ps_02", "Problem Solving", "Algorithms", "A step-by-step method to solve a problem is an ___?", ["Algorithm", "Opinion", "Color", "Song"], 0, "Algorithms are step-by-step procedures."],
  ["q_1315_ps_03", "Problem Solving", "Testing", "Testing your solution checks if it ___?", ["Works", "Disappears", "Never ends", "Ignores data"], 0, "Testing verifies the solution works."],
  ["q_1315_en_01", "English", "Rhetoric", "A persuasive essay aims to ___?", ["Convince", "Confuse", "Hide facts", "Skip logic"], 0, "Persuasive writing tries to convince readers."],
  ["q_1315_lo_01", "Logic", "Probability", "If a coin is fair, P(heads) = ___?", ["0.5", "0.1", "0.9", "2"], 0, "A fair coin has 50% chance of heads."],
  ["q_1315_lo_02", "Logic", "Sets", "How many subsets does {A, B} have?", ["2", "3", "4", "5"], 2, "Empty set, {A}, {B}, {A,B} — four subsets."]
]);

const MIN_QUESTIONS_PER_TIER = 95;

function makeOptions(correct, wrongs) {
  const seen = new Set([String(correct)]);
  const options = [String(correct)];
  wrongs.forEach(function (w) {
    const s = String(w);
    if (options.length >= 4 || seen.has(s)) return;
    seen.add(s);
    options.push(s);
  });
  let filler = 1;
  while (options.length < 4) {
    const s = String(Number(correct) + filler);
    filler++;
    if (!seen.has(s)) {
      seen.add(s);
      options.push(s);
    }
  }
  return { options: options, correctIndex: 0 };
}

function tierCount(difficulty) {
  return bank.filter(function (q) { return q.difficulty === difficulty; }).length;
}

function pushGenerated(ageMin, ageMax, difficulty, entries) {
  entries.forEach(function (item) {
    if (tierCount(difficulty) >= MIN_QUESTIONS_PER_TIER) return;
    if (bank.some(function (q) { return q.id === item[0]; })) return;
    addTier(ageMin, ageMax, difficulty, [item]);
  });
}

function expandVeryEasy() {
  const entries = [];
  for (let a = 1; a <= 12; a++) {
    for (let b = 1; b <= 12; b++) {
      const sum = a + b;
      const opts = makeOptions(sum, [sum + 1, sum - 1, sum + 2, sum + 3]);
      entries.push([
        "q_gen_56_add_" + a + "_" + b,
        "Basic Math", "Addition",
        "What is " + a + " + " + b + "?",
        opts.options, opts.correctIndex,
        a + " + " + b + " = " + sum + "."
      ]);
    }
  }
  for (let n = 1; n <= 30; n++) {
    const next = n + 1;
    const opts = makeOptions(next, [n, n + 2, n + 3]);
    entries.push([
      "q_gen_56_seq_" + n,
      "Numbers", "Counting",
      "What number comes after " + n + "?",
      opts.options, opts.correctIndex,
      "After " + n + " comes " + next + "."
    ]);
  }
  const colors = ["Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Brown", "Black", "White"];
  colors.forEach(function (color, i) {
    const wrong = colors.filter(function (c) { return c !== color; }).slice(0, 3);
    entries.push([
      "q_gen_56_color_" + i,
      "Colors", "Color Names",
      "Which color is " + color + "?",
      [color].concat(wrong),
      0,
      color + " is one of the basic colors."
    ]);
  });
  pushGenerated(5, 6, "very_easy", entries);
}

function expandEasy() {
  const entries = [];
  for (let a = 10; a <= 49; a++) {
    for (let b = 1; b <= 9; b++) {
      const sum = a + b;
      const opts = makeOptions(sum, [sum + 2, sum - 2, sum + 5]);
      entries.push([
        "q_gen_78_add_" + a + "_" + b,
        "Math", "Addition",
        "What is " + a + " + " + b + "?",
        opts.options, opts.correctIndex,
        a + " + " + b + " = " + sum + "."
      ]);
    }
  }
  for (let a = 20; a <= 99; a++) {
    for (let b = 1; b <= 5; b++) {
      const diff = a - b;
      if (diff < 0) continue;
      const opts = makeOptions(diff, [diff + 1, diff - 1, diff + 3]);
      entries.push([
        "q_gen_78_sub_" + a + "_" + b,
        "Math", "Subtraction",
        "What is " + a + " − " + b + "?",
        opts.options, opts.correctIndex,
        a + " − " + b + " = " + diff + "."
      ]);
    }
  }
  for (let a = 2; a <= 12; a++) {
    for (let b = 2; b <= 12; b++) {
      const prod = a * b;
      const opts = makeOptions(prod, [prod + a, prod - b, prod + 1]);
      entries.push([
        "q_gen_78_mul_" + a + "_" + b,
        "Math", "Multiplication",
        "What is " + a + " × " + b + "?",
        opts.options, opts.correctIndex,
        a + " × " + b + " = " + prod + "."
      ]);
    }
  }
  pushGenerated(7, 8, "easy", entries);
}

function expandMedium() {
  const entries = [];
  for (let a = 2; a <= 12; a++) {
    for (let b = 2; b <= 12; b++) {
      const prod = a * b;
      const opts = makeOptions(prod, [prod + b, prod - a, prod + 2]);
      entries.push([
        "q_gen_910_mul_" + a + "_" + b,
        "Math", "Multiplication",
        "What is " + a + " × " + b + "?",
        opts.options, opts.correctIndex,
        a + " × " + b + " = " + prod + "."
      ]);
    }
  }
  for (let total = 12; total <= 144; total += 6) {
    for (let divisor = 2; divisor <= 12; divisor++) {
      if (total % divisor !== 0) continue;
      const ans = total / divisor;
      const opts = makeOptions(ans, [ans + 1, ans - 1, ans + 2]);
      entries.push([
        "q_gen_910_div_" + total + "_" + divisor,
        "Math", "Division",
        "What is " + total + " ÷ " + divisor + "?",
        opts.options, opts.correctIndex,
        total + " ÷ " + divisor + " = " + ans + "."
      ]);
    }
  }
  for (let n = 2; n <= 50; n++) {
    const half = n % 2 === 0 ? n / 2 : null;
    if (half == null) continue;
    const opts = makeOptions(half, [half + 1, half - 1, half + 2]);
    entries.push([
      "q_gen_910_half_" + n,
      "Math", "Fractions",
      "What is half of " + n + "?",
      opts.options, opts.correctIndex,
      "Half of " + n + " is " + half + "."
    ]);
  }
  for (let start = 2; start <= 40; start += 2) {
    const next = start + 3;
    const opts = makeOptions(next, [start, start + 1, start + 5]);
    entries.push([
      "q_gen_910_pat_" + start,
      "Logic", "Number Patterns",
      "What comes next: " + start + ", " + (start + 3) + ", " + (start + 6) + ", ___?",
      opts.options, opts.correctIndex,
      "The pattern adds 3 each time."
    ]);
  }
  pushGenerated(9, 10, "medium", entries);
}

function expandMediumHard() {
  const entries = [];
  for (let x = 1; x <= 20; x++) {
    const ans = x + 7;
    const opts = makeOptions(ans, [ans + 1, ans - 1, ans + 2]);
    entries.push([
      "q_gen_1112_alg_" + x,
      "Mathematics", "Algebra",
      "Solve: x + 7 = " + (x + 7),
      opts.options, opts.correctIndex,
      "x = " + ans + "."
    ]);
  }
  for (let pct = 5; pct <= 50; pct += 5) {
    for (let base of [20, 40, 60, 80, 100, 120, 200]) {
      const ans = (base * pct) / 100;
      const opts = makeOptions(ans, [ans + 2, ans - 2, ans + 5]);
      entries.push([
        "q_gen_1112_pct_" + pct + "_" + base,
        "Mathematics", "Percentages",
        "What is " + pct + "% of " + base + "?",
        opts.options, opts.correctIndex,
        pct + "% of " + base + " = " + ans + "."
      ]);
    }
  }
  for (let side = 2; side <= 15; side++) {
    const area = side * side;
    const opts = makeOptions(area, [area + side, area - side, area + 2]);
    entries.push([
      "q_gen_1112_sq_" + side,
      "Mathematics", "Geometry",
      "Area of a square with side " + side + " cm?",
      [area + " cm²", (area + side) + " cm²", (area - side) + " cm²", (area + 2) + " cm²"],
      0,
      "Area = " + side + " × " + side + " = " + area + " cm²."
    ]);
  }
  pushGenerated(11, 12, "medium_hard", entries);
}

function expandAdvanced() {
  const entries = [];
  for (let x = 1; x <= 25; x++) {
    const rhs = 2 * x + 5;
    const opts = makeOptions(x, [x + 1, x - 1, x + 2]);
    entries.push([
      "q_gen_1315_alg_" + x,
      "Algebra", "Equations",
      "Solve: 2x + 5 = " + rhs,
      opts.options, opts.correctIndex,
      "2x = " + (rhs - 5) + ", so x = " + x + "."
    ]);
  }
  for (let base = 2; base <= 12; base++) {
    const sq = base * base;
    const opts = makeOptions(sq, [sq + base, sq - base, sq + 2]);
    entries.push([
      "q_gen_1315_pow_" + base,
      "Mathematics", "Powers",
      "What is " + base + "²?",
      opts.options, opts.correctIndex,
      base + "² = " + sq + "."
    ]);
  }
  for (let dist = 10; dist <= 200; dist += 10) {
    for (let time of [2, 4, 5, 10, 20]) {
      const speed = dist / time;
      if (speed !== Math.floor(speed)) continue;
      const opts = makeOptions(speed, [speed + 1, speed - 1, speed + 2]);
      entries.push([
        "q_gen_1315_spd_" + dist + "_" + time,
        "Advanced Science", "Physics",
        "A car travels " + dist + " km in " + time + " hours. What is its speed in km/h?",
        opts.options, opts.correctIndex,
        "Speed = distance ÷ time = " + speed + " km/h."
      ]);
    }
  }
  pushGenerated(13, 15, "advanced", entries);
}

expandVeryEasy();
expandEasy();
expandMedium();
expandMediumHard();
expandAdvanced();

const tierSummary = {};
bank.forEach(function (q) {
  tierSummary[q.difficulty] = (tierSummary[q.difficulty] || 0) + 1;
});
console.log("Per tier:", tierSummary);

const header = `/** Auto-generated age-tiered question bank — edit via Admin custom questions or regenerate */\nvar QUESTION_BANK_RAW = `;
const body = JSON.stringify(bank, null, 2);
const footer = `;\n`;

writeFileSync(join(root, "question-bank-data.js"), header + body + footer);
console.log("Generated " + bank.length + " questions in question-bank-data.js");
