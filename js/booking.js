const MAX_PER_BOOKING = 6;
const SOLD_OUT_DAYS = [2, 5, 9];
const CLOSED_WEEKDAY = 0;
const CODE_LENGTH = 6;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const PROMOS = [
  { code: "LIS10", percent: 10 },
  { code: "TOI20", percent: 20 },
  { code: "HERITAGE15", percent: 15 }
];

const SESSIONS = [
  { id: "audit", name: "Wardrobe audit", price: 40, seatsLeft: 6 },
  { id: "era", name: "Era makeover", price: 65, seatsLeft: 4 },
  { id: "toi", name: "Toi look styling", price: 90, seatsLeft: 2 },
  { id: "workshop", name: "Group workshop", price: 25, seatsLeft: 10 }
];

const takenEmails = ["aigerim@example.com", "dana@example.com"];

const form = document.getElementById("bookingForm");
form.noValidate = true;

const fields = {
  name: document.getElementById("name"),
  email: document.getElementById("email"),
  session: document.getElementById("session"),
  date: document.getElementById("date"),
  quantity: document.getElementById("quantity"),
  promo: document.getElementById("promo"),
  terms: document.getElementById("terms")
};

const summaryEl = document.getElementById("errorSummary");
const resultEl = document.getElementById("result");
const soldOutHint = document.getElementById("soldOutHint");

const preview = {
  name: document.getElementById("pvName"),
  session: document.getElementById("pvSession"),
  date: document.getElementById("pvDate"),
  quantity: document.getElementById("pvQuantity"),
  promo: document.getElementById("pvPromo"),
  total: document.getElementById("pvTotal")
};

const touched = new Set();

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function toIso(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDate(iso, short) {
  const date = new Date(iso + "T00:00:00");
  return date.toLocaleDateString("en-GB", short
    ? { day: "numeric", month: "short" }
    : { day: "numeric", month: "long", year: "numeric" });
}

const today = new Date();
const soldOutDates = SOLD_OUT_DAYS.map((offset) => toIso(addDays(today, offset)));
fields.date.min = toIso(today);
soldOutHint.textContent = "Fully booked: " + soldOutDates.map((iso) => formatDate(iso, true)).join(", ") + ". The studio is closed on Sundays.";

function findSession(id) {
  return SESSIONS.find((item) => item.id === id);
}

function findPromo(code) {
  const clean = code.trim().toUpperCase();
  return PROMOS.find((item) => item.code === clean);
}

function buildSessionOptions() {
  fields.session.replaceChildren();
  const first = document.createElement("option");
  first.value = "";
  first.textContent = "Choose a session";
  fields.session.appendChild(first);
  for (const item of SESSIONS) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name + " – $" + item.price + " – " + item.seatsLeft + " seats left";
    fields.session.appendChild(option);
  }
}

const labels = {
  name: "name",
  email: "email",
  session: "session",
  date: "date",
  quantity: "number of seats",
  promo: "promo code",
  terms: "studio rules"
};

function nativeMessage(field) {
  const v = field.validity;
  if (v.valueMissing) {
    if (field.type === "checkbox") {
      return "Please accept the studio rules.";
    }
    return (field.tagName === "SELECT" ? "Please choose a " : "Please enter your ") + labels[field.name] + ".";
  }
  if (v.typeMismatch) {
    return "Enter a valid email address, for example name@example.com.";
  }
  if (v.tooShort) {
    return "Use at least " + field.minLength + " characters.";
  }
  if (v.rangeUnderflow) {
    return field.type === "date" ? "Choose today or a later date." : "Book at least " + field.min + " seat.";
  }
  if (v.rangeOverflow) {
    return "You can book at most " + field.max + " seats at once.";
  }
  if (v.badInput) {
    return "Enter a valid value.";
  }
  return "";
}

const customRules = {
  name(value) {
    const lettersOnly = /^[A-Za-zÀ-ɏЀ-ӿ' -]+$/.test(value);
    if (!lettersOnly || value.replace(/[^A-Za-zÀ-ɏЀ-ӿ]/g, "").length < 2) {
      return "Use letters only, at least 2 of them.";
    }
    return "";
  },
  email(value) {
    if (takenEmails.includes(value.toLowerCase())) {
      return "This email already has a booking. Use another one.";
    }
    return "";
  },
  date(value) {
    if (soldOutDates.includes(value)) {
      return "This date is fully booked. Choose another day.";
    }
    const weekday = new Date(value + "T00:00:00").getDay();
    if (weekday === CLOSED_WEEKDAY) {
      return "The studio is closed on Sundays.";
    }
    return "";
  },
  quantity(value) {
    const session = findSession(fields.session.value);
    const amount = Number(value);
    if (session !== undefined && amount > session.seatsLeft) {
      return "Only " + session.seatsLeft + " seats left for " + session.name + ".";
    }
    return "";
  },
  promo(value) {
    if (value !== "" && findPromo(value) === undefined) {
      return "Promo code not found. Try LIS10.";
    }
    return "";
  }
};

function getErrorElement(field) {
  return document.getElementById(field.id + "-error");
}

function showError(field, message) {
  const errorEl = getErrorElement(field);
  errorEl.textContent = message;
  field.setAttribute("aria-invalid", message === "" ? "false" : "true");
  field.classList.toggle("is-invalid", message !== "");
  field.classList.toggle("is-valid", message === "" && field.value !== "" && field.type !== "checkbox");
}

function validateField(field) {
  let message = nativeMessage(field);
  const rule = customRules[field.name];
  if (message === "" && rule !== undefined && field.type !== "checkbox") {
    message = rule(field.value.trim());
  }
  showError(field, message);
  return message === "";
}

function calculate() {
  const session = findSession(fields.session.value);
  const amount = Number(fields.quantity.value);
  const promo = findPromo(fields.promo.value);
  if (session === undefined || !Number.isInteger(amount) || amount < 1) {
    return { subtotal: 0, discount: 0, total: 0, promo: promo };
  }
  const subtotal = session.price * amount;
  const discount = promo === undefined ? 0 : subtotal * promo.percent / 100;
  return { subtotal: subtotal, discount: discount, total: subtotal - discount, promo: promo };
}

function updatePreview() {
  const session = findSession(fields.session.value);
  const sums = calculate();
  preview.name.textContent = fields.name.value.trim() || "Your name";
  preview.session.textContent = session === undefined ? "No session chosen" : session.name;
  preview.date.textContent = fields.date.value ? formatDate(fields.date.value, false) : "No date chosen";
  preview.quantity.textContent = fields.quantity.value ? fields.quantity.value + " seat(s)" : "–";
  preview.promo.textContent = sums.promo === undefined ? "No promo" : sums.promo.code + " −" + sums.promo.percent + "%";
  preview.total.textContent = "$" + sums.total.toFixed(2);
}

function makeBookingCode() {
  let code = "LIS-";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length - 1)];
  }
  return code;
}

function renderResult(booking) {
  resultEl.replaceChildren();
  const ticket = document.createElement("article");
  ticket.className = "ticket";

  const title = document.createElement("h2");
  title.className = "ticket__title";
  title.textContent = "Booking confirmed";
  title.tabIndex = -1;

  const code = document.createElement("p");
  code.className = "ticket__code";
  code.textContent = booking.code;

  const list = document.createElement("ul");
  list.className = "ticket__list";
  const rows = [
    booking.name,
    booking.session + ", " + booking.quantity + " seat(s)",
    booking.date,
    "Total: $" + booking.total.toFixed(2)
  ];
  for (const row of rows) {
    const item = document.createElement("li");
    item.textContent = row;
    list.appendChild(item);
  }

  ticket.append(title, code, list);
  resultEl.appendChild(ticket);
  title.focus();
}

function clearStates() {
  touched.clear();
  summaryEl.textContent = "";
  summaryEl.classList.remove("is-visible");
  Object.values(fields).forEach((field) => {
    showError(field, "");
    field.classList.remove("is-valid");
  });
}

function handleSubmit(event) {
  event.preventDefault();
  resultEl.replaceChildren();

  let firstInvalid = null;
  let errors = 0;
  Object.values(fields).forEach((field) => {
    touched.add(field.name);
    if (!validateField(field)) {
      errors += 1;
      if (firstInvalid === null) {
        firstInvalid = field;
      }
    }
  });

  if (errors > 0) {
    summaryEl.textContent = errors === 1 ? "1 field needs your attention." : errors + " fields need your attention.";
    summaryEl.classList.add("is-visible");
    firstInvalid.focus();
    return;
  }

  const session = findSession(fields.session.value);
  const amount = Number(fields.quantity.value);
  const sums = calculate();
  const booking = {
    code: makeBookingCode(),
    name: fields.name.value.trim(),
    session: session.name,
    quantity: amount,
    date: formatDate(fields.date.value, false),
    total: sums.total
  };

  session.seatsLeft -= amount;
  takenEmails.push(fields.email.value.trim().toLowerCase());

  buildSessionOptions();
  form.reset();
  clearStates();
  updatePreview();
  renderResult(booking);
}

Object.values(fields).forEach((field) => {
  field.addEventListener("blur", () => {
    touched.add(field.name);
    validateField(field);
  });
  field.addEventListener("input", () => {
    if (touched.has(field.name)) {
      validateField(field);
    }
    updatePreview();
  });
  field.addEventListener("change", () => {
    if (touched.has(field.name)) {
      validateField(field);
    }
    if (field === fields.session && touched.has("quantity")) {
      validateField(fields.quantity);
    }
    updatePreview();
  });
});

form.addEventListener("submit", handleSubmit);

buildSessionOptions();
updatePreview();
