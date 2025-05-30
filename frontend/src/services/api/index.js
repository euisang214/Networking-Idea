import apiClient from './client';
import AuthAPI from '../../api/auth';
import SessionsAPI from '../../api/sessions';
import NotificationsAPI from '../../api/notifications';
import ProfessionalsAPI from '../../api/professionals';
import PaymentsAPI from '../../api/payment';
import ReferralsAPI from '../../api/referrals';
import AdminAPI from '../../api/admin';
import JobOffersAPI from '../../api/jobOffers';

export { default as apiClient } from './client';
export { default as AuthAPI } from '../../api/auth';
export { default as SessionsAPI } from '../../api/sessions';
export { default as NotificationsAPI } from '../../api/notifications';
export { default as ProfessionalsAPI } from '../../api/professionals';
export { default as PaymentsAPI } from '../../api/payment';
export { default as ReferralsAPI } from '../../api/referrals';
export { default as AdminAPI } from '../../api/admin';
export { default as JobOffersAPI } from '../../api/jobOffers';

const API = {
  apiClient,
  AuthAPI,
  SessionsAPI,
  NotificationsAPI,
  ProfessionalsAPI,
  PaymentsAPI,
  ReferralsAPI,
  AdminAPI,
  JobOffersAPI
};

export default API;