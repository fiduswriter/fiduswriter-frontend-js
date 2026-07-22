import {Dialog, cancelPromise, escapeText} from "fwtoolkit"
import {addContactTemplate} from "./templates.js"

export class AddContactDialog {
    settings: Record<string, unknown>
    contactsApi: {add(data: {user_string: string}): Promise<{json: unknown; status: number}>}

    constructor(
        settings: Record<string, unknown>,
        contactsApi: {add(data: {user_string: string}): Promise<{json: unknown; status: number}>}
    ) {
        this.settings = settings
        this.contactsApi = contactsApi
    }

    init(): Promise<Array<Record<string, unknown>>> {
        return new Promise(resolve => {
            const buttons = [
                {
                    text: gettext("Submit"),
                    classes: "fw-dark",
                    click: () => {
                        const userString = (
                            document.getElementById("new-contact-user-string") as HTMLInputElement
                        ).value
                        document
                            .querySelectorAll("#add-new-contact .fw-warning")
                            .forEach(el => el.parentElement!.removeChild(el))
                        const userStrings = userString.split(/[\s,;]+/)
                        let chain: Promise<Array<Record<string, unknown>>> = Promise.resolve([])

                        userStrings
                            .filter(singleUserString => singleUserString.length)
                            .forEach(
                                singleUserString =>
                                    (chain = chain.then(responses =>
                                        this.addContact(singleUserString).then(
                                            data => [...responses, data]
                                        )
                                    ))
                            )
                        Promise.resolve(chain).then(contactData => {
                            if (contactData.length) {
                                dialog.close()
                                resolve(contactData)
                            }
                        })
                    }
                },
                {type: "cancel"}
            ]

            const dialog = new Dialog({
                id: "add-new-contact",
                title:
                    this.settings?.REGISTRATION_OPEN ||
                    this.settings?.SOCIALACCOUNT_OPEN
                        ? gettext("Add contact or invite new user")
                        : gettext("Add contact"),
                body: addContactTemplate(),
                width: 350,
                height: 250,
                buttons
            } as any)

            dialog.open()
            ;(document.getElementById("new-contact-user-string") as HTMLElement).style.width =
                "340"
        })
    }

    addContact(
        userString: string | null | undefined
    ): Promise<Record<string, unknown>> {
        if (null === userString || "undefined" == typeof userString) {
            return cancelPromise()
        }

        userString = userString.trim()
        if ("" === userString) {
            return cancelPromise()
        }

        return this.contactsApi.add({
            user_string: userString
        }).then(({json, status}: any) => {
            if (status == 201) {
                return json.contact
            } else {
                let responseHtml
                if (json.error === 1) {
                    responseHtml = gettext("You cannot add yourself to your contacts!")
                } else if (json.error === 2) {
                    responseHtml = gettext("This person is already in your contacts!")
                } else if (json.error === 3) {
                    responseHtml = gettext("Invalid email!")
                }
                const container = document.getElementById("add-new-contact")
                if (container) {
                    container.insertAdjacentHTML(
                        "beforeend",
                        `<div class="fw-warning" style="padding: 8px;">${escapeText(userString!)}: ${responseHtml}</div>`
                    )
                }
                return cancelPromise()
            }
        })
    }
}
