import {Dialog, escapeText} from "fwtoolkit"
import type {FrontendApp} from "../../types.js"

export class RespondInviteDialog {
    invites: Array<Record<string, unknown>>
    addCallback: (contacts: Array<Record<string, unknown>>) => void
    deleteCallback: (invites: Array<Record<string, unknown>>) => void
    doneCallback: () => void
    app: FrontendApp

    constructor(
        invites: Array<Record<string, unknown>>,
        addCallback: (contacts: Array<Record<string, unknown>>) => void = () => {},
        deleteCallback: (invites: Array<Record<string, unknown>>) => void = () => {},
        doneCallback: () => void = () => {},
        app: FrontendApp
    ) {
        this.invites = invites
        this.addCallback = addCallback
        this.deleteCallback = deleteCallback
        this.doneCallback = doneCallback
        this.app = app
    }

    init(): void {
        const buttons = [
            {
                text:
                    this.invites.length > 1
                        ? gettext("Accept all invites")
                        : gettext("Accept invite"),
                classes: "fw-dark",
                click: () => {
                    this.app.apiConnectors.contacts.accept({
                        invites: this.invites
                    }).then(({json, status}: any) => {
                        dialog.close()
                        if (status == 200) {
                            this.deleteCallback(this.invites)
                            this.addCallback(json.contacts)
                            this.doneCallback()
                        }
                    })
                }
            },
            {
                text:
                    this.invites.length > 1
                        ? gettext("Decline all invites")
                        : gettext("Decline invite"),
                classes: "fw-dark",
                click: () => {
                    this.app.apiConnectors.contacts.decline({
                        invites: this.invites
                    }).then(({status}: any) => {
                        dialog.close()
                        if (status == 200) {
                            this.deleteCallback(this.invites)
                            this.doneCallback()
                        }
                    })
                }
            },
            {type: "cancel"}
        ]
        const dialog = new Dialog({
            title: gettext("Accept of invite"),
            id: "confirmaccept",
            body: `<p>${
                this.invites.length > 1
                    ? gettext("Do you want to accept the below invites?")
                    : gettext("Do you want to accept the below invite?")
            }</p>
            ${this.invites.map(invite => `<p>${escapeText((invite.name as string) || "")} (${escapeText((invite.email as string) || "")})</p>`).join("")}`,
            height: 60,
            buttons
        } as any)
        dialog.open()
    }
}
