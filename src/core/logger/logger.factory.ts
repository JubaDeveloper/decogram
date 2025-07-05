import pino from "pino"

export const LoggerFactory = () => {
    return {
        getBotLogger (botToken: string) {
            const args = {
                transport: {
                  target: "pino-pretty",
                  options: { colorize: true }
                },
                base: {
                  botToken
                },
                level: "trace"
              }
            return pino({
                transport: {
                  target: "pino-pretty",
                  options: { colorize: true }
                },
                base: {
                  botToken
                },
                level: "trace"
              })
        },
        getDefaultLogger () {
            return pino({
                transport: {
                    target: "pino-pretty",
                    options: { colorize: true }
                },
                level: "trace"
            })
        }
    }
}