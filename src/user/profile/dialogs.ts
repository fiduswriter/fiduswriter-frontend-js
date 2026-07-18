import {Dialog, activateWait, addAlert, deactivateWait, escapeText, post, postJson} from "fwtoolkit"
import {
    changeAvatarDialogTemplate,
    changeEmailDialogTemplate,
    changePrimaryEmailDialogTemplate,
    changePwdDialogTemplate,
    confirmDeleteAvatarTemplate,
    deleteEmailDialogTemplate
} from "./templates.js"

export const changeAvatarDialog = (app: any): void => {
    const buttons = [
        {
            text: gettext("Upload"),
            classes: "fw-dark",
            click: () => {
                if (!avatarUploader.files?.length) {
                    return
                }

                activateWait()

                const file = avatarUploader.files[0]

                post(
                    "/api/user/avatar/upload/",
                    {},
                    {
                        avatar: {
                            file,
                            filename: file.name
                        }
                    }
                )
                    .then(() => deactivateWait())
                    .then(() => app.getConfiguration())
                    .then(() => app.selectPage())
                    .catch(() => {
                        deactivateWait()
                        addAlert("error", gettext("Could not update profile avatar"))
                    })
                dialog.close()
            }
        },
        {type: "cancel"}
    ]

    const avatarUploader = document.createElement("input")
    avatarUploader.type = "file"
    avatarUploader.accept = ".png, .jpg, .jpeg"
    avatarUploader.style.display = "none"

    const dialog = new Dialog({
        id: "change-avatar-dialog",
        title: gettext("Upload your profile picture"),
        body: changeAvatarDialogTemplate(),
        buttons
    } as any)
    dialog.open()
    dialog.dialogEl.appendChild(avatarUploader)

    avatarUploader.addEventListener("change", () => {
        const nameEl = document.getElementById("uploaded-avatar-name")
        if (nameEl) {
            nameEl.innerHTML = avatarUploader.value.replace(/C:\\fakepath\\/i, "")
        }
    })
    const uploadBtn = document.getElementById("upload-avatar-btn")
    if (uploadBtn) {
        uploadBtn.addEventListener("click", event => {
            event.preventDefault()
            avatarUploader.click()
        })
    }
}

const deleteAvatar = (app: any): void => {
    activateWait()

    post("/api/user/avatar/delete/")
        .then(() => deactivateWait())
        .then(() => app.getConfiguration())
        .then(() => app.selectPage())
        .catch(() => {
            deactivateWait()
            addAlert("error", gettext("Could not delete avatar"))
        })
}

export const deleteAvatarDialog = (app: any): void => {
    const buttons = [
        {
            text: gettext("Delete"),
            classes: "fw-dark",
            click: () => {
                deleteAvatar(app)
                dialog.close()
            }
        },
        {type: "cancel"}
    ]
    const dialog = new Dialog({
        title: gettext("Confirm deletion"),
        id: "confirmdeletion",
        icon: "exclamation-triangle",
        body: confirmDeleteAvatarTemplate(),
        buttons
    } as any)
    dialog.open()
}

export const changePwdDialog = ({username}: {username: string}): void => {
    const buttons = [
        {
            text: gettext("Submit"),
            classes: "fw-dark",
            click: () => {
                const oldPwd = (document.getElementById("old-password-input") as HTMLInputElement).value
                const newPwd1 = (document.getElementById("new-password-input1") as HTMLInputElement).value
                const newPwd2 = (document.getElementById("new-password-input2") as HTMLInputElement).value

                const errorEl = document.getElementById("fw-password-change-error")
                if (errorEl) errorEl.innerHTML = ""

                if ("" === oldPwd || "" === newPwd1 || "" === newPwd2) {
                    if (errorEl) errorEl.innerHTML = gettext("All fields are required!")
                    return
                }

                if (newPwd1 !== newPwd2) {
                    if (errorEl) errorEl.innerHTML = gettext("Please confirm the new password!")
                    return
                }

                activateWait()

                postJson("/api/user/passwordchange/", {
                    old_password: oldPwd,
                    new_password1: newPwd1,
                    new_password2: newPwd2
                })
                    .then(({json, status}: any) => {
                        if (200 === status) {
                            dialog.close()
                            addAlert("info", gettext("The password has been changed."))
                        } else {
                            let eMsg: string
                            if (json.msg.hasOwnProperty("old_password")) {
                                eMsg = json.msg["old_password"][0]
                            } else if (json.msg.hasOwnProperty("new_password1")) {
                                eMsg = json.msg["new_password1"][0]
                            } else if (json.msg.hasOwnProperty("new_password2")) {
                                eMsg = json.msg["new_password2"][0]
                            } else {
                                eMsg = gettext("The password could not be changed!")
                            }
                            if (errorEl) errorEl.innerHTML = eMsg
                        }
                    })
                    .catch(() =>
                        addAlert("error", gettext("The password could not be changed"))
                    )
                    .then(() => deactivateWait())
            }
        },
        {type: "cancel"}
    ]
    const dialog = new Dialog({
        id: "fw-change-pwd-dialog",
        title: gettext("Change Password"),
        body: changePwdDialogTemplate({username}),
        buttons
    } as any)

    dialog.open()
}

export const addEmailDialog = (app: any): void => {
    const buttons = [
        {
            text: gettext("Submit"),
            classes: "fw-dark",
            click: () => {
                const email = (document.getElementById("new-profile-email") as HTMLInputElement)
                    .value.replace(/(^\s+)|(\s+$)/g, "")

                const errorEl = document.getElementById("fw-add-email-error")
                if (errorEl) errorEl.innerHTML = ""

                if ("" === email) {
                    if (errorEl) errorEl.innerHTML = gettext("New email address is required!")
                    return
                }

                ;(document.getElementById("new-profile-email") as HTMLInputElement).value = email

                postJson("/api/user/email/add/", {email})
                    .then(({json, status}: any) => {
                        deactivateWait()
                        if (200 === status) {
                            dialog.close()
                            return app
                                .getConfiguration()
                                .then(() => app.selectPage())
                                .then(() =>
                                    addAlert(
                                        "info",
                                        `${gettext("Confirmation e-mail sent to")}: ${email}`
                                    )
                                )
                        } else {
                            if (errorEl) errorEl.innerHTML = json.msg["email"][0]
                        }
                    })
                    .catch(() => {
                        deactivateWait()
                        addAlert("error", gettext("The email could not be added!"))
                    })
            }
        },
        {type: "cancel"}
    ]

    const dialog = new Dialog({
        id: "fw-add-email-dialog",
        title: gettext("Add Email"),
        body: changeEmailDialogTemplate(),
        buttons,
        width: 400
    } as any)
    dialog.open()
}

export const deleteEmailDialog = (target: HTMLElement, app: any): void => {
    const email = target.dataset.email

    const buttons = [
        {
            text: gettext("Remove"),
            classes: "fw-dark",
            click: () => {
                activateWait()

                post("/api/user/email/delete/", {email})
                    .then(() => {
                        dialog.close()
                        deactivateWait()
                    })
                    .then(() => app.getConfiguration())
                    .then(() => app.selectPage())
                    .then(() =>
                        addAlert("info", gettext("Email successfully deleted!"))
                    )
                    .catch(() => {
                        deactivateWait()
                        addAlert("error", gettext("The email could not be deleted!"))
                    })
            }
        },
        {type: "cancel"}
    ]

    const dialog = new Dialog({
        id: "fw-confirm-email-dialog",
        title: gettext("Confirm remove"),
        body: deleteEmailDialogTemplate({
            text: `${gettext("Remove the email address")}: ${escapeText(email!)}?`
        }),
        buttons,
        icon: "exclamation-triangle"
    } as any)
    dialog.open()
}

export const deleteSocialaccountDialog = (target: HTMLElement, app: any): void => {
    const socialaccount = Number.parseInt(target.dataset.socialaccount!)
    const provider = target.dataset.provider

    const buttons = [
        {
            text: gettext("Remove"),
            classes: "fw-dark",
            click: () => {
                activateWait()

                post("/api/user/socialaccountdelete/", {socialaccount})
                    .then(() => {
                        dialog.close()
                        deactivateWait()
                    })
                    .then(() => app.getConfiguration())
                    .then(() => app.selectPage())
                    .then(() =>
                        addAlert(
                            "info",
                            `${escapeText(provider!)} ${gettext("account successfully deleted!")}`
                        )
                    )
                    .catch(() => {
                        deactivateWait()
                        addAlert("error", gettext("The account could not be deleted!"))
                    })
            }
        },
        {type: "cancel"}
    ]

    const dialog = new Dialog({
        id: "fw-confirm-email-dialog",
        title: gettext("Confirm remove"),
        body: deleteEmailDialogTemplate({
            text: `${gettext("Remove the link to the account at")} ${escapeText(provider!)}?`
        }),
        buttons,
        icon: "exclamation-triangle"
    } as any)
    dialog.open()
}

export const changePrimaryEmailDialog = (app: any): void => {
    const primEmailRadio = document.querySelector(
        ".primary-email-radio:checked"
    ) as HTMLInputElement
    const email = primEmailRadio.value
    const buttons = [
        {
            text: gettext("Submit"),
            classes: "fw-dark",
            click: () => {
                activateWait()

                post("/api/user/email/primary/", {email})
                    .then(() => {
                        dialog.close()
                        deactivateWait()
                        return app.getConfiguration()
                    })
                    .then(() => app.selectPage())
                    .then(() =>
                        addAlert("info", gettext("The primary email has been updated."))
                    )
                    .catch((_error: Error) => {
                        deactivateWait()
                        addAlert(
                            "error",
                            gettext("The email could not be set to be primary email.")
                        )
                    })
            }
        },
        {type: "cancel"}
    ]

    const dialog = new Dialog({
        id: "change-primary-email",
        title: gettext("Confirm set primary"),
        body: changePrimaryEmailDialogTemplate({
            text: `${gettext("Set this email as the address primary")}: ${email}?`
        }),
        buttons
    } as any)
    dialog.open()
}
