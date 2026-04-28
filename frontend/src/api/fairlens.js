import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

export const checkHealth = () => API.get('/health');

export const runPremodelAudit = (payload) =>
  API.post('/premodel/audit', payload);

export const getDemoInfo = () => API.get('/premodel/demo-info');

export const runPostmodelAudit = (payload) =>
  API.post('/postmodel/audit', payload);

export const runBiasMirror = (payload) =>
  API.post('/postmodel/bias-mirror', payload);

export const generateGovernanceReport = (payload) =>
  API.post('/governance/report', payload);

export const getRemediationSteps = (payload) =>
  API.post('/governance/remediation', payload);

export const getAuditTrail = () => API.get('/governance/trail');
