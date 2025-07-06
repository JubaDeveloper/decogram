import { SingletonService } from "../singleton/singleton"

type Constructor<T = any> = new (...args: any[]) => T

export const bootstrap = (TelegramMaster: Constructor) => {
	SingletonService.loadClassInstance(TelegramMaster)
}