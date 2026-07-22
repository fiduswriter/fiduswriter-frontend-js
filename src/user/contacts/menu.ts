import {AddContactDialog} from "./add_dialog.js"
import {DeleteContactDialog} from "./delete_dialog.js"

export const bulkMenuModel = (): {content: Array<Record<string, unknown>>} => ({
    content: [
        {
            title: gettext("Delete selected"),
            tooltip: gettext("Delete selected contacts."),
            action: (overview: any) => {
                const selected = overview.getSelected()
                if (selected.length) {
                    const dialog = new DeleteContactDialog(selected, overview.app)
                    dialog.init().then(() => {
                        overview.contacts = overview.contacts.filter(
                            (ocontact: any) =>
                                !selected.some(
                                    (scontact: any) =>
                                        scontact.id == ocontact.id &&
                                        scontact.type == ocontact.type
                                )
                        )
                        overview.initializeView()
                    })
                }
            },
            disabled: (overview: any) => !overview.getSelected().length
        }
    ]
})

let currentlySearching = false

export const menuModel = (): {content: Array<Record<string, unknown>>} => ({
    content: [
        {
            type: "text",
            title: gettext("Invite contact"),
            keys: "Alt-i",
            action: (overview: any) => {
                const dialog = new AddContactDialog(
                    overview.app.settings,
                    overview.app.apiConnectors.contacts
                )
                dialog.init().then((contacts: any) => {
                    contacts.forEach((contact: any) => overview.contacts.push(contact))
                    overview.initializeView()
                })
            },
            order: 0
        },
        {
            type: "search",
            icon: "search",
            title: gettext("Search contacts"),
            keys: "Alt-s",
            input: (overview: any, text: string) => {
                if (text.length && !currentlySearching) {
                    overview.initTable(true)
                    currentlySearching = true
                    overview.table.on("datatable.init", () =>
                        overview.table.search(text)
                    )
                } else if (!text.length && currentlySearching) {
                    overview.initTable(false)
                    currentlySearching = false
                } else if (text.length) {
                    overview.table.search(text)
                }
            },
            order: 1
        }
    ]
})
