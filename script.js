const habits = [
  {
    title: "우쿨렐레",
    lastCare: "어제",
    weeklyCare: 2,
  },
  {
    title: "책 읽기",
    lastCare: "오늘",
    weeklyCare: 3,
  },
  {
    title: "영어 한 문장",
    lastCare: "오늘",
    weeklyCare: 2,
  },
];

const statusTime = document.querySelector("#statusTime");
const habitGrid = document.querySelector("#habitGrid");
const template = document.querySelector("#habitCardTemplate");

function renderTime() {
  const now = new Date();
  statusTime.textContent = now.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
}

function renderHabits() {
  habitGrid.replaceChildren(
    ...habits.map((habit) => {
      const card = template.content.firstElementChild.cloneNode(true);
      const title = card.querySelector("h3");
      const lastCare = card.querySelector(".last-care");
      const weeklyCare = card.querySelector(".weekly-care");
      const button = card.querySelector(".water-button");

      title.textContent = habit.title;
      lastCare.textContent = habit.lastCare;
      weeklyCare.textContent = `${habit.weeklyCare}번`;

      button.addEventListener("click", () => {
        habit.lastCare = "방금";
        habit.weeklyCare += 1;
        lastCare.textContent = habit.lastCare;
        weeklyCare.textContent = `${habit.weeklyCare}번`;
        button.animate(
          [
            { transform: "translateY(0)" },
            { transform: "translateY(-0.25rem)" },
            { transform: "translateY(0)" },
          ],
          {
            duration: 260,
            easing: "ease-out",
          },
        );
      });

      return card;
    }),
  );
}

renderTime();
renderHabits();
setInterval(renderTime, 30_000);
