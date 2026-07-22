import {
    DocumentTemplateExporter,
    DocumentTemplateImporter
} from "@fiduswriter/document-template-editor"
import {Dialog, activateWait, addAlert, deactivateWait} from "fwtoolkit"

import {importFidusTemplateTemplate} from "./templates.js"
import type {DocTemplatesOverview} from "./overview.js"

export class DocTemplatesActions {
    docTemplatesOverview: DocTemplatesOverview

    constructor(docTemplatesOverview: DocTemplatesOverview) {
        docTemplatesOverview.mod.actions = this
        this.docTemplatesOverview = docTemplatesOverview
    }

    deleteDocTemplate(id: number): void {
        const docTemplate = this.docTemplatesOverview.templateList.find(
            t => t.id === id
        )
        if (!docTemplate) {
            return
        }

        this.docTemplatesOverview.app.apiConnectors.documentTemplate.delete({id})
            .catch((error: Error) => {
                addAlert(
                    "error",
                    `${gettext("Could not delete document template")}: '${docTemplate.title}'`
                )
                throw error
            })
            .then((json: any) => {
                if (json.done) {
                    addAlert(
                        "success",
                        `${gettext("Document template successfully deleted")}: '${docTemplate.title}'`
                    )
                    this.docTemplatesOverview.removeTableRows([id])
                    this.docTemplatesOverview.templateList =
                        this.docTemplatesOverview.templateList.filter(t => t.id !== id)
                } else {
                    addAlert(
                        "error",
                        `${gettext("Document template still required by documents")}: '${docTemplate.title}'`
                    )
                }
            })
    }

    deleteDocTemplatesDialog(ids: number[]): void {
        const buttons = [
            {
                text: gettext("Delete"),
                classes: "fw-dark",
                click: () => {
                    ids.forEach(id => this.deleteDocTemplate(Number.parseInt(String(id))))
                    dialog.close()
                }
            },
            {type: "close"}
        ]

        const dialog = new Dialog({
            title: gettext("Confirm deletion"),
            id: "confirmdeletion",
            icon: "exclamation-triangle",
            body: `<p>${ids.length > 1 ? gettext("Delete the document templates?") : gettext("Delete the document template?")}</p>`,
            buttons
        } as any)
        dialog.open()
    }

    copyDocTemplate(oldDocTemplate: Record<string, unknown>): void {
        this.docTemplatesOverview.app.apiConnectors.documentTemplate.copy({
            id: oldDocTemplate.id as number,
            title: `${gettext("Copy of")} ${oldDocTemplate.title as string}`
        })
            .catch((error: Error) => {
                addAlert("error", gettext("The document template could not be copied"))
                throw error
            })
            .then((json: any) => {
                const docTemplate: any = JSON.parse(JSON.stringify(oldDocTemplate))
                docTemplate.is_owner = true
                docTemplate.id = json["id"]
                docTemplate.title = json["title"]
                this.docTemplatesOverview.templateList.push(docTemplate)
                this.docTemplatesOverview.addDocTemplateToTable(docTemplate)
            })
    }

    downloadDocTemplate(id: number): void {
        const exporter = new DocumentTemplateExporter(
            id,
            this.docTemplatesOverview.app.apiConnectors.documentTemplate
        )
        exporter.init()
    }

    uploadDocTemplate(): void {
        const buttons = [
            {
                text: gettext("Import"),
                classes: "fw-dark",
                click: () => {
                    const uploader = document.getElementById(
                        "fidus-template-uploader"
                    ) as HTMLInputElement
                    let fidusTemplateFile = uploader.files
                    if (!fidusTemplateFile || 0 === fidusTemplateFile.length) {
                        return false
                    }
                    const file = uploader.files![0]
                    if (104857600 < file.size) {
                        return false
                    }
                    activateWait()

                    const importer = new DocumentTemplateImporter(
                        file,
                        this.docTemplatesOverview.app.apiConnectors.documentTemplate
                    )

                    importer
                        .init()
                        .then(({ok, statusText, docTemplate}: any) => {
                            deactivateWait()
                            if (ok) {
                                addAlert("info", statusText)
                            } else {
                                addAlert("error", statusText)
                                return
                            }

                            docTemplate.is_owner = true

                            this.docTemplatesOverview.templateList.push(docTemplate)
                            this.docTemplatesOverview.addDocTemplateToTable(docTemplate)
                            importDialog.close()
                        })
                        .catch(() => false)
                    return undefined
                }
            },
            {type: "cancel"}
        ]
        const importDialog = new Dialog({
            id: "importfidustemplate",
            title: gettext("Import a Fidus Template file"),
            body: importFidusTemplateTemplate(),
            height: 100,
            buttons
        } as any)
        importDialog.open()

        const uploader = document.getElementById("fidus-template-uploader")
        if (uploader) {
            uploader.addEventListener("change", () => {
                const nameEl = document.getElementById("import-fidus-template-name")
                if (nameEl) {
                    nameEl.innerHTML = (uploader as HTMLInputElement).value.replace(
                        /C:\\fakepath\\/i,
                        ""
                    )
                }
            })
        }

        const importBtn = document.getElementById("import-fidus-template-btn")
        if (importBtn) {
            importBtn.addEventListener("click", event => {
                ;(document.getElementById("fidus-template-uploader") as HTMLElement).click()
                event.preventDefault()
            })
        }
    }
}
