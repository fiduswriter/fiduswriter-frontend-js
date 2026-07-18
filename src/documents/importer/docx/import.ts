import {DocxImporter as GenericDocxImporter} from "@fiduswriter/document/importer/docx"
import {postJson} from "fwtoolkit"
import {createNativeImporterBackend} from "../native/import.js"

export class DocxImporter extends GenericDocxImporter {
    constructor(
        file: File,
        user: Record<string, unknown>,
        path: string,
        importId: string,
        options: Record<string, unknown> = {}
    ) {
        super(file, user as any, path, importId, {
            getTemplate: (id: string) =>
                postJson("/api/document/get_template/", {
                    import_id: id
                }).then(({json}: any) => json.template),
            nativeBackend: createNativeImporterBackend(
                user,
                options.e2eeOptions as any
            ),
            e2eeOptions: options.e2eeOptions
        } as any)
    }
}
