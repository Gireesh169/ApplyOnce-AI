import { describe, it, expect } from 'vitest';
import { PDFExtractor } from '@/resume/pdfExtractor';
import { ResumeService } from '@/resume/ResumeService';
import { StorageService } from '@/storage/StorageService';
import { createEmptyProfile } from '@/profile/types';

describe('Module 6: Resume Management & PDF Heuristic Extraction', () => {
  const sampleResumeText = `
Alex Morgan
San Francisco, CA • alex.morgan@example.com • (555) 019-9283
linkedin.com/in/alexmorgan • github.com/alexmorgan

Summary:
Senior Software Engineer with 5+ years of experience in distributed systems and modern web technologies.

Technical Skills:
TypeScript, JavaScript, Python, React, Next.js, Node.js, PostgreSQL, Redis, Docker, AWS, Git, Kubernetes

Education:
Bachelor of Science in Computer Science, University of California, Berkeley (2020)

Experience:
Senior Software Engineer at Acme Cloud Corp (2022 - Present)
- Designed and scaled high-throughput REST APIs and microservices.
  `;

  it('extracts candidate contact info and links from raw text using heuristics', () => {
    const data = PDFExtractor.parseResumeText(sampleResumeText);
    expect(data.name).toBe('Alex Morgan');
    expect(data.email).toBe('alex.morgan@example.com');
    expect(data.phone).toBe('(555) 019-9283');
    expect(data.linkedIn).toContain('linkedin.com/in/alexmorgan');
    expect(data.github).toContain('github.com/alexmorgan');
  });

  it('identifies recognized programming languages and tools from dictionary', () => {
    const data = PDFExtractor.parseResumeText(sampleResumeText);
    expect(data.skills).toContain('TypeScript');
    expect(data.skills).toContain('React');
    expect(data.skills).toContain('PostgreSQL');
    expect(data.skills).toContain('Docker');
    expect(data.skills).toContain('AWS');
  });

  it('imports approved resume sections into profile with explicit consent', async () => {
    await StorageService.clearAllData();
    const data = PDFExtractor.parseResumeText(sampleResumeText);

    // Only approve contact and skills, not name
    const updatedProfile = await ResumeService.applyApprovedResumeDataToProfile(data, {
      name: false,
      contact: true,
      skills: true,
      education: false,
      experience: false
    });

    expect(updatedProfile.contact.primaryEmail).toBe('alex.morgan@example.com');
    expect(updatedProfile.contact.linkedInUrl).toContain('alexmorgan');
    expect(updatedProfile.skills.programmingLanguages).toContain('TypeScript');
  });
});
