// Keystone-Governance Beta User Agent - Simulates compliance officer/incident manager behavior

import { TestAgent } from '../../core/TestAgent';
import { UserPersona, TestConfig, TestResult, TestStatus } from '../../core/types';

interface KeystoneUser {
  id: string;
  email: string;
  first_name: string;
  role: string;
  org_id: string;
}

interface Incident {
  id: string;
  incident_number: string;
  title: string;
}

export class KeystoneGovernanceBetaUserAgent extends TestAgent {
  private accessToken?: string;
  private user?: KeystoneUser;
  private incidents: Incident[] = [];

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    super(agentName, persona, config);
    this.metrics.stepsTotal = 10;
  }

  async executeTestFlow(): Promise<TestResult> {
    this.logger.info('Starting Keystone-Governance test flow');
    this.status = TestStatus.RUNNING;

    try {
      await this.executeAction('login', async () => await this.login(), true);
      await this.humanDelay();
      await this.executeAction('view_dashboard', async () => await this.viewDashboard(), true);
      await this.humanDelay();
      await this.executeAction('create_incident', async () => await this.createIncident(), true);
      await this.humanDelay();
      await this.executeAction('list_incidents', async () => await this.listIncidents(), true);
      await this.humanDelay();
      await this.executeAction('view_incident', async () => await this.viewIncident(), true);
      await this.humanDelay();
      await this.executeAction('list_policies', async () => await this.listPolicies(), true);
      await this.humanDelay();
      await this.executeAction('list_documents', async () => await this.listDocuments(), true);
      await this.humanDelay();
      await this.executeAction('view_training', async () => await this.viewTraining(), true);
      await this.humanDelay();
      await this.executeAction('check_compliance', async () => await this.checkCompliance(), true);
      await this.humanDelay();
      await this.executeAction('view_notifications', async () => await this.viewNotifications(), true);

      return this.generateResult(TestStatus.COMPLETED, 'Successfully completed Keystone-Governance test flow');
    } catch (error: any) {
      this.logger.error('Test flow failed', { error: error.message });
      return this.generateResult(TestStatus.FAILED, 'Test flow failed: ' + error.message);
    }
  }

  async generateRealisticContent(contentType: string): Promise<any> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [{ role: 'user', content: 'Generate a short ' + contentType + ' for compliance. Return only the text.' }],
      });
      const content = response.content[0];
      return content.type === 'text' ? content.text : this.getFallbackContent(contentType);
    } catch { return this.getFallbackContent(contentType); }
  }

  private async login(): Promise<void> {
    const response = await this.http.post('/api/v1/auth/login', {
      email: 'admin@demo-keystone.com',
      password: 'DemoAdmin123\!',
    });
    this.accessToken = response.data.access_token;
    this.user = response.data.user;
    this.http.defaults.headers.Authorization = 'Bearer ' + this.accessToken;
    this.logger.info('Login successful', { userId: this.user?.id });
  }

  private async viewDashboard(): Promise<void> {
    const [inc, usr] = await Promise.all([
      this.http.get('/api/v1/dashboard/incidents'),
      this.http.get('/api/v1/dashboard/users'),
    ]);
    this.logger.info('Dashboard viewed', { incidents: inc.data.total?.value || 0, users: usr.data.total?.value || 0 });
  }

  private async createIncident(): Promise<void> {
    const title = await this.generateRealisticContent('incident title');
    const response = await this.http.post('/api/v1/incidents', {
      title: typeof title === 'string' ? title.substring(0, 100) : 'Security Incident',
      description: 'Potential breach detected',
      incident_type: 'security',
      severity: 'medium',
      priority: 'medium',
      incident_date: new Date().toISOString(),
      location: 'Main Office',
      confidential: false,
    });
    this.incidents.push({ id: response.data.id, incident_number: response.data.incident_number, title: response.data.title });
    this.logger.info('Incident created', { id: response.data.id });
  }

  private async listIncidents(): Promise<void> {
    const response = await this.http.get('/api/v1/incidents', { params: { page: 1, limit: 20 } });
    this.logger.info('Incidents listed', { count: response.data.data?.length || 0 });
  }

  private async viewIncident(): Promise<void> {
    if (this.incidents.length === 0) {
      const list = await this.http.get('/api/v1/incidents', { params: { page: 1, limit: 1 } });
      if (list.data.data?.length > 0) this.incidents.push(list.data.data[0]);
      else { this.logger.info('No incidents'); return; }
    }
    const response = await this.http.get('/api/v1/incidents/' + this.incidents[0].id);
    this.logger.info('Incident viewed', { number: response.data.incident_number });
  }

  private async listPolicies(): Promise<void> {
    const response = await this.http.get('/api/v1/policies', { params: { page: 1, limit: 20 } });
    this.logger.info('Policies listed', { count: response.data.data?.length || 0 });
  }

  private async listDocuments(): Promise<void> {
    const response = await this.http.get('/api/v1/documents', { params: { page: 1, limit: 20 } });
    this.logger.info('Documents listed', { count: response.data.data?.length || 0 });
  }

  private async viewTraining(): Promise<void> {
    const response = await this.http.get('/api/v1/training/modules', { params: { page: 1, limit: 20 } });
    this.logger.info('Training viewed', { count: response.data.data?.length || 0 });
  }

  private async checkCompliance(): Promise<void> {
    const response = await this.http.get('/api/v1/dashboard/training');
    this.logger.info('Compliance checked', { score: response.data.completion_rate || 'N/A' });
  }

  private async viewNotifications(): Promise<void> {
    const [count, list] = await Promise.all([
      this.http.get('/api/v1/notifications/count'),
      this.http.get('/api/v1/notifications', { params: { limit: 10, page: 1 } }),
    ]);
    this.logger.info('Notifications viewed', { unread: count.data.count || 0 });
  }

  private getFallbackContent(contentType: string): string {
    return contentType.includes('title') ? 'Security Policy Violation' : 'Compliance content';
  }
}
