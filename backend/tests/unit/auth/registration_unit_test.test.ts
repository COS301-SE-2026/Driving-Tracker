import { describe, expect, it, jest,beforeEach } from '@jest/globals';
import auth_controller from '../../../src/controllers/auth.controller';
const { register, dashboard_register } = auth_controller;
import { auth_services } from '../../../src/services/auth_services';
import { ConflictError, ExtendedError, ValidationError } from '../../../src/utils/errors';



jest.mock('../../../src/services/auth_services');
jest.mock('../../../src/middleware/auth', () => ({
generate_token: jest.fn(() => 'mocked-access-token'),
}));
jest.mock('../../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    users: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const valid_body = {
    email: "admin@example.com",
    password: "Password123!",
    name: "Test",
    surname: "Admin",
    phone_number: "0821234567",
    dob: "1990-01-01",
    consent_status: true,
    organization_name: "Acme Fleet",
}

const make_res = () =>{
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json});
        return{ res: { status } as any, status, json };
    };

function make_req(overrides: Record<string, unknown> = {}): any {
    return { body: { ...valid_body, ...overrides }};
}

async function call_controller(overrides: Record<string, unknown> = {}){
    const { res, status, json } = make_res();
    await dashboard_register(make_req(overrides), res);
    return { status, json };
}

describe('Auth register endpoint',()=>{
    beforeEach(async()=> jest.clearAllMocks());
   
    it('returns 201 and tokens on successful registration', async () => {
        jest.spyOn(auth_services, 'register').mockResolvedValueOnce({
            user: {  user_id: 'user-1', username: 'tester', name: 'Test', surname: 'User', email: 'test@example.com', password_hash: 'hash', role: 'USER', refresh_token: null, refresh_token_exp: null, consent_status: true, created_at: null, status: 'ACTIVE', deleted_at: null }
        });

        const req: any = {
            body: {
                email: 'test@example.com',
                username: 'tester',
                password: 'Password123!',
                name: 'Test',
                surname: 'User',
                consent_status: true,
            },
        };

        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res: any = { status };

        await register(req, res);

        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith({
            message: "Registration successful. Please verify your email before logging in."
        });
    });
    it('Returns 409 when service throws conflict error', async() =>{
        const mockedAuth = auth_services as unknown as jest.Mocked<typeof auth_services>;
        mockedAuth.register.mockRejectedValueOnce(new ConflictError('Email already exits','email'));
        const req: any = {
            body: {
                email: 'test@example.com',
                username: 'tester',
                password: 'Password123!',
                name: 'Test',
                surname: 'User',
                consent_status: true,
            },
        };
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res: any = {status};
        await register(req,res);

        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'EMAIL_TAKEN' }));
    });
    
    it('Returns 422 when services throws validation error', async()=>{
        const mockedAuth = auth_services as unknown as jest.Mocked<typeof auth_services>;

        //CASE where the name was left empty 
        mockedAuth.register.mockRejectedValueOnce(new ValidationError('Invalid input','name'));
        const req1: any ={
            body:{
                email: 'test@example.com',
                username: 'tester',
                password: 'Password123!',
                name: '',
                surname: 'User',
                consent_status: true,
            },
        };
        const json1 = jest.fn();
        const status1 = jest.fn().mockReturnValue({ json: json1 });
        const res1: any = { status: status1 };
        
        await register(req1,res1);

        expect(status1).toHaveBeenCalledWith(422);
        expect(json1).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_NAME' }));

        //CASE where the surname was left empty 
        mockedAuth.register.mockRejectedValueOnce(new ValidationError('Invalid input','surname'));
        const req_surname : any={
            body:{
                email: 'test@example.com',
                username: 'tester',
                password: 'Password123!',
                name: 'Test',
                surname: '',
                consent_status: true,
            },
        };

        const json_surname = jest.fn();
        const status_surname = jest.fn().mockReturnValue({ json: json_surname });
        const res_surname: any = { status: status_surname };

        await register(req_surname,res_surname);

        expect(status_surname).toHaveBeenCalledWith(422);
        expect(json_surname).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_SURNAME' }));
    });
});

describe("Auth dashboard register endpoint", () => {
    const service = jest.spyOn(auth_services, "dashboard_register");
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns 201 and a verification message on success", async () => {
        service.mockResolvedValueOnce({ user: { user_id: "user-1" }});

        const { status, json } = await call_controller();

        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith({
            message: "Registration successful. Please verify your email before logging in.",
        });
    });

    it("passes the user fields and organization name to the service seperately", async () => {
        service.mockResolvedValueOnce({ user: { user_id: "user-1" }});

        await call_controller();

        const { organization_name, consent_status, ...user_fields } = valid_body;

        expect(service).toHaveBeenCalledWith(user_fields, organization_name);
    });

    it.each([
        ["name", "INVALID_NAME"],
        ["surname", "INVALID_SURNAME"],
        ["organization_name", "INVALID_ORGANIZATION_NAME"],
    ])("returns 422 when the service throws a validation error on %s", async (field, code)=> {
        service.mockRejectedValueOnce(new ValidationError("Invalid input", field));

        const { status, json } = await call_controller();

        expect(status).toHaveBeenCalledWith(422);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: code }));
    });

    it("returns 409 when the service throws a conflict error", async () => {
        service.mockRejectedValueOnce(new ConflictError("Email already exists", "email"));

        const { status, json } = await call_controller();

        expect(status).toHaveBeenCalledWith(409);

        expect(json).toHaveBeenCalledWith(expect.objectContaining({ 
            error: "EMAIL_TAKEN"
        }));
    });

    it.each([
        ["an ExtendedError", new ExtendedError("Failed to create organization", "INTERNAL_SERVER_ERROR")],
        ["an unexpected Error", new Error("connection lost")],
    ])("returns 500 when the service throws %s", async (_label, error)=>{
        service.mockRejectedValueOnce(error);

        const { status, json } = await call_controller();

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "INTERNAL_SERVER_ERROR",
            message: "Failed to create account or organization, please try again",
        });
    });
});


