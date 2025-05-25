import apiClient from './client';

export { default as apiClient } from './client';
export { default as AuthAPI } from '../../api/auth';
export { default as SessionsAPI } from '../../api/sessions';
export { default as NotificationsAPI } from '../../api/notifications';
export { default as ProfessionalsAPI } from '../../api/professionals';
export { default as PaymentsAPI } from '../../api/payment';
export { default as ReferralsAPI } from '../../api/referrals';
export { default as AdminAPI } from '../../api/admin';

export default {
  apiClient,
  AuthAPI,
  SessionsAPI,
  NotificationsAPI,
  ProfessionalsAPI,
  PaymentsAPI,
  ReferralsAPI,
  AdminAPI
};
