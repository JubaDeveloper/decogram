# Metagram Framework

Metagram is a meta-based framework for building Telegram bots with **TypeScript**. It’s designed to be **declarative**, **modular**, and **developer-friendly**, leveraging decorators, dependency injection, and Telegraf under the hood.

---

## 📚 Table of Contents

- [Introduction](#-introduction)
- [Key Features](#-key-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Project Setup](#project-setup)
  - [Installation](#installation)
  - [TypeScript Configuration](#typescript-configuration)
  - [Project Structure](#project-structure)
  - [Obtaining Your Bot Token](#obtaining-your-bot-token)
  - [Running Your First Bot](#running-your-first-bot)
- [Core Concepts](#-core-concepts)
  - [@TelegramMaster](#telegrammaster)
  - [@Handler](#handler)
  - [Message Handlers](#message-handlers)
  - [Callback Query Handlers](#callback-query-handlers)
  - [Context Predicates](#context-predicates)
  - [Dependency Injection](#dependency-injection)
  - [Services](#services)
  - [Parameter Injection](#parameter-injection)
  - [Middleware](#middleware)
  - [Middleware Chaining](#middleware-chaining)
  - [Session Contexts](#session-contexts)
  - [Hierarchical Session Contexts](#hierarchical-session-contexts)
  - [Error Handling](#error-handling)
  - [Logging](#logging)
  - [Update Fetching Strategies](#update-fetching-strategies)
- [Basic Example](#-basic-example-the-hello-bot)
- [API Reference](#-api-reference)

---

## 📘 Introduction

Metagram is a modern and declarative framework for Telegram bot development in TypeScript. It wraps around [Telegraf](https://telegraf.js.org/) and introduces decorators, dependency injection, and modular architecture to simplify and structure your bot logic.

---

## 🚀 Key Features

- ✅ **Decorator-Driven** configuration  
- 🔧 **Dependency Injection** with lifecycle management  
- 📦 **Modular Handlers** for commands, messages, and buttons  
- 🔐 **Middleware Support** (global and scoped)  
- 🧠 **Hierarchical Session Contexts**  
- 🧰 **Error Handling** at method and class level  
- 🖨️ **Structured Logging** via `pino`  
- 🔄 **Polling/Webhook** update strategies  

---

## Getting Started

### Prerequisites

- Node.js **20+**
- npm or Yarn
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)

---

### Project Setup

```bash
mkdir my-metagram-bot
cd my-metagram-bot
npm init -y
```

---

### Installation

```bash
npm install metagram telegraf express pino pino-pretty reflect-metadata
npm install -D typescript @types/node resolve-tspaths
```

---

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": "./",
    "paths": {
      "@handlers/*": ["src/handlers/*"],
      "@services/*": ["src/services/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### Project Structure

```
my-metagram-bot/
├── src/
│   ├── handlers/
│   │   ├── message/
│   │   │   └── hello.handler.ts
│   │   └── error/
│   │       └── global.handler.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   ├── services/
│   │   └── example.service.ts
│   ├── sessions/
│   │   └── user.context.ts
│   └── index.ts
├── package.json
├── tsconfig.json
```

---

### Obtaining Your Bot Token

1. Open Telegram.
2. Search for `@BotFather`.
3. Send `/newbot` and follow the instructions.
4. Copy and store the token securely.

---

### Running Your First Bot

```bash
npx tsc
npx resolve-tspaths --project tsconfig.json
node dist/index.js
```

---

## 🧠 Core Concepts

### @TelegramMaster

Defines the bot's main configuration.

```ts
@TelegramMaster({
  updatedFetchStrategy: {
    type: "POLLING",
    data: { botToken: "YOUR_BOT_TOKEN" }
  },
  messageListeners: [HelloHandler],
  callbackQueryListeners: [],
  sessionContexts: [],
  middlewares: []
})
class Master {}
```

### @Handler

Marks a class as a handler:

```ts
@Handler()
export class HelloHandler {
  constructor(@SendMessage private readonly send: SendMessageMethod) {}

  @OnCommand("/start")
  start(@Message msg: Context["message"]) {
    this.send("Hello, " + (msg?.from?.first_name ?? "Guest"));
  }
}
```

---

### Message Handlers

- `@OnMessage(predicates?)`: Matches any message
- `@OnCommand("/start")`: Matches a specific command
- `@OnAnything`: Matches all messages (fallback)

---

### Callback Query Handlers

- `@OnCallbackQuery(predicates?)`: Matches button callbacks
- `@OnClick("button_data")`: Exact match for button data

---

### Context Predicates

```ts
const onlyHumans: ContextPredicate = ctx => !ctx.from?.is_bot;
```

Use them in `@OnMessage([predicate1, predicate2])`.

---

### Dependency Injection

Supports DI in classes and methods.

```ts
@Service()
export class MyService {
  hello() {
    return "Hello from service";
  }
}

@Handler()
export class SomeHandler {
  constructor(@Autowired private readonly svc: MyService) {}

  @OnCommand("/hi")
  hi(@SendMessage send: SendMessageMethod) {
    send(this.svc.hello());
  }
}
```

---

### Parameter Injection

- `@SendMessage`: Sends a message
- `@Message`: Gets the raw message
- `@Session`: Injects a session context

---

### Middleware

```ts
@Middleware()
export class AuthMiddleware implements MiddlewareHandler {
  async reject(ctx: Context): Promise<boolean> {
    if (ctx.from?.id !== 123456789) {
      ctx.reply("Not authorized.");
      return true;
    }
    return false;
  }
}
```

Apply globally via `@TelegramMaster` or locally via `@Handler`.

---

### Middleware Chaining

```ts
@Middleware({ next: RateLimitMiddleware })
export class LoggingMiddleware implements MiddlewareHandler {
  async reject(ctx: Context) {
    console.log("User:", ctx.from?.id);
    return false;
  }
}
```

---

### Session Contexts

```ts
@SessionContext
export class UserContext implements ISessionContext {
  private userId!: number;

  loadContext(ctx: Context) {
    this.userId = ctx.from?.id ?? -1;
  }

  getUserId() {
    return this.userId;
  }
}
```

---

### Hierarchical Session Contexts

You can inject one session context into another:

```ts
@SessionContext
export class SettingsContext implements ISessionContext {
  constructor(@Session private readonly user: UserContext) {}

  loadContext(ctx: Context) {
    const id = this.user.getUserId();
    // Load user settings from DB...
  }
}
```

---

### Error Handling

```ts
@ClassErrorHandler((ctx, err) => {
  console.error("Error:", err);
  ctx.reply("Something went wrong.");
})
@Handler()
export class SafeHandler {
  @OnCommand("/fail")
  fail() {
    throw new Error("Failure");
  }
}
```

Use `@MethodErrorHandler()` for method-specific errors.

---

### Logging

Metagram uses **pino**. You can extend or replace loggers if needed. By default, all core events are logged.

---

### Update Fetching Strategies

```ts
// Polling
type: "POLLING",
data: { botToken: "YOUR_TOKEN" }

// Webhook
type: "WEBHOOK",
data: {
  botToken: "YOUR_TOKEN",
  listenOnPort: 3000,
  callbackAfterRegister: async (token, port) => {
    await bot.telegram.setWebhook(`https://your-domain.com/telegram/${token}`);
  }
}
```

---

## 📦 Basic Example: The Hello Bot

```ts
import { bootstrap } from "metagram/core/bootstrap";
import { Handler, TelegramMaster } from "metagram/core/decorators/io/class";
import { OnCommand } from "metagram/core/decorators/io/method";
import { SendMessage } from "metagram/core/decorators/io/parameter";
import { SendMessageMethod } from "metagram/core/types";
import { Context } from "telegraf";

@Handler()
class HelloHandler {
  constructor(@SendMessage private readonly send: SendMessageMethod) {}

  @OnCommand("/start")
  start(@Message msg: Context["message"]) {
    this.send("Hello, " + (msg?.from?.first_name ?? "Guest") + "!");
  }
}

@TelegramMaster({
  updatedFetchStrategy: {
    type: "POLLING",
    data: { botToken: "YOUR_BOT_TOKEN" }
  },
  messageListeners: [HelloHandler]
})
class Master {}

bootstrap(Master);
```

---

## 📖 API Reference

| Decorator / Interface   | Type       | Description                                 |
|-------------------------|------------|---------------------------------------------|
| `@TelegramMaster`       | Class      | Root bot configuration                      |
| `@Handler`              | Class      | Registers a handler                         |
| `@OnMessage`            | Method     | Handles messages with optional predicates   |
| `@OnCommand`            | Method     | Handles `/command` messages                 |
| `@OnAnything`           | Method     | Catch-all message handler                   |
| `@OnCallbackQuery`      | Method     | Handles callback queries                    |
| `@OnClick`              | Method     | Handles inline button clicks                |
| `@SendMessage`          | Parameter  | Injects reply method                        |
| `@Message`              | Parameter  | Injects raw message                         |
| `@Session`              | Parameter  | Injects session context                     |
| `@Service`              | Class      | Declares a DI service                       |
| `@Autowired`            | Parameter  | Injects a DI service                        |
| `@Middleware`           | Class      | Declares middleware                         |
| `@ClassErrorHandler`    | Class      | Class-level error handling                  |
| `@MethodErrorHandler`   | Method     | Method-level error handling                 |
| `@SessionContext`       | Class      | Declares a session context                  |

---

**Happy coding with Metagram!** 🚀  
Want to contribute? Open a PR or star the project!
