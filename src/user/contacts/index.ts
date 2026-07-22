import deepEqual from "fast-deep-equal"

import {baseBodyTemplate} from "../../common/index.js"
import {FeedbackTab} from "../../feedback/index.js"
import {SiteMenu} from "../../menu/index.js"
import {
    OverviewDataTable,
    OverviewMenuView,
    addAlert,
    avatarTemplate,
    escapeText,
    findTarget,
    setDocTitle,
    whenReady
} from "fwtoolkit"
import {DeleteContactDialog} from "./delete_dialog.js"
import {bulkMenuModel, menuModel} from "./menu.js"
import {RespondInviteDialog} from "./respond_invite.js"
import {
    deleteContactCell,
    displayContactType,
    respondInviteCell
} from "./templates.js"
import type {FrontendApp} from "../../types.js"

export interface ContactsApp extends FrontendApp {
    indexedDB: {
        readAllData: (store: string) => Promise<Array<Record<string, unknown>>>
        clearData: (store: string) => Promise<void>
        insertData: (store: string, data: Array<Record<string, unknown>>) => Promise<void>
    }
}

export class ContactsOverview {
    app: ContactsApp
    user: Record<string, unknown>
    contacts: Array<Record<string, unknown>>
    lastSort: {column: number; dir: string}
    dom!: HTMLElement
    table: any
    overviewTable: any
    dtBulk: any
    menu: any

    constructor({app, user}: {app: ContactsApp; user: Record<string, unknown>}) {
        this.app = app
        this.user = user
        this.contacts = []
        this.lastSort = {column: 0, dir: "asc"}
    }

    init(): Promise<void> {
        return whenReady().then(() => {
            this.render()
            const smenu = new SiteMenu(this.app, "")
            smenu.init()
            this.menu = new OverviewMenuView(this, menuModel as any)
            this.menu.init()
            this.bind()
            this.getList()
        })
    }

    render(): void {
        this.dom = document.createElement("body")
        this.dom.innerHTML = baseBodyTemplate({
            contents: "",
            user: this.user as any,
            hasOverview: true,
            app: this.app
        })
        document.body = this.dom
        setDocTitle(gettext("Contacts"), this.app)
        const feedbackTab = new FeedbackTab(this.app)
        feedbackTab.init()
    }

    initTable(searching = false): void {
        if (this.overviewTable) {
            this.overviewTable.destroy()
            this.overviewTable = null
        }
        this.table = null
        this.dtBulk = null

        const contentsEl = document.querySelector(".fw-contents") as HTMLElement
        contentsEl.innerHTML = ""

        this.overviewTable = new OverviewDataTable({
            dom: contentsEl,
            classes: ["fw-data-table", "fw-large", "contacts-table"],
            columns: [
                {select: 0, hidden: true, type: "number"},
                {select: 1, hidden: true, type: "string"},
                {select: 2, type: "boolean"},
                {select: [2, 6], sortable: false},
                {select: [this.lastSort.column], sort: this.lastSort.dir}
            ],
            data: this.contacts.map(contact => this.createTableRow(contact)),
            idColumn: 0,
            checkboxColumn: 2,
            bulkMenu: bulkMenuModel(),
            bulkMenuPage: this,
            searchable: searching,
            scrollY: `${Math.max(window.innerHeight - 360, 100)}px`,
            tabIndex: 1,
            labels: {
                noRows: gettext("No contacts available"),
                noResults: gettext("No contacts found")
            },
            headings: [
                "", "", "",
                gettext("Name"),
                gettext("Type"),
                gettext("Email address"),
                ""
            ],
            template: (options: any, _dom: any) =>
                `<div class='${options.classes.container}'style='height: ${options.scrollY}; overflow-Y: auto;'></div>`,
            rowRender: (row: any, tr: any, _index: number) => {
                const id = row.cells[0].data
                const contactType = row.cells[1].data
                const inputNode: any = {
                    nodeName: "input",
                    attributes: {
                        type: "checkbox",
                        class: `entry-select fw-check ${contactType}`,
                        "data-id": id,
                        "data-type": contactType,
                        id: `contact-${contactType}-${id}`
                    }
                }
                if (row.cells[2].data) {
                    inputNode.attributes.checked = true
                }
                tr.childNodes[0].childNodes = [
                    inputNode,
                    {
                        nodeName: "label",
                        attributes: {for: `contact-${contactType}-${id}`}
                    }
                ]
            },
            onDelete: (row: any) => {
                const id = row.cells[0].data
                const type = row.cells[1].data
                this.deleteContact(id, type)
            }
        } as any)
        this.overviewTable.init()
        this.table = this.overviewTable.table
        this.dtBulk = this.overviewTable.dtBulk

        this.table.on("datatable.sort", (column: number, dir: string) => {
            this.lastSort = {column, dir}
        })

        this.table.dom.focus()
    }

    createTableRow(contact: Record<string, unknown>): Array<any> {
        return [
            contact.id,
            contact.type,
            false,
            `${avatarTemplate({user: contact})} ${escapeText((contact.name as string) || "")}`,
            displayContactType({type: contact.type as string}),
            contact.email,
            contact.type === "to_userinvite"
                ? respondInviteCell(contact)
                : deleteContactCell(contact)
        ]
    }

    getList(): Promise<void> {
        const cachedPromise = this.showCached()
        if (this.app.isOffline()) {
            return cachedPromise.then(() => {})
        }
        return this.app.apiConnectors.contacts.list()
            .then((json: any) => {
                return cachedPromise.then(oldJson => {
                    if (!deepEqual(json, oldJson)) {
                        this.updateIndexedDB(json)
                        this.loadData(json)
                        this.initializeView()
                    }
                })
            })
            .catch((error: Error) => {
                if (!this.app.isOffline()) {
                    addAlert("error", gettext("Could not obtain contacts list"))
                    throw error
                }
            })
    }

    loadData(json: Record<string, unknown>): void {
        this.contacts = json.contacts as Array<Record<string, unknown>>
    }

    initializeView(): void {
        if (this.app.page === this) {
            this.initTable()
            window.scrollTo(0, 0)
        }
    }

    showCached(): Promise<any> {
        return this.loaddatafromIndexedDB().then(json => {
            if (!json) {
                return Promise.resolve(false)
            }
            this.loadData(json)
            this.initializeView()
            return json
        })
    }

    loaddatafromIndexedDB(): Promise<any> {
        return this.app.indexedDB.readAllData("user_data").then((response: any) => {
            if (!response.length) {
                return false
            }
            const data = response[0]
            delete data.id
            return data
        })
    }

    updateIndexedDB(json: any): Promise<void> {
        json.id = 1
        return this.app.indexedDB
            .clearData("user_data")
            .then(() => this.app.indexedDB.insertData("user_data", [json]))
    }

    bind(): void {
        this.dom.addEventListener("click", (event: Event) => {
            const el: Record<string, any> = {}
            switch (true) {
                case findTarget(event, ".delete-single-contact", el): {
                    const id = Number.parseInt(el.target.dataset.id)
                    const type = el.target.dataset.type

                    this.deleteContact(id, type)
                    break
                }
                case findTarget(event, ".respond-invite", el): {
                    const id = Number.parseInt(el.target.dataset.id)
                    const invite = this.contacts.find(
                        contact =>
                            contact.id === id && contact.type === "to_userinvite"
                    )
                    const dialog = new RespondInviteDialog(
                        [invite!],
                        contacts =>
                            (this.contacts = this.contacts.concat(contacts)),
                        invites =>
                            (this.contacts = this.contacts.filter(
                                contact =>
                                    !invites.find(
                                        (invite: any) =>
                                            invite.type === contact.type &&
                                            invite.id === contact.id
                                    )
                            )),
                        () => this.initializeView(),
                        this.app
                    )
                    dialog.init()
                    break
                }
                default:
                    break
            }
        })
    }

    getSelected(): Array<{id: number; type: string}> {
        return Array.from(
            this.dom.querySelectorAll(".entry-select:checked:not(:disabled)")
        ).map(el => ({
            id: Number.parseInt((el as HTMLElement).dataset.id!),
            type: (el as HTMLElement).dataset.type!
        }))
    }

    deleteContact(id: number, type: string): void {
        const dialog = new DeleteContactDialog([{id, type}], this.app)
        dialog.init().then(() => {
            this.contacts = this.contacts.filter(
                ocontact => ocontact.id !== id || ocontact.type !== type
            )
            this.initializeView()
        })
    }
}
