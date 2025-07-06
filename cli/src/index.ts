#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { mkdirSync, writeFileSync } from "fs";

const args = process.argv.slice(2);
const command = args[0];
const projectName = args[1];

if (command === "new" && projectName) {
  const projectPath = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(projectPath)) {
    console.error(`❌ Folder "${projectName}" already exists.`);
    process.exit(1);
  }

  console.log(`🚀 Creating a new Metagram bot in ${projectName}...`);

  // Step 1: Create folders
  mkdirSync(projectPath, { recursive: true });
  mkdirSync(path.join(projectPath, "src/handlers/message"), { recursive: true });
  mkdirSync(path.join(projectPath, "src/handlers/callback"), { recursive: true });
  mkdirSync(path.join(projectPath, "src/services"), { recursive: true });
  mkdirSync(path.join(projectPath, "src/errors"), { recursive: true });

  // Step 2: Write main.ts
  writeFileSync(path.join(projectPath, "src/main.ts"), getMainContent());
  
  // Step 3: Write Message sample handler
  writeFileSync(path.join(projectPath, "src/handlers/message/start.handler.ts"), getMessageHandlerContent());

  writeFileSync(path.join(projectPath, "src/handlers/callback/start.handler.ts"), getCallbackHandlerContent());

  writeFileSync(path.join(projectPath, "src/services/hello.service.ts"), getHelloServiceContent());


  // Step 4: Write error handler
  writeFileSync(path.join(projectPath, "src/errors/globalHandlers.ts"), getErrorHandlerContent());

  // Step 5: Write package.json
  writeFileSync(path.join(projectPath, "package.json"), getPackageJson(projectName));

  // Step 6: Write tsconfig.json
  writeFileSync(path.join(projectPath, "tsconfig.json"), getTsConfig());

  // Step 7: Install dependencies
  console.log("📦 Installing dependencies...");
  execSync("npm install metagram reflect-metadata telegraf", { stdio: "inherit", cwd: projectPath });

  console.log(`✅ Project ${projectName} created successfully.`);
} else {
  console.log("Usage:");
  console.log("  npx metagram new <project-name>");
}

// ------------------- Helpers ------------------------

function getMainContent() {
  return `import { bootstrap } from "metagram/core/bootstrap"
import { TelegramMaster } from "metagram/core/decorators/io/class"
import { StartCallbackHandler } from "./handlers/callback/start.handler"
import { StartMessageHandler } from "./handlers/message/start.handler"


@TelegramMaster({
    updatedFetchStrategy: {
        type: "POLLING",
        data: {
            botToken: process.env.BOT_TOKEN ?? "YOUR_BOT_TOKEN_HERE"
        }
    },
    messageListeners: [
        StartMessageHandler
    ],
    callbackQueryListeners: [
        StartCallbackHandler
    ]
})
class Master {}

bootstrap(Master)`;
}

function getMessageHandlerContent() {
  return `import { Handler } from "metagram/core/decorators/io/class";
import { ClassErrorHandler } from "metagram/core/decorators/io/error";
import { SendMessageMethod } from "metagram/core/types";
import { OnCommand } from "metagram/core/decorators/io/method";
import { SendMessage } from "metagram/core/decorators/io/parameter";
import { Autowired } from "metagram/core/decorators/iot/autowired";
import { HelloService } from "../../services/hello.service";
import { onError } from "src/errors/globalHandlers";

@Handler
@ClassErrorHandler(onError)
export class StartMessageHandler {
    constructor (
        @Autowired private readonly helloService: HelloService
    ) {}

    @OnCommand("/start")
    public onMessage (
        @SendMessage sendMessage: SendMessageMethod
    ) {
        sendMessage(this.helloService.getHelloMessage(), {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Exec start",
                            callback_data: "start"
                        }
                    ]
                ]
            }
        })
    }
}`;
}


function getCallbackHandlerContent() {
  return `import { Handler } from "metagram/core/decorators/io/class";
import { ClassErrorHandler } from "metagram/core/decorators/io/error";
import { SendMessageMethod } from "metagram/core/types";
import { SendMessage } from "metagram/core/decorators/io/parameter";
import { onError } from "../../errors/globalHandlers";
import { OnClick } from "metagram/core/decorators/io/method";
import { Autowired } from "metagram/core/decorators/iot/autowired";
import { HelloService } from "../../services/hello.service";


@Handler
@ClassErrorHandler(onError)
export class StartCallbackHandler {
    constructor (
        @Autowired private readonly helloService: HelloService
    ) {}

    @OnClick("start")
    public onMessage (
        @SendMessage sendMessage: SendMessageMethod
    ) {
        sendMessage(this.helloService.getHelloMessage(), {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Exec start",
                            callback_data: "start"
                        }
                    ]
                ]
            }
        })
    }
}`;
}

function getHelloServiceContent () {
  return `import { Service } from "metagram/core/decorators/iot/service";

@Service
export class HelloService {
    getHelloMessage () {
        return "Hello from metagram!"
    }
}
`;
}

function getErrorHandlerContent() {
  return `import { ErrorHandler } from "metagram/core/types";
import { Context } from "telegraf";

export const onError: ErrorHandler = (ctx: Context, error: any) => {
  console.error("❌ Error caught in handler:", error);
  ctx.reply("Oops! Something went wrong.");
};
`;
}

function getPackageJson(name: string) {
  return JSON.stringify(
    {
      name,
      version: "1.0.0",
      main: "src/main.ts",
      scripts: {
        dev: "ts-node src/main.ts",
        build: "tsc"
      },
      dependencies: {},
      devDependencies: {
        "ts-node": "^10.0.0",
        "typescript": "^5.8.3",
        "@types/node": "^24.0.10"
      }
    },
    null,
    2
  );
}

function getTsConfig() {
  return JSON.stringify(
    {
      compilerOptions: {
        "outDir": "dist",
        "target": "esnext",
        "module": "node16",
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        baseUrl: "."
      },
      include: ["src"]
    },
    null,
    2
  );
}
