import type {NavItem} from "../types.js"

export const headerNavTemplate = ({
    navItems,
    getAccessKeyHTML
}: {
    navItems: NavItem[]
    getAccessKeyHTML: (text: string, keys?: string) => string
}): string =>
    `<div class="fw-container fw-nav-container">
    ${navItems
        .map(
            (navItem, index) =>
                `<p class="fw-nav-item ${navItem.active ? "active-menu-wrapper" : ""}" role="presentation">
                <a class="fw-header-navigation-text" href="${navItem.url}" title="${navItem.title}" role="menuitem" data-index=${index}>
                    ${getAccessKeyHTML(navItem.text, navItem.keys)}
                </a>
            </p>`
        )
        .join("")}
    </div>`
