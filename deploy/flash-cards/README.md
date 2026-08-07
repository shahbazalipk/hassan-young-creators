# Slash Cards

Fun age-based quiz game built with **HTML, CSS, and vanilla JavaScript**.

**Created by HASSAAN**

## Features

1. **Welcome screen** — brand name, creator credit, canvas fireworks + celebratory SFX
2. **Student setup** — name, age (5–16), card count (10 / 20 / 30 / 40)
3. **Slash Cards gameplay** — age-based difficulty, 10s timer, live leaderboard
4. **Certificate** — save PNG, copy share link, WhatsApp “Share with Parents”, Continue
5. **Hidden admin** — add / edit / delete questions (`#admin` or triple-click brand)

## Run locally

ES modules need a static server (opening `index.html` via `file://` will block modules):

```bash
cd slash-cards
npx --yes serve -l 8765
```

Open http://127.0.0.1:8765/index.html

## Admin login

- **URL:** http://127.0.0.1:8765/index.html#admin  
- **Email:** `admin@slashcards.com`  
- **Password:** `Admin@123`

## Project structure

```
slash-cards/
├── index.html
├── css/styles.css
├── js/
│   ├── app.js           # screen flow controller
│   ├── fireworks.js     # canvas fireworks
│   ├── audio.js         # Web Audio SFX
│   ├── questions.js     # default bank + age selection
│   ├── quiz.js          # timer + scoring
│   ├── leaderboard.js
│   ├── certificate.js   # save / copy / WhatsApp
│   ├── admin.js         # CRUD + auth
│   └── storage.js       # localStorage
└── tests/
    └── slash-cards.spec.js
```

## Tests

```bash
cd slash-cards
npx --yes playwright install chromium
npx --yes playwright test --config=playwright.config.js
```
