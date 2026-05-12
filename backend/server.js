const http = require("node:http");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 4000);

const state = {
  users: [
    {
      id: "user_demo",
      name: "Creator",
      email: "creator@example.com",
      password: "demo1234",
      role: "Контент-менеджер",
    },
  ],
  integrations: [
    { id: "telegram", name: "Telegram", connected: true, target: "Группа: Запуски и анонсы" },
    { id: "vk", name: "VK", connected: true, target: "Сообщество: Relay Club" },
    { id: "max", name: "MAX", connected: true, target: "Чат: Команда продаж" },
    { id: "whatsapp", name: "WhatsApp", connected: false, target: "Группа: Клиенты" },
    { id: "discord", name: "Discord", connected: false, target: "Канал: announcements" },
  ],
  drafts: [],
  publishQueue: [],
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large"));
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

async function route(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, service: "relaypost-api" });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readBody(request);
    const user = state.users.find(
      (item) => item.email === body.email && item.password === body.password,
    );

    if (!user) {
      sendJson(response, 401, { error: "Неверный email или пароль" });
      return;
    }

    sendJson(response, 200, { token: createToken(), user: publicUser(user) });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/register") {
    const body = await readBody(request);

    if (!body.email || !body.password || !body.name) {
      sendJson(response, 400, { error: "Нужны name, email и password" });
      return;
    }

    if (state.users.some((user) => user.email === body.email)) {
      sendJson(response, 409, { error: "Пользователь уже существует" });
      return;
    }

    const user = {
      id: `user_${crypto.randomUUID()}`,
      name: body.name,
      email: body.email,
      password: body.password,
      role: "Контент-менеджер",
    };
    state.users.push(user);
    sendJson(response, 201, { token: createToken(), user: publicUser(user) });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/forgot-password") {
    const body = await readBody(request);
    sendJson(response, 200, {
      ok: true,
      message: `Ссылка восстановления подготовлена для ${body.email || "email"}`,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/integrations") {
    sendJson(response, 200, { integrations: state.integrations });
    return;
  }

  if (request.method === "PATCH" && url.pathname.startsWith("/api/integrations/")) {
    const integrationId = url.pathname.split("/").pop();
    const body = await readBody(request);
    const integration = state.integrations.find((item) => item.id === integrationId);

    if (!integration) {
      sendJson(response, 404, { error: "Интеграция не найдена" });
      return;
    }

    integration.connected = Boolean(body.connected);
    sendJson(response, 200, { integration });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/drafts") {
    const body = await readBody(request);
    const draft = {
      id: `draft_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      ...body,
    };
    state.drafts.push(draft);
    sendJson(response, 201, { draft });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/publish") {
    const body = await readBody(request);
    const queueItem = {
      id: `queue_${crypto.randomUUID()}`,
      status: "queued",
      createdAt: new Date().toISOString(),
      ...body,
    };
    state.publishQueue.push(queueItem);
    sendJson(response, 202, { queueItem });
    return;
  }

  sendJson(response, 404, { error: "Маршрут не найден" });
}

const server = http.createServer((request, response) => {
  route(request, response).catch((error) => {
    sendJson(response, 500, { error: error.message });
  });
});

server.listen(PORT, () => {
  console.log(`RelayPost API listening on http://localhost:${PORT}`);
});
