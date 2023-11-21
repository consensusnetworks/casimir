import { LoginCredentials } from "./LoginCredentials"

export interface SignInWithEthereumCredentials extends LoginCredentials {
    message: string
    signedMessage: string
}