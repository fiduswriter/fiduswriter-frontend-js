import {PreloginPage} from "../prelogin/index.js"
import type {PreloginApp} from "../prelogin/index.js"

export class OfflinePage extends PreloginPage {
    constructor({app, language}: {app: PreloginApp; language: string}) {
        super({app, language})
        this.title = gettext("Disconnected")
        this.contents = `<div class="fw-login-left">
            <h1 class="fw-login-title">${gettext("Disconnected")}</h1>
            <p>${interpolate(
                gettext(
                    "You are currently disconnected from the %(appName)s server."
                ),
                {appName: this.app.name},
                true
            )}</p>
        </div>`

        this.footerLinks = this.footerLinks.filter(link => link.external) // We only show external links as internal links will not work

        this.headerLinks = [
            {
                type: "button",
                text: gettext("Reload page"),
                link: window.location.pathname
            }
        ]
    }

    init(): Promise<void> {
        return super
            .init()
            .then(() =>
                document
                    .querySelectorAll("#lang-selection,.feedback-tab")
                    .forEach(el => ((el as HTMLElement).style.visibility = "hidden"))
            )
    }
}
