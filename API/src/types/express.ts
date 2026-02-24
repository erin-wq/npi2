import session from "express-session";

declare module 'express-session' {
    interface Session {
        portalId?: number,
        subscriptionActive?: boolean
    }
}