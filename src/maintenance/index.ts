import JSZip from "jszip"

import {updateFile} from "@fiduswriter/document/importer/native/update"
import {updateDoc} from "@fiduswriter/document/schema/convert"
import {FW_DOCUMENT_VERSION} from "@fiduswriter/document/schema/index"
import {addAlert, findTarget, get, post, postJson, whenReady} from "fwtoolkit"

export class DocMaintenance {
    batch: number
    revSavesLeft: number
    docTemplatesSavesLeft: number

    constructor() {
        this.batch = 0
        this.revSavesLeft = 0
        this.docTemplatesSavesLeft = 0
    }

    init(): void {
        whenReady().then(() =>
            document.body.addEventListener("click", (event: Event) => {
                const el: Record<string, any> = {}
                switch (true) {
                    case findTarget(event, "input#update:not(.fw-disabled)", el):
                        ;(document.querySelector("input#update") as HTMLInputElement).disabled = true
                        ;(document.querySelector("input#update") as HTMLInputElement).value =
                            gettext("Updating...")
                        addAlert("info", gettext("Updating documents."))
                        this.getDocBatch()
                        break
                    default:
                        break
                }
            })
        )
    }

    getDocBatch(): void {
        this.batch++
        postJson("/api/document/admin/get_all_old/")
            .then(({json}: any) => {
                const docs = window.JSON.parse(json.docs)
                if (docs.length) {
                    addAlert("info", `${gettext("Downloaded batch")}: ${this.batch}`)
                    Promise.all(docs.map((doc: any) => this.fixDoc(doc))).then(() =>
                        this.getDocBatch()
                    )
                } else {
                    if (this.batch > 1) {
                        addAlert("success", gettext("All documents updated!"))
                    } else {
                        addAlert("info", gettext("No documents to update."))
                    }
                    this.updateDocumentTemplates()
                }
            })
            .catch((error: Error) => {
                addAlert("error", `${gettext("Could not download batch")}: ${this.batch}`)
                throw error
            })
    }

    fixDoc(doc: any): Promise<void> {
        const oldDoc = {
            content: doc.fields.content,
            diffs: doc.fields.diffs,
            bibliography: doc.fields.bibliography,
            comments: doc.fields.comments,
            title: doc.fields.title,
            version: doc.fields.version,
            id: doc.pk
        }
        const docVersion = Number.parseFloat(doc.fields.doc_version)
        let p: Promise<any>
        if (docVersion < 2) {
            p = postJson("/api/document/admin/get_user_biblist/", {
                user_id: doc.fields.owner
            }).then(({json}: any) => {
                return json.bibList.reduce((db: any, item: any) => {
                    const id = item["id"]
                    const bibDBEntry: any = {}
                    bibDBEntry["fields"] = JSON.parse(item["fields"])
                    bibDBEntry["bib_type"] = item["bib_type"]
                    bibDBEntry["entry_key"] = item["entry_key"]
                    db[id] = bibDBEntry
                    return db
                }, {})
            })
        } else {
            p = Promise.resolve(doc.bibliography)
        }
        return p.then((bibliography: any) => {
            const updatedDoc = updateDoc(oldDoc, docVersion, bibliography)
            return this.saveDoc(updatedDoc)
        })
    }

    saveDoc(doc: any): Promise<void> {
        const p1 = post("/api/document/admin/save_doc/", {
            id: doc.id,
            content: doc.content,
            bibliography: doc.bibliography,
            comments: doc.comments,
            version: doc.version,
            diffs: doc.diffs
        })
        const promises = [p1]
        if (doc.imageIds) {
            const p2 = post("/api/document/admin/add_images_to_doc/", {
                doc_id: doc.id,
                ids: doc.imageIds
            })
            promises.push(p2)
        }
        return Promise.all(promises).then(() => {
            addAlert("success", `${gettext("The document has been updated")}: ${doc.id}`)
        })
    }

    updateDocumentTemplates(): void {
        addAlert("info", gettext("Updating document templates."))
        postJson("/api/document/admin/get_all_template_ids/").then(({json}: any) => {
            const count = json.template_ids.length
            if (count) {
                json.template_ids.forEach((templateId: number) =>
                    this.updateDocumentTemplate(templateId)
                )
            } else {
                addAlert("info", gettext("No document templates to update."))
                this.updateRevisions()
            }
        })
    }

    updateDocumentTemplate(id: number): void {
        postJson("/api/document/admin/get_template/base/", {id}).then(
            ({json}: any) => {
                const oldDoc = {
                    content: json.content,
                    diffs: [],
                    bibliography: {},
                    comments: {},
                    title: json.title,
                    version: 1,
                    id
                }
                const docVersion = Number.parseFloat(json.doc_version)
                const doc = updateDoc(oldDoc, docVersion)
                this.saveDocumentTemplate(doc)
            }
        )
    }

    saveDocumentTemplate(doc: any): void {
        this.docTemplatesSavesLeft++
        post("/api/document/admin/save_template/", {
            id: doc.id,
            content: doc.content
        }).then(() => {
            addAlert(
                "success",
                `${gettext("The document template has been updated")}: ${doc.id}`
            )
            this.docTemplatesSavesLeft--
            if (!this.docTemplatesSavesLeft) {
                addAlert("success", gettext("All document templates updated!"))
                this.updateRevisions()
            }
        })
    }

    updateRevisions(): void {
        addAlert("info", gettext("Updating saved revisions."))
        postJson("/api/document/admin/get_all_revision_ids/").then(({json}: any) => {
            this.revSavesLeft = json.revision_ids.length
            if (this.revSavesLeft) {
                json.revision_ids.forEach((revId: number) => this.updateRevision(revId))
            } else {
                addAlert("info", gettext("No document revisions to update."))
                this.done()
            }
        })
    }

    updateRevision(id: number): void {
        get(`/api/document/get_revision/${id}/`)
            .then((response: Response) => response.blob())
            .then((blob: Blob) => {
                const zipfs = new JSZip()
                return zipfs.loadAsync(blob).then(() => {
                    const openedFiles: Record<string, string> = {}
                    const p: Array<Promise<void>> = []
                    const fileNames = [
                        "filetype-version",
                        "document.json",
                        "bibliography.json"
                    ]

                    fileNames.forEach(fileName => {
                        p.push(
                            (zipfs.files[fileName] as any)
                                .async("text")
                                .then((fileContent: string) => {
                                    openedFiles[fileName] = fileContent
                                })
                        )
                    })
                    return Promise.all(p).then(() => {
                        const filetypeVersion = Number.parseFloat(
                            openedFiles["filetype-version"]
                        )
                        const {bibliography, doc} = updateFile(
                            window.JSON.parse(openedFiles["document.json"]),
                            filetypeVersion,
                            window.JSON.parse(openedFiles["bibliography.json"])
                        )
                        zipfs.file("filetype-version", FW_DOCUMENT_VERSION)
                        zipfs.file("document.json", window.JSON.stringify(doc))
                        zipfs.file("bibliography.json", window.JSON.stringify(bibliography))
                        this.saveRevision(id, zipfs)
                    })
                })
            })
    }

    saveRevision(id: number, zipfs: JSZip): void {
        zipfs
            .generateAsync({type: "blob", mimeType: "application/fidus+zip"})
            .then((blob: Blob) => {
                post(
                    "/api/document/admin/update_revision/",
                    {id},
                    {
                        file: {
                            file: blob,
                            filename: "some_file.fidus"
                        }
                    }
                ).then(() => {
                    addAlert(
                        "success",
                        gettext("The document revision has been updated: ") + id
                    )
                    this.revSavesLeft--
                    if (this.revSavesLeft === 0) {
                        this.done()
                    }
                })
            })
    }

    done(): void {
        ;(document.querySelector("input#update") as HTMLInputElement).value = gettext(
            "All documents, document templates and document revisions updated!"
        )
    }
}
