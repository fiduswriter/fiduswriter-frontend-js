import {OdtImporter as GenericOdtImporter} from "@fiduswriter/document/importer/odt"
import {postJson} from "fwtoolkit"
import {createNativeImporterBackend} from "../native/import.js"

export class OdtImporter extends GenericOdtImporter {
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
            bibDB: options.bibDB,
            e2eeOptions: options.e2eeOptions
        } as any)
    }
}
