# Metagram 🤖✨

A modular, decorator-driven Node.js framework for building clean, scalable, and maintainable **Telegram bots** with TypeScript.

---

## ✨ Features

- 🧠 **Declarative**: Use decorators to define handlers, commands, and callbacks
- ⚙️ **Dependency Injection**: Built-in singleton/service/component pattern
- 💬 **Message Routing**: Predicate-based filtering
- 🧩 **Middleware Chain**: Easily reject or pass through flows using constructor-injected middlewares
- 🎯 **Parameter Injection**: Inject messages, senders, and session context directly via constructor or method params
- 🔥 **Error Handling**: Class- and method-level hooks
- 🌲 **Built-in Logger**: Structured logs powered by [Pino](https://github.com/pinojs/pino)
- ⚡ **CLI Generator**: Create new bots in seconds with a full folder structure

---

## 📁 Folder Structure

```
cli/                           # CLI (npx metagram new)
src/
│
├── core/
│   ├── bootstrap/             # App entrypoint
│   ├── decorators/
│   │   ├── io/                # @Handler, @OnMessage, @Message, etc
│   │   └── iot/               # @Service, @Autowired
│   ├── logger/                # Logger factory (Pino-based)
│   ├── singleton/             # Singleton management
│   ├── strategy/              # Polling/Webhook strategy
│   ├── metadata/              # Symbol keys for reflection
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
import { bootstrap } from "metagram/core/bootstrap";
import { Handler, TelegramMaster } from "metagram/core/decorators/io/class";
import { OnMessage } from "metagram/core/decorators/io/method";
import { Message, SendMessage } from "metagram/core/decorators/io/parameter";
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

## 🧩 Middleware Example

```ts
import { Middleware } from "metagram/core/decorators/io/class";
import { MiddlewareHandler, SendMessageMethod } from "metagram/core/types";
import { Context } from "telegraf";
import { FirstNameSessionContext } from "src/session/FirstNameSession";
import { SendMessage, Session } from "metagram/core/decorators/io/parameter";

@Middleware()
export class FooMiddleware implements MiddlewareHandler {
    constructor (
        @SendMessage private readonly sendMessage: SendMessageMethod,
        @Session private readonly firstNameSession: FirstNameSessionContext
    ) {}
    
    reject(ctx: Context): boolean | Promise<boolean> {
        const text = (ctx.message as any).text;
        const reject = String(text).toLowerCase().includes("foo");
        if (reject) this.sendMessage("I'll reject processing your solicitation");
        return reject;
    }
}
```

---

## 🧪 Constructor-Level Injection

Sessions and sendMessage can now be injected directly in the constructor of Handlers, Middleware, or Services:

```ts
@Handler({
  middlewares: [FooMiddleware]
})
class MyHandler {
  constructor(
    @Session private readonly session: MySessionContext,
    @Autowired private readonly myService: MyService
  ) {}

  @OnMessage()
  onMessage() {
    console.log("Session:", this.session);
  }
}
```

---

## 🔧 CLI

Scaffold a new bot project with:

```bash
npx metagram new my-bot
```

This creates a fully structured project with `src/`, decorators, logger, and starter code.

---

## 🧪 Testing

Metagram is designed for testability. You can:

- Mock `SessionContext` or `SendMessageMethod`
- Trigger `reject()` in middlewares
- Use Jest or any testing framework

---

## 📚 Documentation

> Full docs will be released soon. Until then, rely on type hints and examples in this README.

---

## 📌 Import Convention

Always import using scoped paths:

```ts
import { OnMessage } from "metagram/core/decorators/io/method";
```

Never import internal folders directly — always rely on public exports.

---

## 🧙 Use Cases

- Smart bots with session-aware logic
- Flow split by decorators
- Clean handler code per module/feature
- Reusable service classes across flows
- Middleware chains for auth, validation, etc.

---

## 🛡 License

MIT — Including Pino and all core dependencies.

---

## ❤️ Built By

Michel JB — [github.com/JubaDeveloper/metagram.git](https://github.com/JubaDeveloper/metagram.git)

Passionate about writing elegant architectures and frameworks that make devs enjoy coding again 🚀
