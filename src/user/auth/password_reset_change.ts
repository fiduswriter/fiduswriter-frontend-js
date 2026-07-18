import {escapeText, get, post} from "fwtoolkit"
import {PreloginPage} from "../../prelogin/index.js"

export class PasswordResetChangePassword extends PreloginPage {
    key: string | false

    constructor({app, language}: {app: any; language: string}, key: string | false = false) {
        super({app, language})
        this.title = gettext("Change Password")
        this.key = key
    }

    render(): void {
        this.contents = `<div class="fw-login-left">
            <h1 class="fw-login-title">${gettext("Change password")}</h1>
            <p>${gettext("You have indicated that you have forgotten your password. Please enter your new password in the form twice.")}</p>
        </div>
        <div class="fw-login-right">
            <form>
                <ul id="non-field-errors" class="fw-errorlist"></ul>
                <div class="input-wrapper">
                    <label for="id-password1">${gettext("Create a password")}</label>
                    <input type="password" name="password1" placeholder="${gettext("Password")}" required="" id="id-password1" autocomplete="new-password">
                    <ul id="id-password1-errors" class="fw-errorlist"></ul>
                </div>
                <div class="input-wrapper">
                    <label for="id-password2">${gettext("Confirm your password")}</label>
                    <input type="password" name="password2" placeholder="${gettext("Password (again)")}" required="" id="id-password2" autocomplete="new-password">
                    <ul id="id-password2-errors" class="fw-errorlist"></ul>
                </div>
                <div class="submit-wrapper">
                    <button class="fw-button fw-dark fw-uppercase" id="change-password-submit" type="submit">${gettext("Change My Password")}</button>
                </div>
            </form>
        </div>`
        super.render()
    }

    bind(): void {
        super.bind()

        window.history.replaceState({}, "", "/account/change-password/")

        const passwordInput = document.getElementById("id-password1")
        if (passwordInput) {
            passwordInput.focus()
        }

        const submitBtn = document.getElementById("change-password-submit")
        if (submitBtn) {
            submitBtn.addEventListener("click", (event: Event) => {
                event.preventDefault()
                const nonFieldErrors = document.querySelector("#non-field-errors")!
                const pwd1Errors = document.querySelector("#id-password1-errors")!
                const pwd2Errors = document.querySelector("#id-password2-errors")!
                nonFieldErrors.innerHTML = ""
                pwd1Errors.innerHTML = ""
                pwd2Errors.innerHTML = ""

                const password1 = (document.getElementById("id-password1") as HTMLInputElement).value
                const password2 = (document.getElementById("id-password2") as HTMLInputElement).value
                let errors = false
                if (!password1.length) {
                    pwd1Errors.innerHTML = `<li>${gettext("This field is required.")}</li>`
                    errors = true
                }
                if (!password2.length) {
                    pwd2Errors.innerHTML = `<li>${gettext("This field is required.")}</li>`
                    errors = true
                }
                if (password1 !== password2) {
                    pwd2Errors.innerHTML = `<li>${gettext("You must type the same password each time.")}</li>`
                    errors = true
                }

                if (errors) {
                    return
                }
                get(`/api/account/password/reset/key/${this.key}/`)
                    .then((response: any) => {
                        return post(response.url, {password1, password2})
                    })
                    .then(() => {
                        if (document.body !== this.dom) {
                            return
                        }
                        const contentsEl = document.querySelector(".fw-contents")
                        if (contentsEl) {
                            contentsEl.innerHTML = `<div class="fw-login-left">
                        <h1 class="fw-login-title">${gettext("Password reset")}</h1>
                        <p>
                            ${gettext("Your password has been reset and you can now log in with the new password.")}
                        </p>
                    </div>`
                        }
                    })
                    .catch((response: any) =>
                        response.json().then((json: any) => {
                            json.form.errors.forEach(
                                (error: string) =>
                                    (nonFieldErrors.innerHTML += `<li>${escapeText(error)}</li>`)
                            )
                            if (json.form.fields.password1) {
                                json.form.fields.password1.errors.forEach(
                                    (error: string) =>
                                        (pwd1Errors.innerHTML += `<li>${escapeText(error)}</li>`)
                                )
                            }
                            if (json.form.fields.password2) {
                                json.form.fields.password2.errors.forEach(
                                    (error: string) =>
                                        (pwd2Errors.innerHTML += `<li>${escapeText(error)}</li>`)
                                )
                            }
                        })
                    )
            })
        }
    }
}
