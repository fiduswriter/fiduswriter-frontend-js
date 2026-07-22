import type {PreloginApp} from "../../prelogin/index.js"

export class ContactInvite {
    app: PreloginApp
    key: string

    constructor({app}: {app: PreloginApp}, key: string) {
        this.app = app
        this.key = key
    }

    init(): Promise<any> {
        if (!this.app.config.user.is_authenticated) {
            this.app.inviteKey = this.key
            const loginPage = this.app.openLoginPage()
            this.app.page = loginPage
            return loginPage.init()
        }

        return this.app.apiConnectors.contacts.invite({key: this.key}).then((json: any) => {
            window.history.replaceState({}, "", json.redirect)
            return this.app.selectPage()
        })
    }
}
