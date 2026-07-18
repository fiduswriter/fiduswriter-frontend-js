import {
    MAX_FW_DOCUMENT_VERSION as GENERIC_MAX_FW_DOCUMENT_VERSION,
    MIN_FW_DOCUMENT_VERSION as GENERIC_MIN_FW_DOCUMENT_VERSION,
    FidusFileImporter as GenericFidusFileImporter
} from "@fiduswriter/document/importer/native"
import {createNativeImporterBackend} from "./import.js"

export const MIN_FW_DOCUMENT_VERSION = GENERIC_MIN_FW_DOCUMENT_VERSION
export const MAX_FW_DOCUMENT_VERSION = GENERIC_MAX_FW_DOCUMENT_VERSION

export class FidusFileImporter extends GenericFidusFileImporter {
    constructor(
        file: File | Blob,
        user: Record<string, unknown>,
        path = "",
        check = false,
        contacts: Array<Record<string, unknown>> = [],
        e2eeOptions: any = null
    ) {
        super(file, user as any, path, createNativeImporterBackend(user, e2eeOptions) as any, {
            check,
            contacts,
            e2eeOptions,
            checkDocUsers: check ? checkDocUsers : undefined
        } as any)
    }
}

function checkDocUsers(
    doc: any,
    user: Record<string, unknown>,
    contacts: Array<Record<string, unknown>>
): any {
    Object.values(doc.comments as Record<string, any>).forEach((comment: any) => {
        if (
            !(
                contacts.find(
                    (member: any) =>
                        member.id === comment.user &&
                        member.username === comment.username
                ) ||
                (user.id === comment.user && user.username === comment.username)
            )
        ) {
            comment.user = 0
        }
        if (
            !(
                !comment.assignedUser ||
                contacts.find(
                    (member: any) =>
                        member.id === comment.assignedUser &&
                        member.username === comment.assignedUsername
                ) ||
                (user.id === comment.assignedUser &&
                    user.username === comment.assignedUsername)
            )
        ) {
            comment.assignedUser = 0
        }
        if (comment.answers) {
            comment.answers.forEach((answer: any) => {
                if (
                    !(
                        contacts.find(
                            (member: any) =>
                                member.id === answer.user &&
                                member.username === answer.username
                        ) ||
                        (user.id === answer.user &&
                            user.username === answer.username)
                    )
                ) {
                    answer.user = 0
                }
            })
        }
    })
    checkDocUsersNode(doc.content, user, contacts)
    return doc
}

function checkDocUsersNode(
    node: any,
    user: Record<string, unknown>,
    contacts: Array<Record<string, unknown>>
): void {
    if (node.marks) {
        node.marks.forEach((mark: any) => {
            if (["insertion", "deletion"].includes(mark.type)) {
                if (
                    !(
                        contacts.find(
                            (member: any) =>
                                member.id === mark.attrs.user &&
                                member.username === mark.attrs.username
                        ) ||
                        (user.id === mark.attrs.user &&
                            user.username === mark.attrs.username)
                    )
                ) {
                    mark.attrs.user = 0
                }
            }
        })
    }
    if (node.content) {
        node.content.forEach((childNode: any) =>
            checkDocUsersNode(childNode, user, contacts)
        )
    }
}
