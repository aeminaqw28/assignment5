const STARTING_LIVES = 3;
const WIN_STREAK = 8;
const HIGHER = "higher";
const LOWER = "lower";

const LOOKS = [
  { id: 1, name: "The Jazz-Age Flapper", decade: 1920, region: "paris", image: "img/paris-1920s.svg", alt: "Illustration of a 1920s Paris look: green beaded drop-waist dress, cloche hat and long pearls" },
  { id: 2, name: "The New Look", decade: 1950, region: "paris", image: "img/paris-1950s.svg", alt: "Illustration of a 1950s Paris look: cream bar jacket, full black pleated skirt and red pillbox hat" },
  { id: 3, name: "The Mod Mini", decade: 1960, region: "europe", image: "img/europe-1960s.svg", alt: "Illustration of a 1960s European look: colour-block mini dress with orange dots and white boots" },
  { id: 4, name: "The Open-Road Flare", decade: 1970, region: "europe", image: "img/europe-1970s.svg", alt: "Illustration of a 1970s European look: wide-brim hat, bell-sleeve blouse and rust flared trousers" },
  { id: 5, name: "The Power Blazer", decade: 1980, region: "america", image: "img/america-1980s.svg", alt: "Illustration of a 1980s American look: hot pink blazer with big shoulders, black pencil skirt and briefcase" },
  { id: 6, name: "The Grunge Layer", decade: 1990, region: "america", image: "img/america-1990s.svg", alt: "Illustration of a 1990s American look: plaid flannel shirt, baggy jeans, beanie and combat boots" },
  { id: 7, name: "The Toi Bride", decade: 1900, region: "kazakh", image: "img/kazakh-traditional.svg", alt: "Illustration of a traditional Kazakh look: tall white saukele headdress, turquoise dress and wine velvet vest" },
  { id: 8, name: "The Modern Chapan", decade: 2020, region: "kazakh", image: "img/kazakh-modern.svg", alt: "Illustration of a modern Kazakh look: navy chapan-style coat with sky-blue ornament over cream trousers" }
];

const REGION_CLASSES = ["arch--paris", "arch--europe", "arch--america", "arch--kazakh"];

const livesEl = document.getElementById("lives");
const streakEl = document.getElementById("streak");
const bestEl = document.getElementById("best");
const messageEl = document.getElementById("message");
const higherBtn = document.getElementById("higherBtn");
const lowerBtn = document.getElementById("lowerBtn");
const restartBtn = document.getElementById("restartBtn");
const overEl = document.getElementById("gameOver");
const overTitleEl = document.getElementById("overTitle");
const overTextEl = document.getElementById("overText");
const currentCard = document.getElementById("currentCard");
const nextCard = document.getElementById("nextCard");

const state = {
  lives: STARTING_LIVES,
  streak: 0,
  best: 0,
  current: null,
  next: null,
  over: false
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickLook(exclude) {
  let look;
  do {
    look = LOOKS[randomInt(0, LOOKS.length - 1)];
  } while (look === exclude);
  return look;
}

function isCorrect(guess, current, next) {
  return (guess === HIGHER && next.decade >= current.decade) ||
         (guess === LOWER && next.decade <= current.decade);
}

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.classList.remove("is-success", "is-error", "is-warning");
  if (type) {
    messageEl.classList.add("is-" + type);
  }
}

function renderCard(figure, look, showDecade) {
  const img = figure.querySelector("img");
  const caption = figure.querySelector("figcaption");
  REGION_CLASSES.forEach((name) => figure.classList.remove(name));
  figure.classList.add("arch--" + look.region);
  img.src = look.image;
  img.alt = look.alt;
  caption.textContent = showDecade ? look.name + " · " + look.decade + "s" : look.name + " · ?";
  figure.classList.toggle("is-hidden-year", !showDecade);
}

function renderLives() {
  livesEl.replaceChildren();
  for (let i = 0; i < STARTING_LIVES; i += 1) {
    const heart = document.createElement("span");
    heart.className = i < state.lives ? "heart" : "heart heart--empty";
    heart.textContent = "♥";
    livesEl.appendChild(heart);
  }
  livesEl.setAttribute("aria-label", state.lives + " of " + STARTING_LIVES + " lives left");
}

function render() {
  renderLives();
  streakEl.textContent = state.streak;
  bestEl.textContent = state.best;
  renderCard(currentCard, state.current, true);
  renderCard(nextCard, state.next, false);
  higherBtn.disabled = state.over;
  lowerBtn.disabled = state.over;
  overEl.classList.toggle("is-visible", state.over);
}

function endGame(won, lastLook) {
  state.over = true;
  overEl.classList.toggle("is-win", won);
  overEl.classList.toggle("is-loss", !won);
  overTitleEl.textContent = won ? "You won!" : "Game over";
  overTextEl.textContent = won
    ? "A streak of " + WIN_STREAK + " correct guesses. Best streak: " + state.best + "."
    : "No lives left. Best streak: " + state.best + ". The last look was from the " + lastLook.decade + "s.";
}

function handleGuess(guess) {
  if (state.over) {
    setMessage("The game is over. Press Play again to start a new one.", "warning");
    return;
  }
  if (guess !== HIGHER && guess !== LOWER) {
    setMessage("Choose Later or Earlier.", "warning");
    return;
  }

  const revealed = state.next;
  const previous = state.current;
  const fact = revealed.name + " is from the " + revealed.decade + "s, " + previous.name + " is from the " + previous.decade + "s.";

  if (isCorrect(guess, previous, revealed)) {
    state.streak += 1;
    if (state.streak > state.best) {
      state.best = state.streak;
    }
    setMessage("Correct! " + fact, "success");
  } else {
    state.lives -= 1;
    state.streak = 0;
    setMessage("Wrong. " + fact, "error");
  }

  state.current = revealed;

  if (state.streak === WIN_STREAK) {
    endGame(true, revealed);
  } else if (state.lives === 0) {
    endGame(false, revealed);
  }

  state.next = pickLook(state.current);
  render();
}

function startGame() {
  state.lives = STARTING_LIVES;
  state.streak = 0;
  state.over = false;
  state.current = pickLook(null);
  state.next = pickLook(state.current);
  overEl.classList.remove("is-win", "is-loss");
  setMessage("Is the next look from a later or an earlier decade? Equal decades count as correct.", "");
  render();
}

higherBtn.addEventListener("click", () => handleGuess(HIGHER));
lowerBtn.addEventListener("click", () => handleGuess(LOWER));
restartBtn.addEventListener("click", startGame);

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    handleGuess(HIGHER);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    handleGuess(LOWER);
  }
});

startGame();
