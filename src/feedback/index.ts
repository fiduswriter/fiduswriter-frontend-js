import {ensureCSS, post} from "fwtoolkit"

// Creates the feedback tab. The tab is meant for user feedback to the developers while FW is still in
// a somewhat early stage. It is included in a way so it's easy to remove from all the templates.
// This is also where browser sniffing happens to prevent still unsupported browsers from logging in.

export class FeedbackTab {
    previousActiveElement: HTMLElement | null

    constructor() {
        this.previousActiveElement = null
    }

    init(): void {
        this.render()
        this.bind()
    }

    render(): void {
        document.body.insertAdjacentHTML(
            "beforeend",
            `<div class="feedback-panel" tole="dialog" aria-modal="true" aria-labelledby="feedback-title">
              <div id="feedback-wrapper">
                <div id="feedback-title">${gettext("Tech support")}</div>
                <p>${gettext("Did you encounter an error or bug?")}<br>
                    ${gettext("Give a brief description of what has happened.")}</p>
                <div id="feedback-form">
                  <form>
                    <textarea id="fw-message" name="message" rows="10" cols="30"></textarea>
                    <input type="button" value='${gettext("submit")}' id="feedbackbutton" class="fw-button fw-orange" />
                  </form>
                </div>
                <div id="response-message">
                  ${gettext("Thank you for your report!")}
                </div>
                <button id="close-feedback" aria-label="${gettext("Close technical support")}"><i class="fa fa-times-circle"></i></button>
              </div>
            </div>`
        )

        let headerNavWrapper = document.querySelector(
            "#footer-menu.prelogin .fw-container"
        )

        if (null === headerNavWrapper) {
            headerNavWrapper = document.querySelector(
                ".fw-header .fw-container"
            )
        }

        if (null === headerNavWrapper) {
            headerNavWrapper = document.querySelector("#headerbar")
        }

        if (null === headerNavWrapper) {
            headerNavWrapper = document.body
        }

        headerNavWrapper.insertAdjacentHTML(
            "beforeend",
            `<a class="feedback-tab" aria-label="${gettext("Technical support")}" href="#"></a>`
        )
        ensureCSS(staticUrl("css/feedback/feedback.css"))
    }

    bind(): void {
        ;(document.querySelector("a.feedback-tab") as HTMLElement).addEventListener(
            "click",
            event => {
                event.preventDefault()
                this.openFeedbackPanel()
            }
        )

        ;(
            document.querySelector("#close-feedback") as HTMLElement
        ).addEventListener("click", event => {
            event.preventDefault()
            this.closeFeedbackPanel()
        })

        ;(
            document.querySelector("#feedbackbutton") as HTMLElement
        ).addEventListener("click", () => this.sendFeedback())
    }

    openFeedbackPanel(): void {
        this.previousActiveElement = document.activeElement as HTMLElement | null
        const panelEl = document.querySelector(".feedback-panel") as HTMLElement
        panelEl.style.display = "block"
        ;(
            document.querySelector("textarea#fw-message") as HTMLTextAreaElement
        ).focus()
        panelEl.addEventListener("keydown", this.handleKeyDown)
    }

    sendFeedback(): void {
        const messageEl = document.querySelector(
                "textarea#fw-message"
            ) as HTMLTextAreaElement,
            closeFeedbackEl = document.querySelector(
                "#close-feedback"
            ) as HTMLElement,
            feedbackFormEl = document.querySelector(
                "#feedback-form"
            ) as HTMLElement,
            responseEl = document.querySelector(
                "#response-message"
            ) as HTMLElement
        if (!messageEl.value.length) {
            return
        }

        closeFeedbackEl.style.display = "none"
        feedbackFormEl.style.visibility = "hidden"

        post("/api/feedback/feedback/", {message: messageEl.value})
            .then(() => {
                messageEl.value = ""
                closeFeedbackEl.style.display = "block"
                responseEl.style.display = "block"
            })
            .catch(_error => {
                messageEl.value = ""
                closeFeedbackEl.style.display = "block"
            })
    }

    handleKeyDown(event: KeyboardEvent): void {
        // Trap Tab key within the feedback panel.
        const FOCUSABLE_SELECTORS = "button, textarea"
        if (event.key !== "Tab") {
            return
        }
        const focusableEls = Array.from(
            (document.querySelector(".feedback-panel") as HTMLElement).querySelectorAll(
                FOCUSABLE_SELECTORS
            )
        )
            // Filter only visible elements
            .filter(el => (el as HTMLElement).offsetParent !== null)

        if (focusableEls.length === 0) {
            return
        }
        const firstEl = focusableEls[0] as HTMLElement
        const lastEl = focusableEls[focusableEls.length - 1] as HTMLElement

        if (event.shiftKey) {
            // If Shift+Tab and the first element is active, move focus to the last element.
            if (document.activeElement === firstEl) {
                event.preventDefault()
                lastEl.focus()
            }
        } else {
            // Tab: if focus is on the last element, cycle back to first.
            if (document.activeElement === lastEl) {
                event.preventDefault()
                firstEl.focus()
            }
        }
    }

    closeFeedbackPanel(): void {
        const panelEl = document.querySelector(".feedback-panel") as HTMLElement
        panelEl.style.display = "none"
        ;(
            document.querySelector("#feedback-form") as HTMLElement
        ).style.visibility = "visible"
        ;(
            document.querySelector("#response-message") as HTMLElement
        ).style.display = "none"

        // Remove the keydown event listener that was added for focus trapping.
        panelEl.removeEventListener("keydown", this.handleKeyDown)

        // Restore focus to the previously active element, if any.
        if (
            this.previousActiveElement &&
            typeof this.previousActiveElement.focus === "function"
        ) {
            this.previousActiveElement.focus()
        }
    }
}
