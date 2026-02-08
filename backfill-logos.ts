import { Client } from 'pg';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

/**
 * PRODUCTION LOGO BACKFILL SCRIPT
 *
 * This script identifies companies missing logos or holding low-quality Google favicon URLs,
 * and attempts to fetch high-quality logos from Brandfetch or Clearbit.
 *
 */

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'jobtracker_dev',
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: true, ca: process.env.DB_CA_CERT }
      : false,
});

async function backfill() {
  try {
    console.log('--- Logo Backfill Process Started ---');

    if (!process.env.BRANDFETCH_API_KEY) {
      console.warn('⚠️ BRANDFETCH_API_KEY not set — Brandfetch lookups will be skipped.');
    }

    console.log('Connecting to database...');
    await client.connect();

    // Fetch companies needing logos: Either NULL or Google Favicons (low quality)
    console.log('Searching for companies with missing or low-quality logos...');
    const res = await client.query(`
      SELECT id, name, url 
      FROM "companies" 
      WHERE "logo" IS NULL 
      OR "logo" LIKE '%google.com/s2/favicons%'
    `);
    const companies = res.rows;

    console.log(`Found ${companies.length} companies to process.`);

    for (const company of companies) {
      console.log(`\nProcessing: ${company.name} (${company.url || 'No URL'})`);

      if (!company.url) {
        console.log(`⚠️ Skipping ${company.name}: No domain URL provided.`);
        continue;
      }

      // Cleanup domain
      const domain = company.url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];

      let foundLogo: string | null = null;

      // Method 1: Brandfetch
      try {
        console.log(`  Trying Brandfetch for ${domain}...`);
        const bfResponse = await axios.get(`https://api.brandfetch.io/v2/brands/${domain}`, {
          headers: { Authorization: `Bearer ${process.env.BRANDFETCH_API_KEY}` },
          timeout: 10000,
        });

        const icon = bfResponse.data?.logos?.find(
          (l: any) => l.type === 'icon' || l.type === 'logo',
        );
        if (icon?.formats?.[0]?.src) {
          foundLogo = icon.formats[0].src;
          console.log(`  ✅ Brandfetch found logo: ${foundLogo}`);
        }
      } catch (err: any) {
        console.log(`  ❌ Brandfetch failed: ${err.message}`);
      }

      // Method 2: Clearbit (Fallback)
      if (!foundLogo) {
        try {
          console.log(`  Trying Clearbit fallback for ${domain}...`);
          const cbUrl = `https://logo.clearbit.com/${domain}`;
          await axios.head(cbUrl, { timeout: 10000 }); // Verify it exists
          foundLogo = cbUrl;
          console.log(`  ✅ Clearbit found logo: ${foundLogo}`);
        } catch (err) {
          console.log(`  ❌ Clearbit failed: ${err?.message || err}`);
        }
      }

      if (foundLogo) {
        await client.query('UPDATE "companies" SET "logo" = $1 WHERE id = $2', [
          foundLogo,
          company.id,
        ]);
        console.log(`  ✨ Successfully updated database for ${company.name}.`);
      } else {
        console.log(`  ⚠️ No logo discovered for ${company.name}.`);
      }

      // Throttle slightly to respect API limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('\n--- Backfill Process Completed ---');
  } catch (error) {
    console.error('CRITICAL ERROR:', error);
  } finally {
    await client.end();
  }
}

backfill();
// Prefer top-level await
(async () => {
  await backfill();
})();
