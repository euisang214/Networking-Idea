const { describe, it, expect, vi } = require('./test-helpers');

const mockSessionSave = vi.fn(async function() { return this; });

class Session {
  constructor(data) {
    Object.assign(this, data);
    this._id = 'sess1';
    this.save = mockSessionSave;
  }
}
Session.countDocuments = vi.fn(() => Promise.resolve(0));
vi.mock('../backend/models/session', () => Session);

const professional = {
  _id: 'pro1',
  hourlyRate: 100,
  user: { _id: 'proUser1', firstName: 'Pro', lastName: 'Fessional', email: 'pro@example.com' },
  title: 'Engineer',
  availability: [{ day: 'monday', startTime: '09:00', endTime: '17:00' }]
};
vi.mock('../backend/models/professionalProfile', () => ({
  findById: vi.fn(() => ({ populate: vi.fn(() => Promise.resolve(professional)) }))
}));

vi.mock('../backend/models/user', () => ({
  findById: vi.fn(() => Promise.resolve({ _id: 'user1', firstName: 'First', lastName: 'Last', email: 'user@example.com' }))
}));

vi.mock('../backend/models/sessionVerification', () => ({
  create: vi.fn()
}));

vi.mock('../backend/services/zoomService', () => ({
  createMeeting: vi.fn(() => Promise.resolve({ meetingId: 'm1', meetingUrl: 'http://zoom', password: 'pwd', startUrl: 'http://start' }))
}));

vi.mock('../backend/models/sessionVerification', () => function(){});

const notificationService = { sendNotification: vi.fn() };
vi.mock('../backend/services/notificationService', () => notificationService);

const emailService = { sendSessionConfirmation: vi.fn() };
vi.mock('../backend/services/emailService', () => emailService);

vi.mock('../backend/utils/logger', () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }));

const SessionService = require('../backend/services/sessionService');

describe('session service', () => {
  it('sends confirmation email when creating a session', async () => {
    vi.spyOn(SessionService, 'checkAvailability').mockImplementation(() => Promise.resolve(true));
    await SessionService.createSession({
      professionalId: 'pro1',
      userId: 'user1',
      startTime: Date.now(),
      endTime: Date.now() + 3600000,
      notes: ''
    });
    expect(emailService.sendSessionConfirmation).toHaveBeenCalled();
  });
});
