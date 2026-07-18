import {addAlert} from "fwtoolkit"

export const menuModel = (): {content: Array<Record<string, unknown>>} => ({
    content: [
        {
            type: "text",
            title: gettext("Create new document template"),
            keys: "Alt-n",
            action: (overview: any) => {
                overview.app.goTo("/templates/0/")
            },
            order: 1
        },
        {
            type: "text",
            title: gettext("Upload FIDUSTEMPLATE file"),
            keys: "Alt-u",
            action: (overview: any) => overview.mod.actions.uploadDocTemplate(),
            order: 2
        }
    ]
})

export const bulkMenuModel = (): {content: Array<Record<string, unknown>>} => ({
    content: [
        {
            title: gettext("Delete selected"),
            tooltip: gettext("Delete selected document templates."),
            action: (overview: any) => {
                const ids = overview.getSelected()
                const ownIds = ids.filter((id: number) => {
                    const docTemplate = overview.templateList.find(
                        (t: any) => (t.id = id)
                    )
                    return docTemplate.is_owner
                })
                if (ownIds.length !== ids.length) {
                    addAlert(
                        "error",
                        gettext("You cannot delete system document templates.")
                    )
                }
                if (ownIds.length) {
                    overview.mod.actions.deleteDocTemplatesDialog(ownIds)
                }
            },
            disabled: (overview: any) => !overview.getSelected().length
        },
        {
            title: gettext("Duplicate selected"),
            tooltip: gettext("Duplicate selected document templates."),
            action: (overview: any) => {
                const ids = overview.getSelected()
                ids.forEach((id: number) =>
                    overview.mod.actions.copyDocTemplate(
                        overview.templateList.find(
                            (t: any) => t.id === id
                        )
                    )
                )
            },
            disabled: (overview: any) => !overview.getSelected().length
        },
        {
            title: gettext("Download selected"),
            tooltip: gettext("Download selected document templates."),
            action: (overview: any) => {
                const ids = overview.getSelected()
                ids.forEach((id: number) => overview.mod.actions.downloadDocTemplate(id))
            },
            disabled: (overview: any) => !overview.getSelected().length
        }
    ]
})
