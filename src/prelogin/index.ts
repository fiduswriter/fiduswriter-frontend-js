import {ensureCSS, setDocTitle, setLanguage, whenReady} from "fwtoolkit"
import {FeedbackTab} from "../feedback/index.js"
import type {RouteMap, Settings} from "../types.js"

import {basePreloginTemplate} from "./templates.js"

interface FooterLink {
    text: string
    link: string
    external?: boolean
}

interface HeaderLink {
    type?: string
    text: string
    link: string
}

export interface PreloginApp {
    routes: RouteMap
    settings: Settings
    goTo: (url: string) => void
    name: string
    config: Record<string, unknown>
}

interface PluginExport {
    new (options: {page: PreloginPage}): {init(): void}
}

interface PreloginPageOptions {
    app: PreloginApp
    language: string
    plugins?: Array<[string, Record<string, PluginExport>]>
}

export class PreloginPage {
    app: PreloginApp
    language: string
    pluginLoaders: Array<[string, Record<string, PluginExport>]>
    plugins: Record<string, {init(): void}> | null
    title: string
    contents: string
    footerLinks: FooterLink[]
    headerLinks: HeaderLink[]
    dom!: HTMLElement

    constructor({app, language, plugins = []}: PreloginPageOptions) {
        this.app = app
        this.language = language
        this.pluginLoaders = []
        this.plugins = null
        this.title = ""
        this.contents = ""
        this.footerLinks = (this.app.settings?.FOOTER_LINKS as FooterLink[] | undefined)?.length
            ? (this.app.settings.FOOTER_LINKS as FooterLink[])
            : [
                  {
                      text: gettext("Terms and Conditions"),
                      link: "/pages/terms/"
                  },
                  {
                      text: gettext("Privacy policy"),
                      link: "/pages/privacy/"
                  },
                  {
                      text: gettext("Equations and Math with MathLive"),
                      link: "https://github.com/arnog/mathlive#readme",
                      external: true
                  },
                  {
                      text: gettext("Citations with Citation Style Language"),
                      link: "https://citationstyles.org/",
                      external: true
                  },
                  {
                      text: gettext("Editing with ProseMirror"),
                      link: "https://prosemirror.net/",
                      external: true
                  }
              ]
        this.headerLinks = [
            {
                type: "button",
                text: gettext("Log in"),
                link:
                    this.app.routes[""].app === "document" ? "/" : "/documents/"
            }
        ]

        // Stash page-specific plugins for late activation
        this._pluginModules = plugins
    }

    private _pluginModules: Array<[string, Record<string, PluginExport>]>

    activateFidusPlugins(): void {
        if (this.plugins) {
            // Plugins have been activated already
            return
        }
        // Add plugins.
        this.plugins = {}

        // Plugins for the specific page
        this.pluginLoaders.forEach(([app, plugin]) => {
            if (!this.app.settings.APPS.includes(app)) {
                return
            }

            Object.values(plugin).forEach(pluginExport => {
                if (typeof pluginExport === "function") {
                    this.plugins![pluginExport.name] = new pluginExport({
                        page: this
                    })
                    this.plugins![pluginExport.name].init()
                }
            })
        })

        // General plugins for all prelogin pages
        this._pluginModules.forEach(([app, plugin]) => {
            if (!this.app.settings.APPS.includes(app)) {
                return
            }

            Object.values(plugin).forEach(pluginExport => {
                if (typeof pluginExport === "function") {
                    this.plugins![pluginExport.name] = new pluginExport({
                        page: this
                    })
                    this.plugins![pluginExport.name].init()
                }
            })
        })
    }

    init(): Promise<void> {
        return whenReady().then(() => {
            this.activateFidusPlugins()
            this.render()
            this.bind()
        })
    }

    bind(): void {
        this.dom
            .querySelector(".fw-login-logo")!
            .addEventListener("click", () => this.app.goTo("/"))
        this.dom
            .querySelector("#lang-selection")!
            .addEventListener("change", event => {
                this.language = (event.target as HTMLSelectElement).value
                return setLanguage(this.app.config, this.language)
            })
    }

    render(): void {
        this.dom = document.createElement("body")
        this.dom.classList.add("prelogin")
        this.dom.classList.add("fw-scrollable")
        this.dom.innerHTML = basePreloginTemplate({
            language: this.language,
            headerLinks: this.headerLinks,
            footerLinks: this.footerLinks,
            contents: this.contents,
            settings: this.app.settings
        })
        document.body = this.dom
        ensureCSS([staticUrl("css/prelogin.css")])
        setDocTitle(this.title, this.app)
        const feedbackTab = new FeedbackTab()
        feedbackTab.init()
    }
}
