# Metagram 🤖✨

A modular, decorator-driven Node.js framework for building clean, scalable, and maintainable Telegram bots with TypeScript.

## ✨ Features

- 🧠 **Declarative**: Use decorators to define handlers, commands, and callbacks.
- ⚙️ **Dependency Injection**: Built-in singleton/service/component pattern.
- 💬 **Message Routing**: Predicate-based listener filtering.
- 🎯 **Parameter Injection**: Inject messages, senders, and session context automatically.
- 🔥 **Error Handling**: Class- and method-level error hooks.
- 🌲 **Built-in Logger**: With full trace/debug/info logs.
- 📦 **CLI Generator**: Scaffold projects quickly.

---

## 📁 Folder Structure

```
cli/                           # The metagram CLI for creating a new project
src/
|-- cli/
├── core/
│   ├── bootstrap/             # Bootstraps the app
│   ├── decorators/
│   │   ├── io/                # Message, Command, Callback decorators
│   │   └── iot/               # Service, Component, Autowired decorators
│   ├── singleton/             # Singleton instance manager
│   ├── strategy/              # Webhook and polling strategy
│   ├── telegram/
│   │   └── engine/            # Message listener execution logic
│   ├── logger/                # Centralized logger factory
│   └── types/                 # Shared types/interfaces
```

---

## 🚀 Getting Started

### 1. Install

```bash
npm install metagram
```

### 2. Create a bot handler

```ts
import {
  Handler,
  OnMessage,
  Message,
  SendMessage,
  TelegramMaster,
  bootstrap
} from "metagram/core";

import { MessageContext, SendMessageMethod } from "metagram/core/types";

@Handler
class EchoHandler {
  @OnMessage()
  private onMessage(
    @Message message: MessageContext,
    @SendMessage send: SendMessageMethod
  ) {
    send(`You said: ${message.text}`);
  }
}

@TelegramMaster({
  updatedFetchStrategy: {
    type: "POLLING",
    data: {
      botToken: "YOUR_BOT_TOKEN"
    }
  },
  messageListeners: [EchoHandler]
})
class Master {}

bootstrap(Master);
```

---

## 🔧 CLI

You can scaffold a new bot with:

```bash
npx metagram new my-bot
```

It creates a full-featured project with structure, starter files, and dependencies.

---

## 🧪 Testing

Metagram is structured to be testable at every layer. You can mock sessions, handlers, and even context injections.

---

## 📚 Documentation

> Full docs will be released soon. For now, refer to the folder and type hints.

---

## 📌 Conventions

- All imports should come from scoped paths like:
  ```ts
  import { OnMessage } from "metagram/core/decorators/io/method";
  ```
- Do **not** access internals directly. Always use exports from `core`.

---

## 🧙 Example Use Cases

- Smart bots with session context
- Split long command flows into decorated methods
- Group handlers by feature/module
- Robust error recovery per handler class

---

## 🛡️ License

MIT

---

## ❤️ Built By

Michel JB, with love for elegant architectures and bots that don’t suck.
