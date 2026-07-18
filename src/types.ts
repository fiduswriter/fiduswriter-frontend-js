export interface Email {
    address: string
    primary?: boolean
}

export interface User {
    username: string
    emails: Email[]
    name?: string
    avatar?: string
}

export interface Route {
    app: string
    [key: string]: unknown
}

export type RouteMap = Record<string, Route>

export interface Settings {
    APPS: string[]
    [key: string]: unknown
}

export interface SiteMenuLike {
    app: App
    navItems: NavItem[]
}

export interface NavItem {
    text: string
    url: string
    title: string
    id: string
    order: number
    keys?: string
    active?: boolean
}

export interface MenuPluginExport {
    new (siteMenu: SiteMenuLike): {init(): void}
}

export type MenuPlugin = Record<string, MenuPluginExport>

export type MenuPlugins = Array<[string, MenuPlugin]>

export interface App {
    routes: RouteMap
    goTo: (url: string) => void
    settings: Settings
    menuPlugins?: MenuPlugins
    name?: string
}

export interface BaseBodyTemplateOptions {
    user: User
    contents: string
    hasOverview?: boolean
    app: App
}


