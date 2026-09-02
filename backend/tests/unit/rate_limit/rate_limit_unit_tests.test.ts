import {describe, it, expect, jest, beforeEach, beforeAll, afterAll} from '@jest/globals';


describe('rate limiting', () =>{
    let login_limiter_sliding: any;
    let user_based_limiter: any;
    let trip_reading_limiter: any;
    let trip_event_limiter: any;
    let map_token_limiter: any;
    let register_fcm_token_limiter: any;
    const originalEnv = process.env.NODE_ENV;

    beforeAll(async () =>{
        process.env.NODE_ENV = 'development';
        jest.resetModules();
        const module = await import('../../../src/middleware/rate_limit');
        login_limiter_sliding = module.login_limiter_sliding;
        user_based_limiter = module.create_user_based_limiter();
        trip_reading_limiter = module.create_trip_reading_limiter();
        trip_event_limiter = module.trip_event_limiter;
        map_token_limiter = module.create_map_token_limiter();
        register_fcm_token_limiter = module.register_fcm_token_limiter;

    });

    afterAll(() =>{
        process.env.NODE_ENV = originalEnv;
    });

    beforeEach(() =>{
            jest.clearAllMocks();
    });

    const make_res = () =>{
        const json = jest.fn();
        const send = jest.fn();
        const status = jest.fn().mockReturnValue({ json});
        const setHeader = jest.fn();
        const getHeader = jest.fn();
        const removeHeader = jest.fn();
        const set = jest.fn();
        return{status, json, send, setHeader, getHeader, removeHeader, set};
        
    };

    describe('login rate limiting', ()=> {

        it('allows requests under the limit', async () => {
        const req: any = { 
            body: {
                identifier: 'test@test.com',
                password: 'test'
            },
            ip: '1.1.1.1'
        };

        const res: any = make_res();

        const next = jest.fn();

        await login_limiter_sliding(req, res, next);
        expect(next).toHaveBeenCalled();

        });

        it('blocks after exceeding strict limit', async () => {
            const req: any = { 
                body: {
                    identifier: 'testStrict@test.com',
                    password: 'wrong'
                },
                ip: '1.1.2.2'
            };

            const res: any = make_res();

            const next = jest.fn();

            for(let i = 0; i<5; i++){
                await login_limiter_sliding(req, res, next);
            }

            await login_limiter_sliding(req, res, next);
            expect(res.status).toHaveBeenCalledWith(429);

        });

        it('blocks after exceeding IP limit accross different identifiers', async () => {

            const res: any = make_res();

            const next = jest.fn();

            for(let i = 0; i<20; i++){

                const req: any = { 
                    body: {
                        identifier: `test_${i}@test.com`,
                        password: 'wrong'
                    },
                    ip: '1.3.1.3'
                };

                await login_limiter_sliding(req, res, next);
            }

            const final_req: any = { 
                body: {
                    identifier: 'test_fin@test.com',
                    password: 'wrong'
                },
                ip: '1.3.1.3'
            };

            await login_limiter_sliding(final_req, res, next);
            expect(res.status).toHaveBeenCalledWith(429);

        });


    });

    describe('user based rate limiting', ()=> {

        it('allows requests under the limit', async () => {
            const req: any = { 
                user: {
                    sub: 'user-0'
                },
                ip: '1.1.1.1'
            };

            const res: any = make_res();

            const next = jest.fn();

            await user_based_limiter(req, res, next);
            expect(next).toHaveBeenCalled();

        });

        it('blocks after exceeding limit', async () => {
            const req: any = { 
                user: {
                    sub: 'user-00'
                },
                ip: '1.1.2.2'
            };

            const res: any = make_res();

            const next = jest.fn();

            for(let i = 0; i<100; i++){
                await user_based_limiter(req, res, next);
            }

            await user_based_limiter(req, res, next);
            expect(res.status).toHaveBeenCalledWith(429);

        });


    });

    describe('trip reading rate limiting', ()=> {

        it('allows requests under the limit', async () => {
            const req: any = { 
                user: {
                    sub: 'user-1'
                },
                ip: '1.1.1.1'
            };

            const res: any = make_res();

            const next = jest.fn();

            await trip_reading_limiter(req, res, next);
            expect(next).toHaveBeenCalled();

        });

        it('blocks after exceeding limit', async () => {
            const req: any = { 
                user: {
                    sub: 'user-11'
                },
                ip: '1.1.2.2'
            };

            const res: any = make_res();

            const next = jest.fn();

            for(let i = 0; i<30; i++){
                await trip_reading_limiter(req, res, next);
            }

            await trip_reading_limiter(req, res, next);
            expect(res.status).toHaveBeenCalledWith(429);

        });


    });

    describe('trip event rate limiting', ()=> {

        it('allows requests under the limit', async () => {
            const req: any = { 
                user: {
                    sub: 'user-2'
                },
                ip: '1.1.1.3'
            };

            const res: any = make_res();

            const next = jest.fn();

            await trip_event_limiter(req, res, next);
            expect(next).toHaveBeenCalled();

        });

        it('blocks after exceeding limit', async () => {
            const req: any = { 
                user: {
                    sub: 'user-22'
                },
                ip: '1.1.4.4'
            };

            const res: any = make_res();

            const next = jest.fn();

            for(let i = 0; i<15; i++){
                await trip_event_limiter(req, res, next);
            }

            await trip_event_limiter(req, res, next);
            expect(res.status).toHaveBeenCalledWith(429);

        });


    });

    describe('trip event rate limiting', ()=> {

        it('allows requests under the limit', async () => {
            const req: any = { 
                user: {
                    sub: 'user-3'
                },
                ip: '1.1.1.3'
            };

            const res: any = make_res();

            const next = jest.fn();

            await trip_event_limiter(req, res, next);
            expect(next).toHaveBeenCalled();

        });

        it('blocks after exceeding limit', async () => {
            const req: any = { 
                user: {
                    sub: 'user-33'
                },
                ip: '1.1.4.4'
            };

            const res: any = make_res();

            const next = jest.fn();

            for(let i = 0; i<15; i++){
                await trip_event_limiter(req, res, next);
            }

            await trip_event_limiter(req, res, next);
            expect(res.status).toHaveBeenCalledWith(429);

        });


    });

    describe('map token rate limiting', ()=> {

        it('allows requests under the limit', async () => {
            const req: any = { 
                user: {
                    sub: 'user-4'
                },
                ip: '1.1.1.4'
            };

            const res: any = make_res();

            const next = jest.fn();

            await map_token_limiter(req, res, next);
            expect(next).toHaveBeenCalled();

        });

        it('blocks after exceeding limit', async () => {
            const req: any = { 
                user: {
                    sub: 'user-44'
                },
                ip: '1.1.5.5'
            };

            const res: any = make_res();

            const next = jest.fn();

            for(let i = 0; i<30; i++){
                await map_token_limiter(req, res, next);
            }

            await map_token_limiter(req, res, next);
            expect(res.status).toHaveBeenCalledWith(429);

        });


    });

    describe('register fcm token rate limiting', ()=> {

        it('allows requests under the limit', async () => {
            const req: any = { 
                user: {
                    sub: 'user-5'
                },
                ip: '1.1.1.5'
            };

            const res: any = make_res();

            const next = jest.fn();

            await register_fcm_token_limiter(req, res, next);
            expect(next).toHaveBeenCalled();

        });

        it('blocks after exceeding limit', async () => {
            const req: any = { 
                user: {
                    sub: 'user-55'
                },
                ip: '1.1.6.6'
            };

            const res: any = make_res();

            const next = jest.fn();

            for(let i = 0; i<10; i++){
                await register_fcm_token_limiter(req, res, next);
            }

            await register_fcm_token_limiter(req, res, next);
            expect(res.status).toHaveBeenCalledWith(429);

        });


    });

    

});