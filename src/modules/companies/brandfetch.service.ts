import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { DomainValidationResultDto } from './dtos/validate-domain.dto';

@Injectable()
export class BrandfetchService {
  private readonly logger = new Logger(BrandfetchService.name);
  private readonly brandfetchApiUrl = 'https://api.brandfetch.io/v2/brands';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validates a domain against Brandfetch API to check if it's registered
   * and retrieve the official company name and logo
   */
  async validateDomain(domain: string): Promise<DomainValidationResultDto> {
    try {
      // Clean domain (remove protocol, www, trailing slashes)
      const cleanDomain = this.cleanDomain(domain);

      this.logger.log(`Validating domain: ${cleanDomain}`);

      const apiKey = this.configService.get<string>('BRANDFETCH_API_KEY');
      if (!apiKey) {
        this.logger.warn('BRANDFETCH_API_KEY is not configured');
        return { exists: false };
      }

      // Call Brandfetch API
      const response = await firstValueFrom(
        this.httpService.get<any>(`${this.brandfetchApiUrl}/${cleanDomain}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 5000, // 5 second timeout
        }),
      );

      if (response.data && response.data.name) {
        this.logger.log(`Domain ${cleanDomain} found in Brandfetch: ${response.data.name}`);

        // Extract logo URL (prefer SVG, fallback to PNG)
        const logo = this.extractLogo(response.data);

        return {
          exists: true,
          name: response.data.name,
          logo: logo,
          domain: cleanDomain,
        };
      }

      return { exists: false };
    } catch (error) {
      // If 404 or any error, domain doesn't exist in Brandfetch
      if (error.response?.status === 404) {
        this.logger.log(`Domain ${domain} not found in Brandfetch`);
        return { exists: false };
      }

      this.logger.warn(`Error validating domain ${domain}:`, error.message);
      return { exists: false };
    }
  }

  /**
   * Clean domain by removing protocol, www, and trailing slashes
   */
  private cleanDomain(domain: string): string {
    return domain
      .replace(/^https?:\/\//, '') // Remove protocol
      .replace(/^www\./, '') // Remove www
      .replace(/\/$/, '') // Remove trailing slash
      .split('/')[0]; // Take only domain part
  }

  /**
   * Extract logo URL from Brandfetch response
   * Prefer SVG format, fallback to PNG
   */
  private extractLogo(data: any): string | undefined {
    if (!data.logos || data.logos.length === 0) {
      return undefined;
    }

    // Try to find SVG logo first
    const svgLogo = data.logos.find(
      (logo: any) => logo.formats?.find((format: any) => format.format === 'svg'),
    );

    if (svgLogo) {
      const svgFormat = svgLogo.formats.find((format: any) => format.format === 'svg');
      return svgFormat?.src;
    }

    // Fallback to PNG
    const pngLogo = data.logos.find(
      (logo: any) => logo.formats?.find((format: any) => format.format === 'png'),
    );

    if (pngLogo) {
      const pngFormat = pngLogo.formats.find((format: any) => format.format === 'png');
      return pngFormat?.src;
    }

    // Last resort: return first available logo
    return data.logos[0]?.formats?.[0]?.src;
  }
}
