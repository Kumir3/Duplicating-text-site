const channels = [
  {
    id: "telegram",
    name: "Telegram",
    target: "Группа: Запуски и анонсы",
    color: "#229ed9",
    connected: true,
    frozen: false,
  },
  {
    id: "vk",
    name: "VK",
    target: "Сообщество: Relay Club",
    color: "#0077ff",
    connected: true,
    frozen: false,
  },
  {
    id: "max",
    name: "MAX",
    target: "Чат: Команда продаж",
    color: "#7c3aed",
    connected: true,
    frozen: false,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    target: "Группа: Клиенты",
    color: "#16a34a",
    connected: false,
    frozen: false,
  },
  {
    id: "discord",
    name: "Discord",
    target: "Канал: announcements",
    color: "#5865f2",
    connected: false,
    frozen: false,
  },
];

const authView = document.querySelector("#authView");
const dashboardView = document.querySelector("#dashboardView");
const toast = document.querySelector("#toast");
const masterText = document.querySelector("#masterText");
const channelList = document.querySelector("#channelList");
const integrationList = document.querySelector("#integrationList");
const connectedCounter = document.querySelector("#connectedCounter");
const syncStatus = document.querySelector("#syncStatus");
const sectionTitle = document.querySelector("#sectionTitle");
const userName = document.querySelector("#userName");
const userInitial = document.querySelector("#userInitial");
const profileName = document.querySelector("#profileName");
const profileEmail = document.querySelector("#profileEmail");
const publishDate = document.querySelector("#publishDate");

const channelTexts = new Map();
let toastTimer = null;

function setInitialDate() {
  const date = new Date();
  date.setHours(date.getHours() + 2, 0, 0, 0);
  publishDate.value = date.toISOString().slice(0, 16);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function switchAuthTab(tab) {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === tab);
  });
  document.querySelectorAll("[data-auth-form]").forEach((form) => {
    form.classList.toggle("active", form.dataset.authForm === tab);
  });
}

function enterDashboard(name = "Creator", email = "creator@example.com") {
  authView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  profileName.value = name;
  profileEmail.value = email;
  updateUserChip();
  syncUnfrozenChannels();
  renderChannels();
  renderIntegrations();
}

function updateUserChip() {
  const name = profileName.value.trim() || "Creator";
  userName.textContent = name;
  userInitial.textContent = name.slice(0, 1).toUpperCase();
}

function renderChannels() {
  channelList.innerHTML = "";

  channels
    .filter((channel) => channel.connected)
    .forEach((channel) => {
      if (!channelTexts.has(channel.id)) {
        channelTexts.set(channel.id, masterText.value);
      }

      const card = document.createElement("article");
      card.className = `channel-card${channel.frozen ? " frozen" : ""}`;
      card.innerHTML = `
        <div class="channel-top">
          <div class="channel-title">
            <span class="app-logo" style="background:${channel.color}">${channel.name.slice(0, 1)}</span>
            <div>
              <strong>${channel.name}</strong>
              <small>${channel.target}</small>
            </div>
          </div>
          <button class="freeze-button${channel.frozen ? " active" : ""}" type="button" data-freeze="${channel.id}">
            ${channel.frozen ? "Unfreeze" : "Freeze"}
          </button>
        </div>
        <textarea data-channel-text="${channel.id}" spellcheck="true">${channelTexts.get(channel.id)}</textarea>
      `;
      channelList.append(card);
    });

  updateCounters();
}

function renderIntegrations() {
  integrationList.innerHTML = "";

  channels.forEach((channel) => {
    const item = document.createElement("article");
    item.className = "integration-item";
    item.innerHTML = `
      <div class="integration-title">
        <span class="app-logo" style="background:${channel.color}">${channel.name.slice(0, 1)}</span>
        <div>
          <strong>${channel.name}</strong>
          <small>${channel.connected ? channel.target : "Аккаунт не подключен"}</small>
        </div>
      </div>
      <button class="connect-button${channel.connected ? " connected" : ""}" type="button" data-connect="${channel.id}">
        ${channel.connected ? "Подключено" : "Подключить"}
      </button>
    `;
    integrationList.append(item);
  });

  updateCounters();
}

function updateCounters() {
  const connectedCount = channels.filter((channel) => channel.connected).length;
  const frozenCount = channels.filter((channel) => channel.connected && channel.frozen).length;
  connectedCounter.textContent = `${connectedCount} подключено`;
  syncStatus.textContent = frozenCount
    ? `${frozenCount} заморожено, остальные синхронизируются`
    : "Синхронизация активна";
}

function syncUnfrozenChannels() {
  channels.forEach((channel) => {
    if (channel.connected && !channel.frozen) {
      channelTexts.set(channel.id, masterText.value);
    }
  });
}

function syncAllChannels() {
  channels.forEach((channel) => {
    if (channel.connected) {
      channel.frozen = false;
      channelTexts.set(channel.id, masterText.value);
    }
  });
  renderChannels();
  renderIntegrations();
  showToast("Все версии снова синхронизируются с главным текстом");
}

document.querySelectorAll("[data-auth-tab]").forEach((button) => {
  button.addEventListener("click", () => switchAuthTab(button.dataset.authTab));
});

document.querySelector("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = form.get("email").toString();
  enterDashboard(email.split("@")[0] || "Creator", email);
  showToast("Добро пожаловать в RelayPost");
});

document.querySelector("#registerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  enterDashboard(form.get("name").toString() || "Creator", form.get("email").toString());
  showToast("Аккаунт создан, можно подключать площадки");
});

document.querySelector("#forgotForm").addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#forgotNote").textContent =
    "Готово. В прототипе письмо не отправляется, но сценарий восстановления показан.";
});

document.querySelector("#logoutButton").addEventListener("click", () => {
  dashboardView.classList.add("hidden");
  authView.classList.remove("hidden");
  switchAuthTab("login");
});

document.querySelectorAll("[data-section]").forEach((button) => {
  button.addEventListener("click", () => {
    const section = button.dataset.section;
    document.querySelectorAll("[data-section]").forEach((navButton) => {
      navButton.classList.toggle("active", navButton === button);
    });
    document.querySelectorAll(".content-section").forEach((contentSection) => {
      contentSection.classList.toggle("active", contentSection.id === `${section}Section`);
    });
    sectionTitle.textContent = section === "profile" ? "Профиль и интеграции" : "Дублирование текста";
  });
});

masterText.addEventListener("input", () => {
  syncUnfrozenChannels();
  renderChannels();
});

channelList.addEventListener("click", (event) => {
  const freezeButton = event.target.closest("[data-freeze]");
  if (!freezeButton) {
    return;
  }

  const channel = channels.find((item) => item.id === freezeButton.dataset.freeze);
  channel.frozen = !channel.frozen;
  if (!channel.frozen) {
    channelTexts.set(channel.id, masterText.value);
  }
  renderChannels();
});

channelList.addEventListener("input", (event) => {
  const textarea = event.target.closest("[data-channel-text]");
  if (!textarea) {
    return;
  }

  const channel = channels.find((item) => item.id === textarea.dataset.channelText);
  channelTexts.set(channel.id, textarea.value);
  if (!channel.frozen) {
    channel.frozen = true;
    showToast(`${channel.name} заморожен для отдельной правки`);
    renderChannels();
  }
});

integrationList.addEventListener("click", (event) => {
  const connectButton = event.target.closest("[data-connect]");
  if (!connectButton) {
    return;
  }

  const channel = channels.find((item) => item.id === connectButton.dataset.connect);
  channel.connected = !channel.connected;
  if (channel.connected) {
    channelTexts.set(channel.id, masterText.value);
    showToast(`${channel.name} подключен`);
  } else {
    channel.frozen = false;
    showToast(`${channel.name} отключен`);
  }
  renderChannels();
  renderIntegrations();
});

profileName.addEventListener("input", updateUserChip);
document.querySelector("#syncAllButton").addEventListener("click", syncAllChannels);
document.querySelector("#publishButton").addEventListener("click", () => {
  const connected = channels.filter((channel) => channel.connected).map((channel) => channel.name);
  showToast(`Пост добавлен в очереди: ${connected.join(", ")}`);
});

setInitialDate();
switchAuthTab("login");
