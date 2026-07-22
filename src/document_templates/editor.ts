import {FeedbackTab} from "../feedback/index.js"
import {
    DocumentTemplateDesigner,
    DocumentTemplateExporter
} from "@fiduswriter/document-template-editor"
import {
    addAlert,
    ensureCSS,
    findTarget,
    setDocTitle,
    whenReady
} from "fwtoolkit"

import type {FrontendApp} from "../types.js"

interface AppLike extends FrontendApp {
    csl: {getStyles: () => Promise<any>}
    page: unknown
}

export class DocTemplatesEditor {
    app: AppLike
    user: Record<string, unknown>
    id: number
    citationStyles: any
    template: any
    templateDesigner: any
    dom!: HTMLElement

    constructor(
        {app, user}: {app: AppLike; user: Record<string, unknown>},
        idString: string
    ) {
        this.app = app
        this.user = user
        this.id = Number.parseInt(idString)
        this.citationStyles = false
    }

    init(): Promise<void> {
        ensureCSS([
            staticUrl("css/errorlist.css"),
            staticUrl("css/editor.css"),
            staticUrl("css/user_template_manager.css")
        ])
        return this.app.csl
            .getStyles()
            .then(styles => {
                this.citationStyles = styles
                return this.app.apiConnectors.documentTemplate.get({
                    id: this.id
                })
            })
            .then((json: any) => {
                this.template = json
                this.id = json.id

                return whenReady()
            })
            .then(() => {
                if (this.app.page !== this) {
                    return
                }
                this.render()
                this.templateDesigner = new DocumentTemplateDesigner(
                    this.id,
                    this.template.title,
                    this.template.content,
                    this.template.document_styles,
                    this.citationStyles,
                    this.template.export_templates,
                    this.dom.querySelector("#template-editor")!,
                    this.app.apiConnectors.documentTemplate
                )
                this.templateDesigner.init()
                this.bind()
            })
    }

    render(): void {
        this.dom = document.createElement("body")
        this.dom.classList.add("fw-scrollable")
        this.dom.innerHTML = `<div id="fw-wait" class="">
            <i class="fa fa-spinner fa-pulse"></i>
        </div>
        <nav id="headerbar"><div>
            <div id="close-document-top" title="${gettext("Close the template without saving and return to the overview")}">
                <span class="fw-link-text close">
                    <i class="fa fa-times"></i>
                </span>
            </div>
            <div id="document-top">
                <h1>${gettext("Template Editor")}</h1>
            </div>
        </div>
        <div>
            <div class="fw-contents template-editor-wrapper">
                <div id="template-editor"></div>
                <ul class="fw-errorlist"></ul>
                <div class="fw-dialog-buttonset">
                    <button type="button" class="fw-dark fw-button fw-dialog-titlebar-button ui-corner-all ui-widget save">
                        ${gettext("Save")}
                    </button>
                    <button type="button" class="fw-dark fw-button fw-dialog-titlebar-button ui-corner-all ui-widget download">
                        ${gettext("Download")}
                    </button>
                    <button type="button" class="fw-orange fw-button fw-dialog-titlebar-button ui-corner-all ui-widget close">
                        ${gettext("Close")}
                    </button>
                </div>
            </div>
        </div>`
        document.body = this.dom
        setDocTitle(gettext("Template Editor"), this.app)
        const feedbackTab = new FeedbackTab(this.app)
        feedbackTab.init()
    }

    showErrors(errors: Record<string, string[]>): void {
        const el = this.dom.querySelector(".fw-errorlist")
        if (el) {
            el.innerHTML = Object.values(errors)
                .map(error => `<li>${error}</li>`)
                .join("")
        }
    }

    save(): Promise<void> {
        const el = this.dom.querySelector(".fw-errorlist")
        if (el) el.innerHTML = ""
        const {valid, value, errors, import_id, title} =
            this.templateDesigner.getCurrentValue()
        if (!valid) {
            this.showErrors(errors)
            return Promise.reject()
        } else {
            return this.app.apiConnectors.documentTemplate.save({
                id: this.id,
                value,
                import_id,
                title
            }).then(() => addAlert("info", gettext("Saved template")))
        }
    }

    download(): void {
        this.save().then(() => {
            const exporter = new DocumentTemplateExporter(
                this.id,
                this.app.apiConnectors.documentTemplate
            )
            exporter.init()
        })
    }

    bind(): void {
        this.dom.addEventListener("click", (event: Event) => {
            const el: Record<string, any> = {}
            switch (true) {
                case findTarget(event, "button.save", el):
                    event.preventDefault()
                    this.save()
                    break
                case findTarget(event, "button.download", el):
                    event.preventDefault()
                    this.download()
                    break
                case findTarget(event, "button.close, span.close", el):
                    event.preventDefault()
                    this.app.goTo("/templates/")
                    break
                default:
                    break
            }
        })
    }
}
