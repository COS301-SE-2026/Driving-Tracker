import { describe, it, expect, jest , beforeEach } from '@jest/globals';
import type { SendMailOptions, SentMessageInfo } from 'nodemailer';

const mockSendMail = jest.fn<
    (options: SendMailOptions ) => Promise<SentMessageInfo>>() ;

jest.doMock('nodemailer', () => ({
    __esModule: true,
    default: {
        createTransport: jest.fn(() => ({
            sendMail: mockSendMail,
        })),
    },
}));

import { sendAuthEmail } from '../../../src/utils/email';

describe('sendAuthEmail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('sends email and logs success', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        mockSendMail.mockResolvedValueOnce({ messageId: 'm-123'});

        await sendAuthEmail('user@example.com', 'Subject', '<p>Hello</p>');
        expect(mockSendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                from: expect.stringContaining('Driving Tracker <'),
                to: 'user@example.com',
                subject: 'Subject',
                html: '<p>Hello</p>',
            })
        );
        expect(logSpy).toHaveBeenCalledWith('Email sent successfully:', 'm-123');

        logSpy.mockRestore();
    });

    it('logs failure when sendMail throws', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const err = new Error('smtp down');
        mockSendMail.mockRejectedValueOnce(err);

        await sendAuthEmail('user@example.com', 'Subject', '<p>Hello</p>');

        expect(logSpy).toHaveBeenCalledWith('Failed to send email', err);

        logSpy.mockRestore();
    });
});

