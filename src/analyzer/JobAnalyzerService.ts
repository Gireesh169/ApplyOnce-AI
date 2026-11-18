import { UserProfile } from '@/profile/types';

export interface JobAnalysisResult {
  jobTitle?: string;
  companyName?: string;
  location?: string;
  employmentType?: string;
  minYearsExperience?: number;
  educationRequirements?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  relevantProjects: Array<{
    title: string;
    matchingTechnologies: string[];
  }>;
  matchScore: number; // 0 - 100
  summary: string;
}

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL',
  'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'FastAPI', 'Spring Boot', 'Tailwind CSS',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB',
  'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'Terraform',
  'GraphQL', 'REST', 'Microservices', 'Distributed Systems', 'Machine Learning', 'AI', 'NLP', 'Data Science',
  'Agile', 'Scrum', 'Leadership', 'System Design'
];

export class JobAnalyzerService {
  /**
   * Analyzes job description text and matches against candidate profile.
   */
  public static analyzeJobDescription(jdText: string, profile: UserProfile): JobAnalysisResult {
    const textLower = jdText.toLowerCase();

    // 1. Detect Job Title
    let jobTitle: string | undefined;
    const titleMatch = jdText.match(/(?:Job Title|Position|Role):\s*([^\n\r]+)/i) ||
                       jdText.match(/(?:Senior|Lead|Junior|Staff|Principal)?\s*(?:Software|Full-?Stack|Frontend|Backend|DevOps|Cloud|Data|ML|AI)\s*(?:Engineer|Developer|Architect)/i);
    if (titleMatch) {
      jobTitle = titleMatch[1] || titleMatch[0];
    }

    // 2. Detect Company Name
    let companyName: string | undefined;
    const companyMatch = jdText.match(/(?:Company|About|At)\s+([A-Z][a-zA-Z0-9\s&]+(?:Inc|LLC|Corp|Technologies|Labs)?)/);
    if (companyMatch) {
      companyName = companyMatch[1].trim();
    }

    // 3. Detect Employment Type & Location
    let employmentType = 'Full-time';
    if (textLower.includes('contract')) employmentType = 'Contract';
    else if (textLower.includes('part-time')) employmentType = 'Part-time';
    else if (textLower.includes('internship') || textLower.includes('intern')) employmentType = 'Internship';

    let location = 'On-site';
    if (textLower.includes('remote')) location = 'Remote';
    else if (textLower.includes('hybrid')) location = 'Hybrid';

    // 4. Detect Experience Requirement
    let minYearsExperience: number | undefined;
    const expMatch = textLower.match(/(\d+)\+?\s*(?:to\s*\d+\s*)?years?(?:\s*of)?\s*experience/);
    if (expMatch) {
      minYearsExperience = parseInt(expMatch[1], 10);
    }

    // 5. Detect Skills
    const foundSkills = new Set<string>();
    for (const skill of COMMON_SKILLS) {
      const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(jdText)) {
        foundSkills.add(skill);
      }
    }

    const allJdSkills = Array.from(foundSkills);

    // Differentiate Required vs Preferred
    const requiredSkills: string[] = [];
    const preferredSkills: string[] = [];

    const reqSection = jdText.match(/(?:requirements|qualifications|what you'?ll need|what you bring)[\s\S]*?(?:preferred|nice to have|bonus|about us|$)/i);
    const prefSection = jdText.match(/(?:preferred|nice to have|bonus|plus)[\s\S]*?(?:benefits|about us|equal opportunity|$)/i);

    const reqText = reqSection ? reqSection[0].toLowerCase() : textLower;
    const prefText = prefSection ? prefSection[0].toLowerCase() : '';

    for (const s of allJdSkills) {
      if (prefText && prefText.includes(s.toLowerCase())) {
        preferredSkills.push(s);
      } else {
        requiredSkills.push(s);
      }
    }

    // Candidate skills set
    const candidateSkills = new Set([
      ...profile.skills.programmingLanguages.map(s => s.toLowerCase()),
      ...profile.skills.frameworks.map(s => s.toLowerCase()),
      ...profile.skills.databases.map(s => s.toLowerCase()),
      ...profile.skills.cloudPlatforms.map(s => s.toLowerCase()),
      ...profile.skills.tools.map(s => s.toLowerCase()),
      ...profile.skills.softSkills.map(s => s.toLowerCase()),
      ...profile.skills.certifications.map(s => s.toLowerCase())
    ]);

    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const s of allJdSkills) {
      if (candidateSkills.has(s.toLowerCase())) {
        matchingSkills.push(s);
      } else {
        missingSkills.push(s);
      }
    }

    // Find Relevant Projects
    const relevantProjects: JobAnalysisResult['relevantProjects'] = [];
    for (const proj of profile.projects) {
      const projTech = proj.technologies.filter(t =>
        allJdSkills.some(s => s.toLowerCase() === t.toLowerCase())
      );
      if (projTech.length > 0) {
        relevantProjects.push({
          title: proj.title,
          matchingTechnologies: projTech
        });
      }
    }

    // Calculate Match Score
    let matchScore = 50; // base score
    if (allJdSkills.length > 0) {
      const skillScore = (matchingSkills.length / allJdSkills.length) * 60;
      const expScore = profile.experience.length > 0 ? 25 : 10;
      const eduScore = profile.education.length > 0 ? 15 : 5;
      matchScore = Math.min(100, Math.round(skillScore + expScore + eduScore));
    }

    const summary = matchingSkills.length >= 3
      ? `Strong match! You meet ${matchingSkills.length} out of ${allJdSkills.length} identified technical requirements.`
      : `Moderate match. Consider highlighting transferable experience for missing skills: ${missingSkills.slice(0, 3).join(', ')}.`;

    return {
      jobTitle,
      companyName,
      location,
      employmentType,
      minYearsExperience,
      requiredSkills,
      preferredSkills,
      matchingSkills,
      missingSkills,
      relevantProjects,
      matchScore,
      summary
    };
  }
}
