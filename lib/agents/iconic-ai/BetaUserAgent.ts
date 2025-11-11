// Iconic-AI Beta User Agent - Simulates creative professional/brand manager behavior

import { TestAgent } from '../../core/TestAgent';
import { UserPersona, TestConfig, TestResult, TestStatus } from '../../core/types';

interface IconicUser {
  id: string;
  email: string;
  name: string;
}

export class IconicAIBetaUserAgent extends TestAgent {
  private sessionCookie?: string;
  private user?: IconicUser;

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    super(agentName, persona, config);
    this.metrics.stepsTotal = 10;
  }

  async executeTestFlow(): Promise<TestResult> {
    this.logger.info('Starting Iconic-AI test flow');
    this.status = TestStatus.RUNNING;

    try {
      await this.executeAction('signup_or_login', async () => await this.signupOrLogin(), true);
      await this.humanDelay();
      await this.executeAction('create_brand', async () => await this.createBrand(), true);
      await this.humanDelay();
      await this.executeAction('generate_logo', async () => await this.generateLogo(), true);
      await this.humanDelay();
      await this.executeAction('create_brand_guidelines', async () => await this.createBrandGuidelines(), true);
      await this.humanDelay();
      await this.executeAction('generate_marketing_assets', async () => await this.generateMarketingAssets(), true);
      await this.humanDelay();
      await this.executeAction('create_color_palette', async () => await this.createColorPalette(), true);
      await this.humanDelay();
      await this.executeAction('generate_tagline', async () => await this.generateTagline(), true);
      await this.humanDelay();
      await this.executeAction('analyze_brand_consistency', async () => await this.analyzeBrandConsistency(), true);
      await this.humanDelay();
      await this.executeAction('export_brand_kit', async () => await this.exportBrandKit(), true);
      await this.humanDelay();
      await this.executeAction('view_analytics', async () => await this.viewAnalytics(), true);

      return this.generateResult(TestStatus.COMPLETED, `Successfully completed Iconic-AI test flow`);
    } catch (error: any) {
      this.logger.error('Test flow failed', { error: error.message });
      return this.generateResult(TestStatus.FAILED, `Test flow failed: ${error.message}`);
    }
  }

  async generateRealisticContent(contentType: string): Promise<any> {
    const prompt = `Generate realistic ${contentType} for a ${this.persona.type} creative professional/brand manager.`;
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
    const email = `${this.agentName.toLowerCase()}@test-iconic.local`;
    const password = 'TestCreative123!'; // pragma: allowlist secret
    try {
      const signupResponse = await this.http.post('/api/auth/signup', {
        email, password, name: this.persona.name, role: 'CREATIVE',
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

  private async createBrand(): Promise<void> {
    const brandName = await this.generateRealisticContent('brand_name');
    await this.http.post('/api/brands', {
      name: typeof brandName === 'string' ? brandName : 'Test Brand',
      industry: 'TECHNOLOGY',
    });
    this.logger.info('Brand created');
  }

  private async generateLogo(): Promise<void> {
    const style = await this.makeIntelligentDecision(
      'What logo style do you prefer?',
      ['Modern', 'Classic', 'Minimalist', 'Bold']
    );
    await this.http.post('/api/logos/generate', { style: style.chosen });
    this.logger.info('Logo generated', { style: style.chosen });
  }

  private async createBrandGuidelines(): Promise<void> {
    await this.http.post('/api/guidelines/create', { includeTypography: true, includeVoice: true });
    this.logger.info('Brand guidelines created');
  }

  private async generateMarketingAssets(): Promise<void> {
    await this.http.post('/api/assets/generate', {
      types: ['social', 'email', 'print'],
    });
    this.logger.info('Marketing assets generated');
  }

  private async createColorPalette(): Promise<void> {
    await this.http.post('/api/colors/generate', { mood: 'professional' });
    this.logger.info('Color palette created');
  }

  private async generateTagline(): Promise<void> {
    await this.http.post('/api/taglines/generate', { tone: 'innovative' });
    this.logger.info('Tagline generated');
  }

  private async analyzeBrandConsistency(): Promise<void> {
    await this.http.get('/api/analysis/consistency');
    this.logger.info('Brand consistency analyzed');
  }

  private async exportBrandKit(): Promise<void> {
    const format = await this.makeIntelligentDecision(
      'Export format?',
      ['PDF', 'ZIP', 'Figma']
    );
    await this.http.post('/api/export', { format: format.chosen });
    this.logger.info('Brand kit exported', { format: format.chosen });
  }

  private async viewAnalytics(): Promise<void> {
    const response = await this.http.get('/api/analytics');
    this.logger.info('Analytics viewed', { brandsCount: response.data.total || 0 });
  }

  private getFallbackContent(contentType: string): string {
    const fallbacks: Record<string, string> = {
      brand_name: 'InnovateCo',
    };
    return fallbacks[contentType] || 'Generated creative content';
  }
}
