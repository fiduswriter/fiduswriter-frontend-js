import {escapeText} from "fwtoolkit"
import {PreloginPage, type PreloginApp} from "../../prelogin/index.js"

export class Signup extends PreloginPage {
    constructor({app, language}: {app: PreloginApp; language: string}) {
        super({app, language})
        this.title = gettext("Signup")
        if (this.app.settings?.REGISTRATION_OPEN) {
            this.contents = `<div class="fw-login-left">
                <h1 class="fw-login-title">${gettext("Sign up")}</h1>
                <p>
                    ${gettext(
                        'Already have an account? Then please <a href="/" title="Login">login</a>.'
                    )}
                </p>
            </div>
            <div class="fw-login-right">
                <form>
                    <ul id="non-field-errors" class="fw-errorlist"></ul>
                    <div class="input-wrapper">
                        <label for="id-username">${gettext("Choose your username")}</label>
                        <input type="text" name="username" placeholder="${gettext("Username")}" autofocus="autofocus" minlength="1" maxlength="150" required="" id="id-username" autocomplete="username">
                        <ul id="id-username-errors" class="fw-errorlist"></ul>
                    </div>
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
                    <div class="input-wrapper">
                        <label for="id-email">${gettext("E-mail address")}</label>
                        <input type="email" name="email" placeholder="${gettext("E-mail address")}" required="" id="id-email" autocomplete="email">
                        <ul id="id-email-errors" class="fw-errorlist"></ul>
                    </div>
                    <div class="submit-wrapper">
                        <button class="fw-button fw-dark fw-uppercase" id="signup-submit" type="submit">${gettext("Sign up")}</button>
                    </div>
                </form>
            </div>`
        } else {
            this.contents = `<div class="fw-login-left">
                <h1 class="fw-login-title">${gettext("Sign Up Closed")}</h1>
                <p>${gettext("We are sorry, but the sign up is currently closed.")}</p>
            </div>`
        }
    }

    bind(): void {
        super.bind()

        const signupSubmit = document.querySelector("#signup-submit")

        if (!this.app.settings?.REGISTRATION_OPEN || !signupSubmit) {
            return
        }

        signupSubmit.addEventListener("click", (event: Event) => {
            event.preventDefault()

            const nonFieldErrors = document.querySelector("#non-field-errors")
            const idUsername = document.querySelector("#id-username") as HTMLInputElement
            const idUsernameErrors = document.querySelector("#id-username-errors")
            const idPassword1 = document.querySelector("#id-password1") as HTMLInputElement
            const idPassword1Errors = document.querySelector("#id-password1-errors")
            const idPassword2 = document.querySelector("#id-password2") as HTMLInputElement
            const idPassword2Errors = document.querySelector("#id-password2-errors")
            const idEmail = document.querySelector("#id-email") as HTMLInputElement
            const idEmailErrors = document.querySelector("#id-email-errors")
            const fwContents = document.querySelector(".fw-contents")

            if (
                !nonFieldErrors ||
                !idUsername ||
                !idUsernameErrors ||
                !idPassword1 ||
                !idPassword1Errors ||
                !idPassword2 ||
                !idPassword2Errors ||
                !idEmail ||
                !idEmailErrors ||
                !fwContents
            ) {
                return
            }

            nonFieldErrors.innerHTML = ""
            idUsernameErrors.innerHTML = ""
            idPassword1Errors.innerHTML = ""
            idPassword2Errors.innerHTML = ""
            idEmailErrors.innerHTML = ""

            const username = idUsername.value
            const password1 = idPassword1.value
            const password2 = idPassword2.value
            const email = idEmail.value
            let errors = false
            if (!username.length) {
                idUsernameErrors.innerHTML = `<li>${gettext("This field is required.")}</li>`
                errors = true
            }
            if (!password1.length) {
                idPassword1Errors.innerHTML = `<li>${gettext("This field is required.")}</li>`
                errors = true
            }
            if (!password2.length) {
                idPassword2Errors.innerHTML = `<li>${gettext("This field is required.")}</li>`
                errors = true
            }
            if (password1 !== password2) {
                idPassword2Errors.innerHTML = `<li>${gettext("You must type the same password each time.")}</li>`
                errors = true
            }
            if (!idEmail.checkValidity()) {
                idEmailErrors.innerHTML = `<li>${gettext("This is not a valid email.")}</li>`
                errors = true
            } else if (!email.length) {
                idEmailErrors.innerHTML = `<li>${gettext("This field is required.")}</li>`
                errors = true
            }
            if (errors) {
                return
            }
            const sendData: Record<string, unknown> = {username, password1, password2, email}
            if (this.app.inviteKey) {
                sendData["invite_key"] = this.app.inviteKey
            }
            this.app.apiConnectors.auth.signup(sendData)
                .then(({json}: any) => {
                    if (json.location === "/api/account/confirm-email/") {
                        fwContents.innerHTML = `<div class="fw-login-left">
                            <h1 class="fw-login-title">${gettext("Verify Your E-mail Address")}</h1>
                            <p>
                                ${interpolate(
                                    gettext(
                                        'We have sent an e-mail to <a href="mailto:%(email)s">%(email)s</a> for verification. Follow the link provided to finalize the signup process.'
                                    ),
                                    {email},
                                    true
                                )}
                                <br />
                                ${gettext(
                                    "Please contact us if you do not receive it within a few minutes."
                                )}
                            </p>
                        </div>`
                    } else {
                        window.history.pushState({}, "", "/")
                        this.app.init()
                    }
                })
                .catch((response: any) =>
                    response.json().then((json: any) => {
                        json.form.errors.forEach(
                            (error: string) =>
                                (nonFieldErrors.innerHTML += `<li>${escapeText(error)}</li>`)
                        )
                        json.form.fields.username.errors.forEach(
                            (error: string) =>
                                (idUsernameErrors.innerHTML += `<li>${escapeText(error)}</li>`)
                        )
                        json.form.fields.password1.errors.forEach(
                            (error: string) =>
                                (idPassword1Errors.innerHTML += `<li>${escapeText(error)}</li>`)
                        )
                        json.form.fields.password2.errors.forEach(
                            (error: string) =>
                                (idPassword2Errors.innerHTML += `<li>${escapeText(error)}</li>`)
                        )
                        json.form.fields.email.errors.forEach(
                            (error: string) =>
                                (idEmailErrors.innerHTML += `<li>${escapeText(error)}</li>`)
                        )
                    })
                )
        })
    }
}
