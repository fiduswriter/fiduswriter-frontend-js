import {Dialog, postJson} from "fwtoolkit"

export class DeleteContactDialog {
    contacts: Array<Record<string, unknown>>

    constructor(contacts: Array<Record<string, unknown>>) {
        this.contacts = contacts
    }

    init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const buttons = [
                {
                    text: gettext("Delete"),
                    classes: "fw-dark",
                    click: () => {
                        postJson("/api/user/contacts/delete/", {
                            contacts: this.contacts
                        }).then(({status}: any) => {
                            dialog.close()
                            if (status == 200) {
                                return resolve()
                            }
                            return reject()
                        })
                    }
                },
                {type: "cancel"}
            ]
            const dialog = new Dialog({
                title: gettext("Confirm deletion"),
                id: "confirmdeletion",
                body: `<p>${gettext("Remove from contacts")}?</p>`,
                height: 60,
                buttons
            } as any)
            dialog.open()
        })
    }
}
