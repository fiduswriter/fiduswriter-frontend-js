import {PreloginPage} from "../prelogin/index.js"
import type {PreloginApp} from "../prelogin/index.js"

export class SetupPage extends PreloginPage {
    constructor({app, language}: {app: PreloginApp; language: string}) {
        super({app, language})
        this.title = gettext("Update")
        this.contents = `<div class="fw-login-left">
            <h1 class="fw-login-title">${gettext("Update")}</h1>
            <p>${interpolate(
                gettext(
                    "The %(appName)s server is currently being updated. Please wait."
                ),
                {appName: this.app.name},
                true
            )}</p>
        </div>`

        this.footerLinks = this.footerLinks.filter(link => link.external) // We only show external links as internal links will not work

        this.headerLinks = []
    }

    init(): Promise<void> {
        setTimeout(() => this.app.goTo(window.location.pathname), 5000)
        return super
            .init()
            .then(() =>
                document
                    .querySelectorAll("#lang-selection,.feedback-tab")
                    .forEach(el => ((el as HTMLElement).style.visibility = "hidden"))
            )
    }
}
