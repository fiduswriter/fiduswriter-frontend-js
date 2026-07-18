import StackTrace from "stacktrace-js"

interface CsrfSettings {
    getCsrfToken(): string
}

declare global {
    interface Window {
        settings: CsrfSettings & Record<string, unknown>
    }
}

export class ErrorHook {
    constructor() {}

    init(): void {
        window.onerror = (
            msg: string | Event,
            url?: string,
            lineNumber?: number,
            columnNumber?: number,
            errorObj?: Error
        ) => this.onError(msg, url, lineNumber, columnNumber, errorObj)
        if (window.addEventListener) {
            window.addEventListener("unhandledrejection", (rejection: PromiseRejectionEvent) =>
                this.onUnhandledRejection(rejection)
            )
        }
    }

    sendLog(details: string): void {
        const body = new FormData()
        body.append("context", navigator.userAgent)
        body.append("details", details)

        fetch("/api/django_js_error_hook/", {
            method: "POST",
            headers: {
                "X-CSRFToken": window.settings.getCsrfToken()
            },
            credentials: "include",
            body
        }).catch(error => {
            console.warn(error)
        })
    }

    onError(
        msg: string | Event,
        url?: string,
        lineNumber?: number,
        columnNumber?: number,
        errorObj?: Error
    ): void {
        if (window.settings?.SOURCE_MAPS && errorObj) {
            StackTrace.fromError(errorObj)
                .then((stackFrames: StackTrace.StackFrame[]) =>
                    this.logError(
                        msg,
                        url,
                        lineNumber,
                        columnNumber,
                        errorObj,
                        stackFrames.map((sf: StackTrace.StackFrame) => sf.toString()).join("\n")
                    )
                )
                .catch(() =>
                    this.logError(msg, url, lineNumber, columnNumber, errorObj)
                )
        } else {
            this.logError(msg, url, lineNumber, columnNumber, errorObj)
        }
    }

    logError(
        msg: string | Event,
        url?: string,
        lineNumber?: number,
        columnNumber?: number,
        errorObj?: Error,
        mappedStack: string | false = false
    ): void {
        let logMessage = url + ": " + lineNumber + ": " + String(msg)
        if (columnNumber) {
            logMessage += ", " + columnNumber
        }
        if (errorObj?.stack) {
            logMessage += ", " + errorObj.stack
        }
        if (mappedStack) {
            logMessage += "\n" + mappedStack
        }
        this.sendLog(logMessage)
    }

    onUnhandledRejection(rejection: PromiseRejectionEvent): void {
        if (window.settings?.SOURCE_MAPS && rejection.reason?.stack) {
            StackTrace.fromError(rejection.reason)
                .then((stackFrames: StackTrace.StackFrame[]) =>
                    this.logUnhandledRejection(
                        rejection,
                        stackFrames.map((sf: StackTrace.StackFrame) => sf.toString()).join("\n")
                    )
                )
                .catch(() => this.logUnhandledRejection(rejection))
        } else {
            this.logUnhandledRejection(rejection)
        }
    }

    logUnhandledRejection(
        rejection: PromiseRejectionEvent,
        mappedStack: string | false = false
    ): void {
        let logMessage = rejection.type
        if (rejection.reason?.message) {
            logMessage += ", " + rejection.reason.message
        } else {
            logMessage += ", " + JSON.stringify(rejection.reason)
        }
        if (rejection.reason?.stack) {
            logMessage += ", " + rejection.reason.stack
        }
        if (mappedStack) {
            logMessage += "\n" + mappedStack
        }
        this.sendLog(logMessage)
    }
}
