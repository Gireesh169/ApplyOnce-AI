import * as pdfjsLib from 'pdfjs-dist';
import { ExtractedResumeData } from './types';
import { syncStructuredPhone } from '@/profile/types';

// Set worker source for browser environment if available (local file to satisfy Chrome Extension CSP)
if (typeof window !== 'undefined' && (pdfjsLib as any).GlobalWorkerOptions) {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.mjs');
    } else {
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
  } catch {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
}

export class PDFExtractor {
  /**
   * Extracts raw text from an ArrayBuffer of a PDF file using PDF.js.
   * Handles empty files, password-protected PDFs, and corrupt data gracefully.
   */
  public static async extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('The selected PDF file is empty (0 bytes). Please select a valid resume document.');
    }

    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
        disableFontFace: true
      });

      const pdf = await loadingTask.promise;
      if (!pdf.numPages || pdf.numPages === 0) {
        throw new Error('The PDF file contains no pages.');
      }

      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += pageText + '\n\n';
      }

      const trimmed = fullText.trim();
      if (!trimmed) {
        throw new Error('No readable text could be extracted from this PDF. It may contain scanned images without OCR.');
      }

      return trimmed;
    } catch (err: any) {
      console.error('PDF.js extraction error:', err);
      if (err.name === 'PasswordException') {
        throw new Error('This PDF is password-protected. Please provide an unencrypted resume.');
      }
      if (err.name === 'InvalidPDFException') {
        throw new Error('The selected file is not a valid or readable PDF format.');
      }
      throw new Error(`Failed to extract text from PDF: ${err.message || 'Unknown error'}`);
    }
  }

  /**
   * Rule-based heuristic pattern extractor: parses raw text into structured resume suggestions.
   */
  public static parseResumeText(rawText: string): ExtractedResumeData {
    const data: ExtractedResumeData = {
      skills: [],
      education: [],
      experience: [],
      projects: []
    };

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Extract Email
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      data.email = emailMatch[0].trim();
    }

    // 2. Extract Phone Number (Detect both Indian +91 and International formats)
    const indianPhoneMatch = rawText.match(/(?:\+91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})/);
    const intlPhoneMatch = rawText.match(/(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    const rawPhone = indianPhoneMatch ? indianPhoneMatch[0] : (intlPhoneMatch ? intlPhoneMatch[0] : undefined);

    if (rawPhone) {
      const synced = syncStructuredPhone({ mobileNumber: rawPhone });
      data.phone = rawPhone.trim();
      data.phoneCountryCode = synced.phoneCountryCode;
      data.phoneNationalNumber = synced.phoneNationalNumber;
    }

    // 3. Extract LinkedIn URL
    const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
    if (linkedinMatch) {
      data.linkedIn = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
    }

    // 4. Extract GitHub URL
    const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
    if (githubMatch) {
      data.github = githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`;
    }

    // 5. Candidate Name Heuristic: First non-empty header line before email / links
    for (const line of lines.slice(0, 5)) {
      if (
        line.length > 2 &&
        line.length < 50 &&
        !line.includes('@') &&
        !line.includes('http') &&
        !line.includes('linkedin') &&
        !line.includes('github') &&
        !line.match(/\d{4,}/) &&
        !/resume|curriculum|vitae|page/i.test(line)
      ) {
        data.name = line;
        break;
      }
    }

    // 6. Skills extraction using known technology dictionary
    const KNOWN_SKILLS = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
      'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'FastAPI', 'Spring Boot', 'Tailwind CSS',
      'HTML', 'CSS', 'GraphQL', 'REST API', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite',
      'AWS', 'Google Cloud', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Git', 'GitHub Actions', 'CI/CD',
      'Linux', 'Jest', 'Vitest', 'Cypress', 'Playwright', 'Agile', 'Scrum', 'System Design'
    ];

    const detectedSkills = new Set<string>();
    for (const skill of KNOWN_SKILLS) {
      const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(rawText)) {
        detectedSkills.add(skill);
      }
    }
    data.skills = Array.from(detectedSkills);

    // 7. Heuristic Education Detection
    const eduMatches = rawText.match(/(?:Bachelor|Master|Doctorate|B\.S\.|M\.S\.|B\.Tech|M\.Tech|B\.E\.|M\.E\.|Ph\.D\.|Associate|Degree)[^.\n\r]+/gi);
    if (eduMatches) {
      for (const m of eduMatches.slice(0, 3)) {
        const yearMatch = m.match(/\b(20\d{2}|19\d{2})\b/) || rawText.match(/\b(20\d{2}|19\d{2})\b/);
        data.education?.push({
          degree: m.trim(),
          institution: 'Extracted University / College',
          fieldOfStudy: /Computer|Information|Electronics|Electrical|Mechanical/i.test(m) ? 'Computer Science & Engineering' : 'Engineering',
          graduationYear: yearMatch ? yearMatch[0] : '2024'
        });
      }
    }

    // 8. Heuristic Experience Detection
    const expPatterns = rawText.match(/(?:Software Engineer|Frontend Developer|Backend Developer|Full Stack Developer|Developer|Architect|Lead|Manager|Consultant|Intern)[^.\n\r]+/gi);
    if (expPatterns) {
      for (const job of expPatterns.slice(0, 3)) {
        data.experience?.push({
          jobTitle: job.trim(),
          company: 'Extracted Company',
          startDate: '2022',
          responsibilities: 'Extracted from resume work history.'
        });
      }
    }

    // 9. Heuristic Projects Detection
    const projectHeaderMatch = rawText.match(/(?:Projects|Key Projects|Academic Projects)[\s\S]{10,400}/i);
    if (projectHeaderMatch) {
      const pText = projectHeaderMatch[0];
      const pLines = pText.split('\n').map(l => l.trim()).filter(l => l.length > 5 && !/projects/i.test(l));
      if (pLines.length > 0) {
        data.projects?.push({
          title: pLines[0].substring(0, 60),
          description: pLines.slice(1, 3).join(' ') || 'Key project extracted from resume.',
          technologies: data.skills?.slice(0, 4) || []
        });
      }
    }

    return data;
  }
}
