import {addAlert, findTarget, whenReady} from "fwtoolkit"
import type {SystemMessageApi} from "../api/index.js"

interface AdminConsoleApp {
    apiConnectors: {
        systemMessage: SystemMessageApi
    }
}

// To see how many users are currently online and send them maintenance messages

export class AdminConsole {
    app: AdminConsoleApp

    constructor(app: AdminConsoleApp) {
        this.app = app
    }

    init(): void {
        whenReady().then(() => {
            this.render()
            this.bind()
        })
    }

    bind(): void {
        document.body.addEventListener("click", event => {
            const el: {target?: HTMLElement} = {}
            switch (true) {
                case findTarget(
                    event,
                    "input#submit_user_message:not(.fw-disabled)",
                    el
                ): {
                    const message = (
                        document.querySelector(
                            "textarea#user_message"
                        ) as HTMLTextAreaElement
                    ).value
                    if (!message.length) {
                        return
                    }
                    ;(
                        document.querySelector(
                            "textarea#user_message"
                        ) as HTMLTextAreaElement
                    ).disabled = true
                    ;(
                        document.querySelector(
                            "input#submit_user_message"
                        ) as HTMLInputElement
                    ).disabled = true
                    ;(
                        document.querySelector(
                            "input#submit_user_message"
                        ) as HTMLInputElement
                    ).value = gettext("Sending...")
                    this.sendSystemMessage(message)
                    break
                }
                default:
                    break
            }
        })
    }

    sendSystemMessage(message: string): Promise<void> {
        return this.app.apiConnectors.systemMessage.send({message}).then(
            () => {
                addAlert("info", gettext("Message delivered successfully!"))
                const button = document.querySelector(
                    "input#submit_user_message"
                ) as HTMLInputElement
                button.value = gettext("Message delivered")
            }
        )
    }

    render(): Promise<void> {
        return this.app.apiConnectors.systemMessage.get().then(
            (data: unknown) => {
                const {sessions, users} = data as {sessions: number; users: number}
                const sessionCounterEl =
                    document.getElementById("session_count")
                if (sessionCounterEl) {
                    sessionCounterEl.innerHTML = String(sessions)
                }
                const userCounterEl = document.getElementById("user_count")
                if (userCounterEl) {
                    userCounterEl.innerHTML = String(users)
                }
            }
        )
    }
}
