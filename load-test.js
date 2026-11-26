import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '10s',
  thresholds: { checks: ['rate==1'], http_req_failed: ['rate==0'] },
};

const baseUrl = (__ENV.BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const slug = __ENV.BUSINESS_SLUG || 'mibarberia503';
const { BRANCH_ID: branchId, SERVICE_ID: serviceId, DATE: date } = __ENV;
if (!branchId || !serviceId || !date) {
  throw new Error('Configura BRANCH_ID, SERVICE_ID y DATE para una sucursal y servicio existentes');
}
const url = `${baseUrl}/negocios/${encodeURIComponent(slug)}/sucursales/${encodeURIComponent(branchId)}/disponibilidad?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`;

export default function () {
  const response = http.get(url);
  check(response, { 'disponibilidad responde 200': result => result.status === 200 });
  sleep(0.5);
}
