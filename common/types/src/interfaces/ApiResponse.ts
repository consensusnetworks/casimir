import { ExistingUserCheck } from "./ExistingUserCheck"

export interface ApiResponse {
    error: boolean;
    message: string;
    data?: any | ExistingUserCheck; // TODO: Can expand this to include more types
}