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

	console.log(`🚀 Creating a new Decogram bot in ${projectName}...`);

	// Step 1: Create folders
	mkdirSync(projectPath, { recursive: true });

	mkdirSync(path.join(projectPath, "src/handlers/message"), { recursive: true });

	mkdirSync(path.join(projectPath, "src/handlers/callback"), { recursive: true });

	mkdirSync(path.join(projectPath, "src/handlers/error"), { recursive: true });

	mkdirSync(path.join(projectPath, "src/middleware"), { recursive: true });

	mkdirSync(path.join(projectPath, "src/services"), { recursive: true });

	mkdirSync(path.join(projectPath, "src/sessions"), { recursive: true });

	// Step 2: Write main.ts
	writeFileSync(path.join(projectPath, "src/main.ts"), getMainContent());
  
	// Step 3: Write Message sample handler
	writeFileSync(path.join(projectPath, "src/handlers/message/start.handler.ts"), getMessageHandlerContent());

	writeFileSync(path.join(projectPath, "src/handlers/callback/start.handler.ts"), getCallbackHandlerContent());

	writeFileSync(path.join(projectPath, "src/handlers/error/global.handler.ts"), getErrorHandlerContent());

	writeFileSync(path.join(projectPath, "src/middleware/foo.middleware.ts"), getMiddlewareContent());

	writeFileSync(path.join(projectPath, "src/services/hello.service.ts"), getHelloServiceContent());

	writeFileSync(path.join(projectPath, "src/sessions/user.session.context.ts"), getUserSessionContext());

	// Step 5: Write package.json
	writeFileSync(path.join(projectPath, "package.json"), getPackageJson(projectName));

	// Step 6: Write tsconfig.json
	writeFileSync(path.join(projectPath, "tsconfig.json"), getTsConfig());

	// Step 7: Writting .env config file
	writeFileSync(path.join(projectPath, ".env"), getEnvConfig());

	// Step 7: Install dependencies
	console.log("📦 Installing dependencies...");

	execSync("npm install @decogram/framework", { stdio: "inherit", cwd: projectPath });

	console.log(`✅ Project ${projectName} created successfully.`);
} else {
	console.log("Usage:");

	console.log("  npx decogram new <project-name>");
}

// ------------------- Helpers ------------------------

function getMainContent() {
	return `import { StartCallbackHandler } from "@handlers/callback/start.handler";
import { StartMessageHandler } from "@handlers/message/start.handler";
import { bootstrap } from "decogram/core/bootstrap";
import { TelegramMaster } from "decogram/core/decorators/io/class";
import { UserSessionContext } from "src/sessions/user.session.context";

@TelegramMaster({
    updatedFetchStrategy: {
        type: "POLLING",
        data: {
            botToken: process.env.BOT_TOKEN
        }
    },
    messageListeners: [
        StartMessageHandler
    ],
    callbackQueryListeners: [
        StartCallbackHandler
    ],
    sessionContexts: [
        {
            sessionContext: UserSessionContext
        }
    ]
})
class Master {}

bootstrap(Master)`;
}

function getMessageHandlerContent() {
	return `import { onError } from "@handlers/error/global.handler";
import { HelloService } from "@services/hello.service";
import { Apply, MessageHandler } from "decogram/core/decorators/io/class";
import { ErrorHandler } from "decogram/core/decorators/io/error";
import { OnCommand } from "decogram/core/decorators/io/method";
import { SendMessage, Session } from "decogram/core/decorators/io/parameter";
import { Autowired } from "decogram/core/decorators/iot/autowired";
import { TSendMessage } from "decogram/core/types";
import { FooMiddleware } from "src/middleware/foo.middleware";
import { UserSessionContext } from "src/sessions/user.session.context";

@Apply(FooMiddleware)
@ErrorHandler(onError)
@MessageHandler()
export class StartMessageHandler {
    constructor (
        @Autowired private readonly helloService: HelloService,
        @Session private readonly userSession: UserSessionContext
    ) {}

    @OnCommand("/start")
    public onMessage (
        @SendMessage sendMessage: TSendMessage
    ) {
        sendMessage(this.helloService.getHelloMessage(
            this.userSession.getFirstName()
        ), {
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
	return `import { CallbackHandler } from "decogram/core/decorators/io/class";
import { ErrorHandler } from "decogram/core/decorators/io/error";
import { TSendMessage } from "decogram/core/types";
import { SendMessage, Session } from "decogram/core/decorators/io/parameter";
import { OnClick } from "decogram/core/decorators/io/method";
import { Autowired } from "decogram/core/decorators/iot/autowired";
import { onError } from "@handlers/error/global.handler";
import { HelloService } from "@services/hello.service";
import { UserSessionContext } from "src/sessions/user.session.context";

@CallbackHandler()
@ErrorHandler(onError)
export class StartCallbackHandler {
    constructor (
        @Autowired private readonly helloService: HelloService,
        @Session private readonly userSession: UserSessionContext
    ) {}

    @OnClick("start")
    public onMessage (
        @SendMessage sendMessage: TSendMessage
    ) {
        sendMessage(this.helloService.getHelloMessage(
            this.userSession.getFirstName()
        ), {
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
	return `import { Service } from "decogram/core/decorators/iot/service";

@Service
export class HelloService {
    getHelloMessage (name: string) {
        return \`Hello from decogram to \${name}\`
    }
}
`;
}

function getUserSessionContext () {
	return `import { SessionContext } from "decogram/core/decorators/io/class";
import { ISessionContext } from "decogram/core/types";
import { Context } from "telegraf";

@SessionContext
export class UserSessionContext implements ISessionContext {
    private firstName!: string

    loadContext(ctx: Context): void | Promise<void> {
        this.firstName = ctx.from?.first_name ?? ctx.message?.from.first_name ?? ctx.callbackQuery?.from.first_name ?? "Guest"
    }

    public getFirstName () {
        return this.firstName
    }
}
`;
}

function getErrorHandlerContent() {
	return `import { TErrorHandler } from "decogram/core/types";
import { Context } from "telegraf";

export const onError: TErrorHandler = (ctx: Context, error: any) => {
	console.error("❌ Error caught in handler:", error);

	ctx.reply("Oops! Something went wrong.");
};
`;
}

function getMiddlewareContent () {
	return `
import { Middleware } from "decogram/core/decorators/io/class";
import { MiddlewareHandler, TSendMessage } from "decogram/core/types";
import { Context } from "telegraf";
import { SendMessage, Session } from "decogram/core/decorators/io/parameter";
import { UserSessionContext } from "src/sessions/user.session.context";

@Middleware()
export class FooMiddleware implements MiddlewareHandler {
	constructor (
        @SendMessage private readonly sendMessage: TSendMessage,
        @Session private readonly userSessionContext: UserSessionContext
	) {}
	reject(ctx: Context): boolean | Promise<boolean> {
		const text = (ctx.message as any).text

		const reject = String(text).toLowerCase().includes("foo")

		if (reject) this.sendMessage("I'll reject processing your request " + this.userSessionContext.getFirstName())

		return reject
	}

}`
}

function getPackageJson(name: string) {
	return JSON.stringify(
		{
			"name": name,
			"version": "1.0.0",
			"main": "src/main.ts",
			"license": "MIT",
			"scripts": {
				"dev": "ts-node src/main.ts",
				"build": "tsc"
			},
			"dependencies": {},
			"devDependencies": {
				"@types/node": "^24.0.10",
				"ts-node": "^10.0.0",
				"tsconfig-paths": "^4.2.0",
				"typescript": "^5.8.3"
			}
		},
		null,
		2
	);
}

function getTsConfig() {
	return JSON.stringify(
		{
			"ts-node": {
				// Do not forget to `npm i -D tsconfig-paths`
				"require": ["tsconfig-paths/register"]
			},
			"compilerOptions": {
				"outDir": "dist",
				"target": "esnext",
				"module": "node16",
				"experimentalDecorators": true,
				"emitDecoratorMetadata": true,
				"strict": true,
				"esModuleInterop": true,
				"skipLibCheck": true,
				"baseUrl": ".",
				"paths": {
					"@handlers/*": ["./src/handlers/*"],
					"@services/*": ["./src/services/*"]
				}
			},
			"include": [
				"src"
			]
		},
		null,
		2
	);
}

function getEnvConfig () {
	return `BOT_TOKEN="YOUR_BOT_TOKEN_HERE"
  `;
}