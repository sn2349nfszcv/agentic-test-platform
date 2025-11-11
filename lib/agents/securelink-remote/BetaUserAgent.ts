// SecureLink-Remote Beta User Agent - Simulates remote worker/IT admin behavior

import { TestAgent } from '../../core/TestAgent';
import { UserPersona, TestConfig, TestResult, TestStatus } from '../../core/types';

interface SecureLinkUser {
  id: string;
  email: string;
  name: string;
}

export class SecureLinkRemoteBetaUserAgent extends TestAgent {
  private sessionCookie?: string;
  private user?: SecureLinkUser;

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    super(agentName, persona, config);
    this.metrics.stepsTotal = 10;
  }

  async executeTestFlow(): Promise<TestResult> {
    this.logger.info('Starting SecureLink-Remote test flow');
    this.status = TestStatus.RUNNING;

    try {
      await this.executeAction('signup_or_login', async () => await this.signupOrLogin(), true);
      await this.humanDelay();
      await this.executeAction('setup_vpn', async () => await this.setupVPN(), true);
      await this.humanDelay();
      await this.executeAction('connect_remote_desktop', async () => await this.connectRemoteDesktop(), true);
      await this.humanDelay();
      await this.executeAction('access_secure_files', async () => await this.accessSecureFiles(), true);
      await this.humanDelay();
      await this.executeAction('start_secure_meeting', async () => await this.startSecureMeeting(), true);
      await this.humanDelay();
      await this.executeAction('transfer_encrypted_data', async () => await this.transferEncryptedData(), true);
      await this.humanDelay();
      await this.executeAction('configure_mfa', async () => await this.configureMFA(), true);
      await this.humanDelay();
      await this.executeAction('review_security_logs', async () => await this.reviewSecurityLogs(), true);
      await this.humanDelay();
      await this.executeAction('update_access_policies', async () => await this.updateAccessPolicies(), true);
      await this.humanDelay();
      await this.executeAction('view_security_dashboard', async () => await this.viewSecurityDashboard(), true);

      return this.generateResult(TestStatus.COMPLETED, `Successfully completed SecureLink-Remote test flow`);
    } catch (error: any) {
      this.logger.error('Test flow failed', { error: error.message });
      return this.generateResult(TestStatus.FAILED, `Test flow failed: ${error.message}`);
    }
  }

  async generateRealisticContent(contentType: string): Promise<any> {
    const prompt = `Generate realistic ${contentType} for a ${this.persona.type} remote worker/IT admin.`;
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022', max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });
      const content = response.content[0];
      return content.type === 'text' ? content.text : '';
    } catch (error: any) {
      return this.getFallbackContent(contentType);
    }
  }

  private async signupOrLogin(): Promise<void> {
    const email = `${this.agentName.toLowerCase()}@test-securelink.local`;
    const password = 'TestSecure123!'; // pragma: allowlist secret
    try {
      const signupResponse = await this.http.post('/api/auth/signup', {
        email, password, name: this.persona.name, role: 'REMOTE_WORKER',
      });
      this.user = signupResponse.data.user;
      this.sessionCookie = signupResponse.headers['set-cookie']?.[0];
    } catch (error: any) {
      if (error.response?.status === 409) {
        const loginResponse = await this.http.post('/api/auth/signin', { email, password });
        this.user = loginResponse.data.user;
        this.sessionCookie = loginResponse.headers['set-cookie']?.[0];
      } else throw error;
    }
    if (this.sessionCookie) this.http.defaults.headers.Cookie = this.sessionCookie;
  }

  private async setupVPN(): Promise<void> {
    await this.http.post('/api/vpn/setup', { protocol: 'OpenVPN' });
    this.logger.info('VPN setup complete');
  }

  private async connectRemoteDesktop(): Promise<void> {
    await this.http.post('/api/remote-desktop/connect', { hostId: 'workstation-01' });
    this.logger.info('Remote desktop connected');
  }

  private async accessSecureFiles(): Promise<void> {
    await this.http.get('/api/files/secure?folder=documents');
    this.logger.info('Secure files accessed');
  }

  private async startSecureMeeting(): Promise<void> {
    await this.http.post('/api/meetings/create', {
      encrypted: true,
      participants: ['colleague@test.local'],
    });
    this.logger.info('Secure meeting started');
  }

  private async transferEncryptedData(): Promise<void> {
    await this.http.post('/api/transfer/encrypted', {
      destination: 'secure-server',
      encryptionType: 'AES-256',
    });
    this.logger.info('Encrypted data transferred');
  }

  private async configureMFA(): Promise<void> {
    const method = await this.makeIntelligentDecision(
      'Choose MFA method:',
      ['Authenticator App', 'SMS', 'Hardware Token']
    );
    await this.http.post('/api/mfa/configure', { method: method.chosen });
    this.logger.info('MFA configured', { method: method.chosen });
  }

  private async reviewSecurityLogs(): Promise<void> {
    await this.http.get('/api/security/logs?last=24h');
    this.logger.info('Security logs reviewed');
  }

  private async updateAccessPolicies(): Promise<void> {
    await this.http.patch('/api/policies/access', {
      requireMFA: true,
      sessionTimeout: 3600,
    });
    this.logger.info('Access policies updated');
  }

  private async viewSecurityDashboard(): Promise<void> {
    const response = await this.http.get('/api/dashboard/security');
    this.logger.info('Security dashboard viewed', { status: response.data.status || 'SECURE' });
  }

  private getFallbackContent(contentType: string): string {
    return 'Generated security content';
  }
}
