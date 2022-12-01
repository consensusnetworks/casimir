import { ProviderString } from '@/types/ProviderString'

export interface User {
    id: string;
    accounts: Record<ProviderString, string[]>;
}