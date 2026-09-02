type Mockuser = {
    user_id: string;
    username: string;
    name: string;
    surname: string;
    email: string;
    password_hash: string;
    role: 'USER' | 'ADMIN';
    refresh_token: string | null;
    refresh_token_exp: Date | null;
    consent_status: boolean;
    created_at: Date | null;
    status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
    deleted_at: Date | null;
    dob: Date;
    phone_number: string;
    phone_verified: boolean;
    email_verified: boolean;
    verification_token: string | null;
    password_reset_token: string | null;
    reset_token_exp: Date | null;
    profile_picture_url: string | null;
}

export const createMockUser = (overrides: Partial<Mockuser> = {}): Mockuser => ({
    user_id: 'user-1', 
    username: 'tester', 
    name: 'Test', 
    surname: 'User', 
    email: 'test@example.com', 
    password_hash: 'hash', 
    role: 'USER', 
    refresh_token: null, 
    refresh_token_exp: null, 
    consent_status: true, 
    created_at: null, 
    status: 'ACTIVE', 
    deleted_at: null,
    dob: new Date('2000-01-15'), 
    phone_number: '+27781234567', 
    phone_verified: false,
    email_verified: false,
    verification_token: null,
    password_reset_token: null,
    reset_token_exp: null,
    profile_picture_url: null,
    ...overrides
});

export const createLoginResult = (overrides: Partial<any> = {}) => ({
    user: createMockUser(),
    refresh_token: 'refresh-1',
    ...overrides,
});