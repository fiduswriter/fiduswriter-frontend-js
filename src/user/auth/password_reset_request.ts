import {escapeText} from "fwtoolkit"
import {PreloginPage, type PreloginApp} from "../../prelogin/index.js"

export class PasswordResetRequest extends PreloginPage {
    constructor({app, language}: {app: PreloginApp; language: string}) {
        super({app, language})
        this.title = gettext("Reset Password")
    }

    render(): void {
        this.contents = `<div class="fw-login-left">
            <h1 class="fw-login-title">${gettext("Password reset")}</h1>
            <p>${gettext("Forgotten your password? Enter your e-mail address in the form, and we'll send you an e-mail allowing you to reset it.")}</p>
            <p>${interpolate(
                gettext(
                    'If you have any trouble resetting your password, please <a href="mailto:%(contactEmail)s">contact us</a>.'
                ),
                {contactEmail: (this.app.settings?.CONTACT_EMAIL as string) || ""},
                true
            )}</p>
        </div>
        <div class="fw-login-right">
            <form>
                <ul id="non-field-errors" class="fw-errorlist"></ul>
                <div class="input-wrapper">
                    <label for="id-email">${gettext("E-mail address")}</label>
                    <input type="email" name="email" size="30" placeholder="${gettext("E-mail address")}" required="" id="id-email" autocomplete="email">
                    <ul id="id-email-errors" class="fw-errorlist"></ul>
                </div>
                <div class="submit-wrapper">
                    <button class="fw-button fw-dark fw-uppercase" id="email-submit" type="submit">${gettext("Reset My Password")}</button>
                </div>
            </form>
        </div>`
        super.render()
    }

    bind(): void {
        super.bind()

        const emailInput = document.getElementById("id-email")
        if (emailInput) {
            emailInput.focus()
        }

        const submitBtn = document.getElementById("email-submit")
        if (submitBtn) {
            submitBtn.addEventListener("click", (event: Event) => {
                event.preventDefault()
                const nonFieldErrors = document.querySelector("#non-field-errors")!
                const emailErrors = document.querySelector("#id-email-errors")!
                nonFieldErrors.innerHTML = ""
                emailErrors.innerHTML = ""

                const emailEl = document.getElementById("id-email") as HTMLInputElement
                const email = emailEl.value
                let errors = false
                if (!emailEl.checkValidity()) {
                    emailErrors.innerHTML = `<li>${gettext("This is not a valid email.")}</li>`
                    errors = true
                } else if (!email.length) {
                    emailErrors.innerHTML = `<li>${gettext("This field is required.")}</li>`
                    errors = true
                }
                if (errors) {
                    return
                }

                this.app.apiConnectors.auth.passwordReset({email})
                    .then(() => {
                        if (document.body !== this.dom) {
                            return
                        }
                        const contentsEl = document.querySelector(".fw-contents")
                        if (contentsEl) {
                            contentsEl.innerHTML = `<div class="fw-login-left">
                        <h1 class="fw-login-title">${gettext("Instructions emailed")}</h1>
                        <p>
                            ${interpolate(
                                gettext(
                                    'We have sent an e-mail to <a href="mailto:%(email)s">%(email)s</a> with instructions on how to reset your password.'
                                ),
                                {email},
                                true
                            )}
                            <br />
                            ${gettext("Please contact us if you do not receive it within a few minutes.")}
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
                            json.form.fields.email.errors.forEach(
                                (error: string) =>
                                    (emailErrors.innerHTML += `<li>${escapeText(error)}</li>`)
                            )
                        })
                    )
            })
        }
    }
}
