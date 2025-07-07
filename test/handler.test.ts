import { CallbackHandler, MessageHandler } from "decogram@core/decorators/io/class"
import { OnCallbackQuery, OnMessage } from "decogram@core/decorators/io/method"
import { OnCallbackInMessageHandlerError, OnMessageInCallbackHandlerError } from "decogram@core/errors/errors"

describe("Handler", () => {
	test("Should throw when OnMessage is registered in CallbackHandler", () => {
		expect(() => {
            @CallbackHandler()
			class MyCallbackHandler {
                @OnMessage()
            	public onMessage () {
            		//dummy
            	}
            }
		}).toThrow(OnMessageInCallbackHandlerError)
	})

	test("Should throw when OnCallbackQuery is registered in MessageHandler", () => {
		expect(() => {
            @MessageHandler()
			class MyMessageHandler {
                @OnCallbackQuery()
            	public onMessage () {
            		//dummy
            	}
            }
		}).toThrow(OnCallbackInMessageHandlerError)
	})
})