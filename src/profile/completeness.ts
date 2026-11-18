import { UserProfile } from './types';

export interface CompletenessCategory {
  name: string;
  score: number; // 0 - 100
  weight: number;
  completedItems: string[];
  missingItems: string[];
}

export interface ProfileCompletenessReport {
  overallScore: number;
  categories: Record<string, CompletenessCategory>;
  recommendations: string[];
}

export function calculateProfileCompleteness(
  profile: UserProfile,
  hasResume: boolean = false
): ProfileCompletenessReport {
  const categories: Record<string, CompletenessCategory> = {};
  const recommendations: string[] = [];

  // 1. Personal Information (Weight: 20)
  const personalCompleted: string[] = [];
  const personalMissing: string[] = [];

  if (profile.personal.firstName.trim()) personalCompleted.push('First Name');
  else personalMissing.push('First Name');

  if (profile.personal.lastName.trim()) personalCompleted.push('Last Name');
  else personalMissing.push('Last Name');

  if (profile.personal.country.trim()) personalCompleted.push('Country');
  else personalMissing.push('Country');

  if (profile.personal.city.trim()) personalCompleted.push('City');
  else personalMissing.push('City');

  if (profile.personal.address.trim()) personalCompleted.push('Street Address');
  else personalMissing.push('Street Address');

  if (profile.personal.postalCode.trim()) personalCompleted.push('Postal Code');
  else personalMissing.push('Postal Code');

  // Optional legal name check
  if (profile.personal.legalFullName?.trim() || profile.personal.legalFirstName?.trim()) {
    personalCompleted.push('Legal Name (Optional)');
  }

  const personalScore = Math.round(
    (personalCompleted.filter(i => !i.includes('Optional')).length / 6) * 100
  );
  categories.personal = {
    name: 'Personal Information',
    score: Math.min(100, personalScore),
    weight: 20,
    completedItems: personalCompleted,
    missingItems: personalMissing
  };

  // 2. Contact Information (Weight: 20)
  const contactCompleted: string[] = [];
  const contactMissing: string[] = [];

  if (profile.contact.primaryEmail.trim()) contactCompleted.push('Primary Email');
  else contactMissing.push('Primary Email');

  if (profile.contact.mobileNumber.trim()) contactCompleted.push('Phone Number');
  else contactMissing.push('Phone Number');

  if (profile.contact.linkedInUrl?.trim()) contactCompleted.push('LinkedIn URL');
  else contactMissing.push('LinkedIn URL');

  if (profile.contact.gitHubUrl?.trim()) contactCompleted.push('GitHub URL');
  else contactMissing.push('GitHub URL');

  if (profile.contact.portfolioUrl?.trim() || profile.contact.personalWebsite?.trim()) {
    contactCompleted.push('Portfolio / Website');
  } else {
    contactMissing.push('Portfolio / Website');
  }

  const contactScore = Math.round((contactCompleted.length / 5) * 100);
  categories.contact = {
    name: 'Contact Information',
    score: Math.min(100, contactScore),
    weight: 20,
    completedItems: contactCompleted,
    missingItems: contactMissing
  };

  // 3. Education (Weight: 15)
  const educationCompleted: string[] = [];
  const educationMissing: string[] = [];

  if (profile.education.length > 0) {
    educationCompleted.push(`${profile.education.length} Education Record(s)`);
    const primaryEdu = profile.education[0];
    if (primaryEdu.institution) educationCompleted.push('Institution');
    if (primaryEdu.degree) educationCompleted.push('Degree');
    if (primaryEdu.fieldOfStudy) educationCompleted.push('Field of Study');
    if (primaryEdu.graduationYear) educationCompleted.push('Graduation Year');
  } else {
    educationMissing.push('At least 1 Education Record');
    educationMissing.push('Degree & Major');
  }

  const educationScore = profile.education.length > 0 ? 100 : 0;
  categories.education = {
    name: 'Education',
    score: educationScore,
    weight: 15,
    completedItems: educationCompleted,
    missingItems: educationMissing
  };

  // 4. Experience (Weight: 15)
  const expCompleted: string[] = [];
  const expMissing: string[] = [];

  if (profile.experience.length > 0) {
    expCompleted.push(`${profile.experience.length} Experience Record(s)`);
    const recent = profile.experience[0];
    if (recent.company) expCompleted.push('Company');
    if (recent.jobTitle) expCompleted.push('Job Title');
    if (recent.responsibilities) expCompleted.push('Key Responsibilities');
  } else {
    expMissing.push('Work or Internship Experience');
  }

  const expScore = profile.experience.length > 0 ? 100 : 0;
  categories.experience = {
    name: 'Work Experience',
    score: expScore,
    weight: 15,
    completedItems: expCompleted,
    missingItems: expMissing
  };

  // 5. Skills (Weight: 15)
  const skillsCompleted: string[] = [];
  const skillsMissing: string[] = [];
  const totalSkills =
    profile.skills.programmingLanguages.length +
    profile.skills.frameworks.length +
    profile.skills.databases.length +
    profile.skills.cloudPlatforms.length +
    profile.skills.tools.length;

  if (profile.skills.programmingLanguages.length > 0) skillsCompleted.push('Programming Languages');
  else skillsMissing.push('Programming Languages');

  if (profile.skills.frameworks.length > 0) skillsCompleted.push('Frameworks & Libraries');
  else skillsMissing.push('Frameworks & Libraries');

  if (profile.skills.databases.length > 0 || profile.skills.cloudPlatforms.length > 0) {
    skillsCompleted.push('Databases & Cloud');
  } else {
    skillsMissing.push('Databases or Cloud');
  }

  const skillsScore = totalSkills >= 8 ? 100 : Math.round((totalSkills / 8) * 100);
  categories.skills = {
    name: 'Skills',
    score: Math.min(100, skillsScore),
    weight: 15,
    completedItems: skillsCompleted,
    missingItems: skillsMissing
  };

  // 6. Projects (Weight: 10)
  const projCompleted: string[] = [];
  const projMissing: string[] = [];

  if (profile.projects.length > 0) {
    projCompleted.push(`${profile.projects.length} Project(s)`);
  } else {
    projMissing.push('At least 1 Key Project');
  }

  const projScore = profile.projects.length > 0 ? 100 : 0;
  categories.projects = {
    name: 'Projects',
    score: projScore,
    weight: 10,
    completedItems: projCompleted,
    missingItems: projMissing
  };

  // 7. Resume Availability (Weight: 5)
  categories.resume = {
    name: 'Resume Document',
    score: hasResume ? 100 : 0,
    weight: 5,
    completedItems: hasResume ? ['Resume Uploaded'] : [],
    missingItems: hasResume ? [] : ['Upload Master PDF Resume']
  };

  // Calculate Weighted Overall Score
  let totalWeighted = 0;
  let totalWeight = 0;
  Object.values(categories).forEach(cat => {
    totalWeighted += (cat.score * cat.weight);
    totalWeight += cat.weight;
  });

  const overallScore = Math.round(totalWeighted / totalWeight);

  // Recommendations
  if (personalMissing.length > 0) recommendations.push(`Complete personal info: ${personalMissing.join(', ')}`);
  if (!profile.contact.linkedInUrl) recommendations.push('Add your LinkedIn profile URL');
  if (!profile.contact.gitHubUrl) recommendations.push('Add your GitHub profile URL');
  if (profile.education.length === 0) recommendations.push('Add your highest education degree');
  if (profile.experience.length === 0) recommendations.push('Add your work or internship experience');
  if (totalSkills < 5) recommendations.push('Add at least 5 relevant technical skills');
  if (!hasResume) recommendations.push('Upload a PDF resume to enable quick imports and analysis');

  return {
    overallScore,
    categories,
    recommendations
  };
}
