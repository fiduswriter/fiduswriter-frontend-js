import {ensureCSS, postJson, whenReady} from "fwtoolkit"
import {PreloginPage} from "../prelogin/index.js"
import type {PreloginApp} from "../prelogin/index.js"

export class FlatPage extends PreloginPage {
    url: string

    constructor({app, language}: {app: PreloginApp; language: string}, url: string) {
        super({app, language})
        this.url = url
    }

    init(): Promise<void> {
        return Promise.all([
            whenReady(),
            this.getPageData(),
            ensureCSS([staticUrl("css/flatpage.css")])
        ]).then(() => {
            this.activateFidusPlugins()
            this.render()
            this.bind()
        })
    }

    getPageData(): Promise<void> {
        return postJson("/api/base/flatpage/", {url: this.url})
            .then(({json}) => {
                const data = json as {title: string; content: string}
                this.title = data.title
                this.contents = `<div class="fw-flatpage">
                    <h1 class="fw-login-title">${data.title}</h1>
                    ${data.content}
                </div>`
            })
            .catch(() => {
                this.title = gettext("Page not found")
                this.contents = `<div>
                    <h1 class="fw-login-title">${gettext("Error 404")}</h1>
                    <p>${gettext("The page you are looking for cannot be found.")}</p>
                </div>`
            })
    }
}
