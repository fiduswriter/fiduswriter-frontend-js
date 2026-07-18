import {Dialog, activateWait, addAlert, deactivateWait, postBare} from "fwtoolkit"
import {deleteUserDialogTemplate} from "./templates.js"

export class DeleteUserDialog {
    username: string
    dialog: any

    constructor(username: string) {
        this.username = username
    }

    init(): void {
        const buttons = [
            {
                text: gettext("Delete"),
                classes: "fw-dark",
                click: () => {
                    const usernamefieldValue = (
                        document.getElementById("username-confirmation") as HTMLInputElement
                    ).value
                    const passwordfieldValue = (
                        document.getElementById("password") as HTMLInputElement
                    ).value
                    if (
                        usernamefieldValue === this.username &&
                        passwordfieldValue.length
                    ) {
                        this.deleteCurrentUser(passwordfieldValue)
                    }
                }
            },
            {type: "cancel"}
        ]
        this.dialog = new Dialog({
            id: "confirmaccountdeletion",
            title: gettext("Confirm deletion"),
            body: deleteUserDialogTemplate(),
            icon: "exclamation-triangle",
            buttons,
            height: 250
        } as any)
        this.dialog.open()
    }

    deleteCurrentUser(password: string): void {
        activateWait()

        postBare("/api/user/delete/", {password}).then((response: Response) => {
            switch (response.status) {
                case 200:
                    window.location.href = "/"
                    break
                case 403:
                    addAlert(
                        "error",
                        gettext(
                            "Staff accounts have to be deleted through the admin interface."
                        )
                    )
                    break
                case 401:
                    addAlert("error", gettext("Password incorrect."))
                    break
                default:
                    addAlert("error", gettext("Could not delete user account."))
                    break
            }
            deactivateWait()
        })
    }
}
