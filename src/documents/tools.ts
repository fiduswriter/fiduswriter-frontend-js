import type {Node, Schema} from "prosemirror-model"

import {getSettings} from "@fiduswriter/document/schema/convert"
import {acceptAllNoInsertions} from "@fiduswriter/document/transform"
import {addAlert} from "fwtoolkit"

import type {DocumentListApi} from "../api/index.js"

export interface DocEntry {
    id: number
    e2ee?: boolean
    content?: unknown
    rawContent?: unknown
    settings?: Record<string, unknown>
    comments?: unknown
    bibliography?: unknown
    images?: unknown
    e2ee_salt?: string | null
    e2ee_iterations?: number
}

export const getMissingDocumentListData = (
    ids: Array<number | string>,
    documentList: DocEntry[],
    schema: Schema,
    documentListApi: DocumentListApi,
    rawContent = false
): Promise<void> => {
    // get extra data for the documents identified by the ids and updates the
    // documentList correspondingly.
    const incompleteIds: number[] = []
    ids.forEach(id => {
        const numId = Number.parseInt(String(id))
        const doc = documentList.find(d => d.id === numId)
        if (!doc) {
            return
        }
        if (!Object.prototype.hasOwnProperty.call(doc, "content")) {
            incompleteIds.push(numId)
        } else if (
            rawContent &&
            !Object.prototype.hasOwnProperty.call(doc, "rawContent")
        ) {
            incompleteIds.push(numId)
        }
    })

    if (incompleteIds.length > 0) {
        return documentListApi
            .getDocumentListExtra(incompleteIds)
            .then((json: Record<string, unknown>) => {
                const documents = json.documents as Array<Record<string, unknown>>
                documents.forEach((extraValues: Record<string, unknown>) => {
                    const doc = documentList.find(
                        entry => entry.id === (extraValues.id as number)
                    )
                    if (!doc) {
                        return
                    }
                    if (extraValues.e2ee) {
                        // For E2EE documents, content is an encrypted string.
                        // Store as-is without ProseMirror parsing.
                        if (rawContent) {
                            doc.rawContent = extraValues.content
                        }
                        doc.content = extraValues.content
                        doc.settings = {}
                        doc.e2ee_salt = (extraValues.e2ee_salt as string) || null
                        doc.e2ee_iterations =
                            (extraValues.e2ee_iterations as number) || 600000
                    } else {
                        const schemaAny = schema as Schema
                        if (rawContent) {
                            doc.rawContent = JSON.parse(
                                JSON.stringify(
                                    schemaAny
                                        .nodeFromJSON(
                                            extraValues.content as Record<string, unknown>
                                        )
                                        .toJSON()
                                )
                            )
                        }
                        const parsedNode = acceptAllNoInsertions(
                            schemaAny.nodeFromJSON(
                                extraValues.content as Record<string, unknown>
                            )
                        ) as Node
                        doc.content = parsedNode.toJSON()
                        doc.settings = getSettings(doc.content as any)
                    }
                    doc.comments = extraValues.comments
                    doc.bibliography = extraValues.bibliography
                    doc.images = extraValues.images
                })
            })
            .catch((error: Error) => {
                addAlert(
                    "error",
                    gettext("Could not obtain extra document data")
                )
                throw error
            })
    } else {
        return Promise.resolve()
    }
}
