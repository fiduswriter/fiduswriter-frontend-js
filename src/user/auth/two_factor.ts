import {
    Dialog,
    activateWait,
    addAlert,
    deactivateWait,
    postJson
} from "fwtoolkit"
import QRCode from "qrcode"

export const twoFactorSetupDialog = (): Promise<any> => {
    let secretKey: string | null = null
    let deviceId: string | null = null

    activateWait()
    return postJson("/api/user/two-factor/setup/").then(({json}: any): any => {
        deactivateWait()

        if (json.status !== "success") {
            addAlert("error", json.message)
            return Promise.reject(json.message)
        }

        secretKey = json.secret_key
        deviceId = json.device_id
        const provisioningUri = json.provisioning_uri

        const qrContainer = document.createElement("div")
        qrContainer.className = "two-factor-qr-container"

        QRCode.toCanvas(
            provisioningUri,
            {
                width: 200,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#ffffff"
                }
            },
            function (error: Error | null | undefined, canvas: HTMLCanvasElement) {
                if (error) {
                    console.error("QR Code generation error:", error)
                    qrContainer.innerHTML = `<p style="color: red;">${gettext("Could not generate QR code. Please use the secret key below.")}</p>`
                } else {
                    qrContainer.appendChild(canvas)
                }
            }
        )

        const buttons = [
            {
                text: gettext("Verify"),
                classes: "fw-dark",
                click: () => {
                    const codeInput = document.querySelector(
                        "#two-factor-code"
                    ) as HTMLInputElement
                    const code = codeInput.value.trim()

                    if (code.length !== 6) {
                        addAlert("error", gettext("Please enter a 6-digit code."))
                        return
                    }

                    postJson("/api/user/two-factor/verify/", {
                        code,
                        device_id: deviceId
                    })
                        .then(({json}: any) => {
                            if (json.status === "success") {
                                addAlert("success", json.message)
                                dialog.close()
                                window.location.reload()
                            } else {
                                addAlert("error", json.message)
                            }
                        })
                        .catch(() => {
                            addAlert("error", gettext("Could not verify the code."))
                        })
                }
            },
            {type: "cancel"}
        ]

        const dialog = new Dialog({
            id: "two-factor-setup-dialog",
            title: gettext("Set Up Two-Factor Authentication"),
            body: `
                    <p>${gettext("Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)")}</p>
                    <div class="two-factor-qr-wrapper"></div>
                    <p><strong>${gettext("Or enter this code manually:")}</strong></p>
                    <code class="two-factor-secret">${secretKey}</code>
                    <div class="two-factor-verify-section">
                        <p>${gettext("Enter the 6-digit code from your authenticator app to verify:")}</p>
                        <input type="text" id="two-factor-code" placeholder="123456" maxlength="6" class="fw-button fw-large" autocomplete="one-time-code" />
                    </div>
                `,
            buttons,
            icon: "shield-alt",
            width: 500
        } as any)

        dialog.open()

        const qrWrapper = dialog.dialogEl.querySelector(".two-factor-qr-wrapper")
        if (qrWrapper && qrContainer) {
            qrWrapper.appendChild(qrContainer)
        }

        const codeInput = dialog.dialogEl.querySelector("#two-factor-code")
        if (codeInput) {
            ;(codeInput as HTMLElement).addEventListener("keypress", (event: Event) => {
                if ((event as KeyboardEvent).key === "Enter") {
                    event.preventDefault()
                    ;(buttons[0] as any).click()
                }
            })
        }
    })
}

export const twoFactorDisableDialog = (): any => {
    const buttons = [
        {
            text: gettext("Disable 2FA"),
            classes: "fw-orange",
            click: () => {
                activateWait()
                postJson("/api/user/two-factor/disable/", {})
                    .then(({json}: any) => {
                        if (json.status === "success") {
                            addAlert("success", json.message)
                            dialog.close()
                            window.location.reload()
                        } else {
                            addAlert("error", json.message)
                        }
                    })
                    .catch(() => {
                        addAlert(
                            "error",
                            gettext("Could not disable two-factor authentication.")
                        )
                    })
                    .then(() => {
                        deactivateWait()
                    })
            }
        },
        {type: "cancel"}
    ]

    const dialog = new Dialog({
        id: "two-factor-disable-dialog",
        title: gettext("Disable Two-Factor Authentication"),
        body: `<p>${gettext("Are you sure you want to disable two-factor authentication? This will reduce the security of your account.")}</p>`,
        buttons,
        icon: "exclamation-triangle"
    } as any)

    dialog.open()
    return dialog
}

export const twoFactorLoginDialog = ({
    login,
    password,
    remember,
    loginPage
}: {
    login: string
    password: string
    remember: boolean
    loginPage: any
}): any => {
    const buttons = [
        {
            text: gettext("Verify"),
            classes: "fw-dark",
            click: () => {
                const twofactorInput = dialog.dialogEl.querySelector(
                    "#two-factor-code"
                ) as HTMLInputElement
                const twofactor = twofactorInput ? twofactorInput.value.trim() : ""

                if (twofactor.length !== 6) {
                    addAlert("error", gettext("Please enter a 6-digit code."))
                    return
                }

                activateWait()
                postJson("/api/user/login/", {
                    login,
                    password,
                    remember,
                    twofactor
                })
                    .then(({json}: any) => {
                        deactivateWait()
                        dialog.close()
                        loginPage.afterLogin(json)
                    })
                    .catch(() => {
                        addAlert("error", gettext("Could not verify the code."))
                        deactivateWait()
                    })
            }
        }
    ]

    const dialog = new Dialog({
        id: "two-factor-login-dialog",
        title: gettext("Two-Factor Authentication"),
        body: `<p>${gettext("Enter the 6-digit code from your authenticator app:")}</p>
            <input type="text" id="two-factor-code" placeholder="123456" maxlength="6" class="fw-button fw-large" autocomplete="one-time-code" autofocus />`,
        buttons,
        icon: "shield-alt",
        width: 500
    } as any)

    dialog.open()
    const codeInput = dialog.dialogEl.querySelector("#two-factor-code")
    if (codeInput) {
        ;(codeInput as HTMLElement).addEventListener("keypress", (event: Event) => {
            if ((event as KeyboardEvent).key === "Enter") {
                event.preventDefault()
                buttons[0].click()
            }
        })
    }
    return dialog
}

export const checkTwoFactorStatus = (): Promise<boolean> => {
    return postJson("/api/user/two-factor/status/")
        .then(({json}: any) => {
            if (json.status === "success") {
                return json.enabled
            }
            return false
        })
        .catch(() => false)
}
