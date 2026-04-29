const STORAGE_KEY = "habit-garden-soft.habits";

const growthStages = [
  {
    min: 0,
    label: "씨앗",
    image: "./assets/images/seed-v2.png",
  },
  {
    min: 1,
    label: "새싹",
    image: "./assets/images/sprout-1-v2.png",
  },
  {
    min: 3,
    label: "잎새",
    image: "./assets/images/sprout-2.png",
  },
  {
    min: 6,
    label: "작은 식물",
    image: "./assets/images/plant-1.png",
  },
  {
    min: 11,
    label: "큰 식물",
    image: "./assets/images/plant-2.png",
  },
];

let habits = loadHabits();
let editingHabitId = null;

const habitGrid = document.querySelector("#habitGrid");
const emptyState = document.querySelector("#emptyState");
const template = document.querySelector("#habitCardTemplate");
const addHabitButton = document.querySelector("#addHabitButton");
const emptyAddButton = document.querySelector("#emptyAddButton");
const habitDialog = document.querySelector("#habitDialog");
const habitForm = document.querySelector("#habitForm");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogKicker = document.querySelector("#dialogKicker");
const habitNameInput = document.querySelector("#habitNameInput");
const habitNoteInput = document.querySelector("#habitNoteInput");
const cancelDialogButton = document.querySelector("#cancelDialogButton");

function todayKey() {
  return formatDateKey(new Date());
}

function yesterdayKey() {
  return dateKeyDaysAgo(1);
}

function dateKeyDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDateKey(date);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createHabitId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createDefaultHabits() {
  const today = todayKey();
  const yesterday = yesterdayKey();

  return [
    {
      id: createHabitId(),
      title: "우쿨렐레",
      note: "잠들기 전 코드 하나만 잡기",
      plantedAt: yesterday,
      waterDates: [yesterday],
    },
    {
      id: createHabitId(),
      title: "책 읽기",
      note: "두 쪽만 읽어도 돌본 것으로 보기",
      plantedAt: dateKeyDaysAgo(5),
      waterDates: [dateKeyDaysAgo(5), dateKeyDaysAgo(4), yesterday, today],
    },
    {
      id: createHabitId(),
      title: "영어 한 문장",
      note: "외운 문장을 소리 내어 한 번 말하기",
      plantedAt: today,
      waterDates: [],
    },
  ];
}

function loadHabits() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return createDefaultHabits();
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function getGrowthStage(totalWaterCount) {
  return growthStages.reduce((currentStage, stage) => {
    return totalWaterCount >= stage.min ? stage : currentStage;
  }, growthStages[0]);
}

function formatLastCare(habit) {
  const lastDate = habit.waterDates.at(-1);

  if (!lastDate) {
    return "아직 없음";
  }

  if (lastDate === todayKey()) {
    return "오늘";
  }

  if (lastDate === yesterdayKey()) {
    return "어제";
  }

  return lastDate.replaceAll("-", ".");
}

function hasWateredToday(habit) {
  return habit.waterDates.includes(todayKey());
}

function closeAllMenus() {
  document.querySelectorAll(".card-menu-wrap").forEach((menuWrap) => {
    const menu = menuWrap.querySelector(".card-menu");
    const button = menuWrap.querySelector(".menu-button");
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
  });
}

function renderHabits() {
  emptyState.hidden = habits.length > 0;
  habitGrid.hidden = habits.length === 0;

  habitGrid.replaceChildren(
    ...habits.map((habit) => {
      const card = template.content.firstElementChild.cloneNode(true);
      const plantImage = card.querySelector(".plant-image");
      const title = card.querySelector("h3");
      const growthLabel = card.querySelector(".growth-label");
      const note = card.querySelector(".habit-note");
      const lastCare = card.querySelector(".last-care");
      const waterCount = card.querySelector(".water-count");
      const waterButton = card.querySelector(".water-button");
      const waterLabel = card.querySelector(".water-label");
      const menuButton = card.querySelector(".menu-button");
      const menu = card.querySelector(".card-menu");
      const editButton = card.querySelector('[data-action="edit"]');
      const deleteButton = card.querySelector('[data-action="delete"]');
      const totalWaterCount = habit.waterDates.length;
      const growthStage = getGrowthStage(totalWaterCount);
      const wateredToday = hasWateredToday(habit);

      plantImage.src = growthStage.image;
      plantImage.alt = `${growthStage.label} 단계`;
      title.textContent = habit.title;
      growthLabel.textContent = growthStage.label;
      note.textContent = habit.note || "천천히 돌볼 기준을 적어두세요.";
      lastCare.textContent = formatLastCare(habit);
      waterCount.textContent = `${totalWaterCount}회`;
      waterLabel.textContent = wateredToday ? "오늘 물줬어요" : "물주기";
      waterButton.classList.toggle("is-watered", wateredToday);
      waterButton.disabled = wateredToday;

      menuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = menu.hidden;
        closeAllMenus();
        menu.hidden = !willOpen;
        menuButton.setAttribute("aria-expanded", String(willOpen));
      });

      menu.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      editButton.addEventListener("click", () => {
        closeAllMenus();
        openHabitDialog(habit);
      });

      deleteButton.addEventListener("click", () => {
        closeAllMenus();
        deleteHabit(habit);
      });

      waterButton.addEventListener("click", () => {
        waterHabit(habit.id);
      });

      return card;
    }),
  );
}

function waterHabit(habitId) {
  const habit = habits.find((item) => item.id === habitId);

  if (!habit || hasWateredToday(habit)) {
    return;
  }

  habit.waterDates.push(todayKey());
  saveHabits();
  renderHabits();
}

function openHabitDialog(habit = null) {
  editingHabitId = habit?.id ?? null;
  dialogKicker.textContent = habit ? "정원 손질" : "새 씨앗";
  dialogTitle.textContent = habit ? "습관 수정" : "습관 심기";
  habitNameInput.value = habit?.title ?? "";
  habitNoteInput.value = habit?.note ?? "";

  if (typeof habitDialog.showModal === "function") {
    habitDialog.showModal();
  } else {
    habitDialog.setAttribute("open", "");
  }

  habitNameInput.focus();
}

function closeHabitDialog() {
  habitDialog.close();
  habitForm.reset();
  editingHabitId = null;
}

function upsertHabit(event) {
  event.preventDefault();
  const title = habitNameInput.value.trim();
  const note = habitNoteInput.value.trim();

  if (!title) {
    habitNameInput.focus();
    return;
  }

  if (editingHabitId) {
    habits = habits.map((habit) => {
      if (habit.id !== editingHabitId) {
        return habit;
      }

      return {
        ...habit,
        title,
        note,
      };
    });
  } else {
    habits.unshift({
      id: createHabitId(),
      title,
      note,
      plantedAt: todayKey(),
      waterDates: [],
    });
  }

  saveHabits();
  closeHabitDialog();
  renderHabits();
}

function deleteHabit(habit) {
  const confirmed = window.confirm(`'${habit.title}' 습관을 정원에서 삭제할까요?`);

  if (!confirmed) {
    return;
  }

  habits = habits.filter((item) => item.id !== habit.id);
  saveHabits();
  renderHabits();
}

addHabitButton.addEventListener("click", () => openHabitDialog());
emptyAddButton.addEventListener("click", () => openHabitDialog());
cancelDialogButton.addEventListener("click", closeHabitDialog);
habitForm.addEventListener("submit", upsertHabit);
habitDialog.addEventListener("click", (event) => {
  if (event.target === habitDialog) {
    closeHabitDialog();
  }
});
document.addEventListener("click", closeAllMenus);

renderHabits();
