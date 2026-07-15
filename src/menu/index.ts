import {keyName} from "w3c-keyname"

import {dropdownSelect, whenReady} from "fwtoolkit"
import {headerNavTemplate} from "./templates.js"
import type {App, MenuPlugins, NavItem, SiteMenuLike} from "../types.js"

// Bindings for the top menu on overview pages

export class SiteMenu implements SiteMenuLike {
    app: App
    activeItem: string | undefined
    navItems: NavItem[]
    listeners: {onKeydown?: (event: KeyboardEvent) => void}
    keyboardShortcuts: Map<string, NavItem>
    plugins?: Record<string, {init(): void}>

    constructor(app: App, activeItem?: string) {
        this.app = app
        this.activeItem = activeItem
        this.navItems = [
            {
                text: gettext("Documents"),
                url: "/",
                title: gettext("edit documents"),
                id: "documents",
                order: 0,
                keys: "Alt-d"
            },
            {
                text: gettext("Bibliography"),
                url: "/bibliography/",
                title: gettext("manage bibliography library"),
                id: "bibliography",
                order: 1,
                keys: "Alt-b"
            },
            {
                text: gettext("Images"),
                url: "/usermedia/",
                title: gettext("manage image files"),
                id: "images",
                order: 2,
                keys: "Alt-m"
            }
        ]
        this.listeners = {}
        this.keyboardShortcuts = new Map()
    }

    init(): void {
        this.activatePlugins()
        this.setupKeyboardShortcuts()
        const currentActive = this.navItems.find(
            item => item.id === this.activeItem
        )
        if (currentActive) {
            currentActive.active = true
        }

        whenReady().then(() => {
            this.sortMenu()
            this.renderMenu()
            this.bindPreferencePullDown()
            this.bindKeyboardNavigation()
        })
    }

    setupKeyboardShortcuts(): void {
        this.navItems.forEach(navItem => {
            if (navItem.keys) {
                this.keyboardShortcuts.set(navItem.keys.toLowerCase(), navItem)
            }
        })
    }

    bindKeyboardNavigation(): void {
        this.listeners.onKeydown = event => this.onKeydown(event)
        document.body.addEventListener("keydown", this.listeners.onKeydown)
    }

    onKeydown(event: KeyboardEvent): void {
        const name = keyName(event)

        if (event.altKey) {
            const shortcut = "alt-" + name.toLowerCase()
            const navItem = this.keyboardShortcuts.get(shortcut)
            if (navItem) {
                event.preventDefault()
                event.stopPropagation()
                this.app.goTo(navItem.url)
                return
            }
        }
        const headerNav = document.getElementById("header-nav") as HTMLElement
        const siteMenuItems: HTMLElement[] = Array.from(
            headerNav.querySelectorAll(".fw-nav-item a")
        )
        const currentFocus = document.activeElement as HTMLElement
        const overviewMenu = document.getElementById("fw-overview-menu")
        const isInSiteMenu = headerNav.contains(currentFocus)
        const isInOverviewDropdown = overviewMenu
            ?.querySelector(".fw-pulldown.fw-left")
            ?.contains(currentFocus)

        if (!isInSiteMenu && !overviewMenu?.contains(currentFocus)) {
            return
        }

        let currentIndex = -1
        if (isInSiteMenu) {
            currentIndex = parseInt(currentFocus.dataset.index ?? "-1")
        }
        switch (name) {
            case "ArrowLeft": {
                if (isInSiteMenu) {
                    event.preventDefault()
                    const prevIndex =
                        currentIndex > 0
                            ? currentIndex - 1
                            : siteMenuItems.length - 1
                    siteMenuItems[prevIndex].focus()
                }
                break
            }
            case "ArrowRight": {
                if (isInSiteMenu) {
                    event.preventDefault()
                    const nextIndex =
                        currentIndex < siteMenuItems.length - 1
                            ? currentIndex + 1
                            : 0
                    siteMenuItems[nextIndex].focus()
                }
                break
            }
            case "ArrowDown": {
                if (isInSiteMenu && overviewMenu) {
                    event.preventDefault()
                    // Focus first overview menu item
                    const firstOverviewItem = overviewMenu.querySelector(
                        "button, div.dropdown"
                    )

                    if (firstOverviewItem) {
                        ;(firstOverviewItem as HTMLElement).focus()
                    }
                }
                break
            }
            case "ArrowUp": {
                if (
                    overviewMenu?.contains(currentFocus) &&
                    !isInOverviewDropdown
                ) {
                    event.preventDefault()
                    // Focus the site menu item that's above the current overview menu item
                    const siteMenuItem = siteMenuItems[0]
                    if (siteMenuItem) {
                        siteMenuItem.focus()
                    }
                }
                break
            }
            case "Enter":
            case " ": {
                if (isInSiteMenu) {
                    event.preventDefault()
                    ;(currentFocus as HTMLElement).click()
                }
                break
            }
        }
    }

    sortMenu(): void {
        this.navItems.sort((a, b) => a.order - b.order)
    }

    renderMenu(): void {
        const headerNav = document.getElementById("header-nav") as HTMLElement
        headerNav.innerHTML = headerNavTemplate({
            navItems: this.navItems,
            getAccessKeyHTML: (text, keys) => this.getAccessKeyHTML(text, keys)
        })
    }

    bindPreferencePullDown(): void {
        const pulldown = document.getElementById(
            "user-preferences-pulldown"
        ) as HTMLSelectElement
        const button =
            document.getElementById("preferences-btn") || false
        dropdownSelect(pulldown, {
            button,
            onChange: value => {
                switch (value) {
                    case "profile":
                        this.app.goTo("/user/profile/")
                        break
                    case "contacts":
                        this.app.goTo("/user/contacts/")
                        break
                    case "logout":
                        // Clear all E2EE data from sessionStorage (document keys,
                        // passwords, decrypted titles, and passphrase keys).
                        for (let i = sessionStorage.length - 1; i >= 0; i--) {
                            const key = sessionStorage.key(i)
                            if (key && key.startsWith("e2ee_")) {
                                sessionStorage.removeItem(key)
                            }
                        }
                        import("fwtoolkit/network").then(({post}) =>
                            post("/api/user/logout/").then(() => {
                                window.location.href =
                                    this.app.routes[""].app === "document"
                                        ? "/"
                                        : "/documents/"
                            })
                        )
                        break
                }
            }
        })
    }

    activatePlugins(): void {
        // Add plugins, but only once.
        if (!this.plugins) {
            this.plugins = {}
        }
        const pluginInstances = this.plugins

        const plugins: MenuPlugins = this.app.menuPlugins || []

        plugins.forEach(([app, plugin]) => {
            if (!this.app.settings.APPS.includes(app)) {
                return
            }
            Object.values(plugin).forEach(pluginExport => {
                if (typeof pluginExport === "function") {
                    pluginInstances[pluginExport.name] = new pluginExport(this)
                    pluginInstances[pluginExport.name].init()
                }
            })
        })
    }

    destroy(): void {
        document.body.removeEventListener(
            "keydown",
            this.listeners.onKeydown as EventListener
        )
        this.listeners = {}
    }

    getAccessKeyHTML(text: string, accessKey?: string): string {
        if (!accessKey) {
            return text
        }
        const key = accessKey.split("-")[1] // Get the key part after "Alt-"
        const index = text.toLowerCase().indexOf(key.toLowerCase())
        if (index === -1) {
            return text
        }
        return `${text.substring(0, index)}<span class="fw-access-key">${text.charAt(index)}</span>${text.substring(index + 1)}`
    }
}
