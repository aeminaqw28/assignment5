const STATUSES = ["todo", "doing", "done"];
const STATUS_TITLES = { todo: "Want to try", doing: "Styling now", done: "Worn" };
const DOING_LIMIT = 3;
const PRIORITY_LABELS = { 1: "High", 2: "Medium", 3: "Low" };

const looks = [
  { id: 1, title: "Flapper night out", tag: "Paris", priority: 1, status: "todo", pieces: 5, hasShoes: false },
  { id: 2, title: "Bar jacket brunch", tag: "Paris", priority: 2, status: "todo", pieces: 4, hasShoes: true },
  { id: 3, title: "Left Bank scarf and beret", tag: "Paris", priority: 3, status: "doing", pieces: 3, hasShoes: true },
  { id: 4, title: "Mod mini on Carnaby Street", tag: "Europe", priority: 1, status: "todo", pieces: 4, hasShoes: false },
  { id: 5, title: "Festival flares", tag: "Europe", priority: 2, status: "todo", pieces: 6, hasShoes: false },
  { id: 6, title: "Milan tailoring", tag: "Europe", priority: 3, status: "done", pieces: 4, hasShoes: true },
  { id: 7, title: "Power blazer Monday", tag: "America", priority: 1, status: "doing", pieces: 4, hasShoes: true },
  { id: 8, title: "Flannel and big denim", tag: "America", priority: 2, status: "todo", pieces: 5, hasShoes: true },
  { id: 9, title: "Prom neon", tag: "America", priority: 3, status: "todo", pieces: 5, hasShoes: false },
  { id: 10, title: "Toi bride with saukele", tag: "Qazaqstan", priority: 1, status: "todo", pieces: 7, hasShoes: false },
  { id: 11, title: "Velvet vest for Nauryz", tag: "Qazaqstan", priority: 2, status: "doing", pieces: 3, hasShoes: true },
  { id: 12, title: "Modern chapan coat", tag: "Qazaqstan", priority: 2, status: "done", pieces: 3, hasShoes: true }
];

const board = document.getElementById("board");
const tagFilter = document.getElementById("tagFilter");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const messageEl = document.getElementById("plannerMessage");
const emptyEl = document.getElementById("emptyMessage");
const progressEl = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const piecesText = document.getElementById("piecesText");

const lists = {};
const counters = {};
STATUSES.forEach((status) => {
  lists[status] = document.getElementById("list-" + status);
  counters[status] = document.getElementById("count-" + status);
});

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.classList.remove("is-success", "is-error");
  if (type) {
    messageEl.classList.add("is-" + type);
  }
}

function countStatus(status) {
  let total = 0;
  for (const look of looks) {
    if (look.status === status) {
      total += 1;
    }
  }
  return total;
}

function piecesLeft() {
  let total = 0;
  for (const look of looks) {
    if (look.status !== "done") {
      total += look.pieces;
    }
  }
  return total;
}

function getVisibleLooks() {
  const tag = tagFilter.value;
  const query = searchInput.value.trim().toLowerCase();
  let result = looks.filter((look) => {
    const matchesTag = tag === "all" || look.tag === tag;
    const matchesText = query === "" || look.title.toLowerCase().includes(query);
    return matchesTag && matchesText;
  });
  if (sortSelect.value === "priority") {
    result = result.slice().sort((a, b) => a.priority - b.priority || a.id - b.id);
  } else {
    result = result.slice().sort((a, b) => a.id - b.id);
  }
  return result;
}

function createButton(label, action, id, disabled) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-lis-outline kcard__btn";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = String(id);
  button.disabled = disabled;
  return button;
}

function createCard(look) {
  const card = document.createElement("article");
  card.className = "kcard kcard--p" + look.priority;
  card.dataset.id = String(look.id);

  const title = document.createElement("h3");
  title.className = "kcard__title";
  title.textContent = look.title;

  const meta = document.createElement("p");
  meta.className = "kcard__meta";

  const tag = document.createElement("span");
  tag.className = "tag tag--" + look.tag.toLowerCase();
  tag.textContent = look.tag;

  const priority = document.createElement("span");
  priority.className = "prio prio--" + look.priority;
  priority.textContent = PRIORITY_LABELS[look.priority] + " priority";

  meta.append(tag, priority);

  const details = document.createElement("p");
  details.className = "kcard__details";
  details.textContent = look.pieces + " pieces" + (look.hasShoes ? " · shoes ready" : " · shoes needed");

  const actions = document.createElement("div");
  actions.className = "kcard__actions";
  const index = STATUSES.indexOf(look.status);
  actions.append(
    createButton("← Back", "back", look.id, index === 0),
    createButton("Forward →", "forward", look.id, index === STATUSES.length - 1)
  );

  card.append(title, meta, details, actions);
  return card;
}

function createEmptyNote(text) {
  const note = document.createElement("p");
  note.className = "column__empty";
  note.textContent = text;
  return note;
}

function render() {
  const visible = getVisibleLooks();

  STATUSES.forEach((status) => {
    lists[status].replaceChildren();
    const inColumn = visible.filter((look) => look.status === status);
    for (const look of inColumn) {
      lists[status].appendChild(createCard(look));
    }
    if (inColumn.length === 0) {
      lists[status].appendChild(createEmptyNote("Nothing here yet."));
    }
    counters[status].textContent = countStatus(status) + (status === "doing" ? " / " + DOING_LIMIT : "");
  });

  emptyEl.classList.toggle("is-visible", visible.length === 0);

  const done = countStatus("done");
  progressEl.max = looks.length;
  progressEl.value = done;
  progressText.textContent = done + " of " + looks.length + " looks worn";
  piecesText.textContent = piecesLeft();
}

function moveLook(id, direction) {
  const look = looks.find((item) => item.id === id);
  if (look === undefined) {
    setMessage("That look does not exist.", "error");
    return;
  }
  const targetIndex = STATUSES.indexOf(look.status) + direction;
  if (targetIndex < 0 || targetIndex >= STATUSES.length) {
    setMessage("This look cannot move further.", "error");
    return;
  }
  const target = STATUSES[targetIndex];
  if (target === "doing" && countStatus("doing") >= DOING_LIMIT) {
    setMessage("Styling now holds at most " + DOING_LIMIT + " looks. Move one to Worn or back first.", "error");
    return;
  }
  look.status = target;
  setMessage(look.title + " moved to “" + STATUS_TITLES[target] + "”.", "success");
  render();
}

board.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button === null) {
    return;
  }
  const id = Number(button.dataset.id);
  const direction = button.dataset.action === "forward" ? 1 : -1;
  moveLook(id, direction);
});

tagFilter.addEventListener("change", render);
sortSelect.addEventListener("change", render);
searchInput.addEventListener("input", render);

const tags = [];
for (const look of looks) {
  if (!tags.includes(look.tag)) {
    tags.push(look.tag);
  }
}
for (const tag of tags) {
  const option = document.createElement("option");
  option.value = tag;
  option.textContent = tag;
  tagFilter.appendChild(option);
}

render();
