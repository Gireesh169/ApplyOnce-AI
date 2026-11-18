import { DetectedFormField, MatchedFormField } from '@/adaptive/types';
import { UserProfile } from '@/profile/types';
import { CustomField } from '@/adaptive/types';
import { LearnedFieldMapping } from '@/memory/types';

interface MatchRule {
  targetPath: string; // e.g. "personal.firstName"
  keywords: string[];
  exactMatches?: string[];
  autocomplete?: string[];
  getValue: (profile: UserProfile) => any;
  disambiguationCheck?: (field: DetectedFormField, profile: UserProfile) => { isAmbiguous: boolean; reason?: string; valueOverride?: any };
}

export class FieldMatcher {
  private static rules: MatchRule[] = [
    // --- LEGAL NAME (Strict rule: Must not mix up with preferred or casual name) ---
    {
      targetPath: 'personal.legalFirstName',
      keywords: ['legal first name', 'legal_first_name', 'legalfirstname'],
      exactMatches: ['legal_first_name', 'legalfirstname', 'legal_firstname'],
      getValue: (p) => p.personal.legalFirstName || p.personal.firstName,
      disambiguationCheck: (f, p) => {
        if (!p.personal.legalFirstName && p.personal.firstName) {
          return {
            isAmbiguous: true,
            reason: 'Legal first name requested; only casual first name found in profile.'
          };
        }
        return { isAmbiguous: false };
      }
    },
    {
      targetPath: 'personal.legalLastName',
      keywords: ['legal last name', 'legal_last_name', 'legallastname', 'legal surname'],
      exactMatches: ['legal_last_name', 'legallastname'],
      getValue: (p) => p.personal.legalLastName || p.personal.lastName,
      disambiguationCheck: (f, p) => {
        if (!p.personal.legalLastName && p.personal.lastName) {
          return {
            isAmbiguous: true,
            reason: 'Legal last name requested; only standard last name found in profile.'
          };
        }
        return { isAmbiguous: false };
      }
    },
    {
      targetPath: 'personal.legalFullName',
      keywords: ['legal full name', 'legal name', 'legal_name', 'passport name'],
      getValue: (p) => p.personal.legalFullName || p.personal.fullName,
      disambiguationCheck: (f, p) => {
        if (!p.personal.legalFullName && p.personal.fullName) {
          return {
            isAmbiguous: true,
            reason: 'Legal full name requested; only standard full name found in profile.'
          };
        }
        return { isAmbiguous: false };
      }
    },

    // --- PREFERRED NAME ---
    {
      targetPath: 'personal.preferredName',
      keywords: ['preferred name', 'preferred_name', 'nickname', 'chosen name'],
      exactMatches: ['preferred_name', 'preferredname', 'nickname'],
      getValue: (p) => p.personal.preferredName || p.personal.firstName,
      disambiguationCheck: (f, p) => {
        if (!p.personal.preferredName && p.personal.firstName) {
          return {
            isAmbiguous: true,
            reason: 'Preferred name requested; falling back to first name.'
          };
        }
        return { isAmbiguous: false };
      }
    },

    // --- STANDARD NAMES ---
    {
      targetPath: 'personal.firstName',
      keywords: ['first name', 'given name', 'forename', 'fname'],
      exactMatches: ['first_name', 'firstname', 'fname', 'given-name'],
      autocomplete: ['given-name'],
      getValue: (p) => p.personal.firstName,
      disambiguationCheck: (f) => {
        const text = `${f.name} ${f.label} ${f.placeholder}`.toLowerCase();
        if (text.includes('legal')) {
          return { isAmbiguous: true, reason: 'Field specifies legal first name.' };
        }
        return { isAmbiguous: false };
      }
    },
    {
      targetPath: 'personal.middleName',
      keywords: ['middle name', 'middle initial', 'mname'],
      exactMatches: ['middle_name', 'middlename', 'mname'],
      autocomplete: ['additional-name'],
      getValue: (p) => p.personal.middleName || ''
    },
    {
      targetPath: 'personal.lastName',
      keywords: ['last name', 'surname', 'family name', 'lname'],
      exactMatches: ['last_name', 'lastname', 'lname', 'family-name'],
      autocomplete: ['family-name'],
      getValue: (p) => p.personal.lastName,
      disambiguationCheck: (f) => {
        const text = `${f.name} ${f.label} ${f.placeholder}`.toLowerCase();
        if (text.includes('legal')) {
          return { isAmbiguous: true, reason: 'Field specifies legal last name.' };
        }
        return { isAmbiguous: false };
      }
    },
    {
      targetPath: 'personal.fullName',
      keywords: ['full name', 'candidate name', 'your name', 'applicant name'],
      exactMatches: ['name', 'full_name', 'fullname'],
      autocomplete: ['name'],
      getValue: (p) => p.personal.fullName || `${p.personal.firstName} ${p.personal.lastName}`.trim(),
      disambiguationCheck: (f) => {
        const text = `${f.name} ${f.label} ${f.placeholder}`.toLowerCase();
        if (text.includes('first') && !text.includes('full')) {
          return { isAmbiguous: true, reason: 'Might be first name only.' };
        }
        if (text.includes('legal')) {
          return { isAmbiguous: true, reason: 'Legal name requested.' };
        }
        return { isAmbiguous: false };
      }
    },

    // --- CONTACT INFO ---
    {
      targetPath: 'contact.primaryEmail',
      keywords: ['email', 'email address', 'e-mail', 'contact email'],
      exactMatches: ['email', 'user_email', 'contact_email', 'applicant_email'],
      autocomplete: ['email'],
      getValue: (p) => p.contact.primaryEmail
    },

    // --- PHONE COUNTRY CODE (Separate Selector / Dial Code) ---
    {
      targetPath: 'contact.phoneCountryCode',
      keywords: ['country code', 'dial code', 'dialing code', 'phone country code', 'calling code', 'isd code', 'country dial code'],
      exactMatches: ['country_code', 'dial_code', 'phone_country_code', 'dialing_code', 'tel_country_code', 'isd_code', 'country_dial_code'],
      autocomplete: ['tel-country-code'],
      getValue: (p) => p.contact.phoneCountryCode || '+91'
    },

    // --- PHONE NATIONAL NUMBER (Explicit 10-Digit Mobile Number) ---
    {
      targetPath: 'contact.phoneNationalNumber',
      keywords: ['national phone', 'national number', '10-digit mobile', '10 digit mobile', '10 digit phone', 'phone without country code', '10-digit phone', 'mobile (10 digits)'],
      exactMatches: ['phone_national', 'mobile_national', 'phone_number_national', 'national_number', 'phone_10_digit', 'mobile_10_digit'],
      autocomplete: ['tel-national'],
      getValue: (p) => p.contact.phoneNationalNumber || (p.contact.mobileNumber ? p.contact.mobileNumber.slice(-10) : '')
    },

    // --- GENERAL PHONE NUMBER (Full International / Standard) ---
    {
      targetPath: 'contact.mobileNumber',
      keywords: ['phone', 'mobile', 'telephone', 'cell', 'phone number', 'contact number', 'mobile phone'],
      exactMatches: ['phone', 'mobile', 'tel', 'phone_number', 'mobile_phone', 'contact_number', 'applicant_phone', 'full_phone'],
      autocomplete: ['tel'],
      getValue: (p) => p.contact.phoneFullInternational || p.contact.mobileNumber || '+919876543210',
      disambiguationCheck: (f, p) => {
        const text = `${f.name} ${f.id} ${f.label} ${f.placeholder} ${f.autocomplete}`.toLowerCase();

        // 1. If website explicitly expects 10-digit mobile number, override to national number
        if (
          text.includes('10 digit') ||
          text.includes('10-digit') ||
          text.includes('10 digits') ||
          text.includes('without country code') ||
          text.includes('national') ||
          f.autocomplete === 'tel-national'
        ) {
          return {
            isAmbiguous: false,
            valueOverride: p.contact.phoneNationalNumber || (p.contact.mobileNumber ? p.contact.mobileNumber.slice(-10) : '')
          };
        }

        // 2. If website field is a country code selector
        if (
          text.includes('country code') ||
          text.includes('dial code') ||
          text.includes('calling code') ||
          f.autocomplete === 'tel-country-code'
        ) {
          return {
            isAmbiguous: false,
            valueOverride: p.contact.phoneCountryCode || '+91'
          };
        }

        return { isAmbiguous: false };
      }
    },
    {
      targetPath: 'contact.linkedInUrl',
      keywords: ['linkedin', 'linkedin profile', 'linkedin url'],
      exactMatches: ['linkedin', 'linkedin_url', 'job_application_answers_attributes_0_text_value'],
      getValue: (p) => p.contact.linkedInUrl || ''
    },
    {
      targetPath: 'contact.gitHubUrl',
      keywords: ['github', 'github url', 'git profile', 'github repository'],
      exactMatches: ['github', 'github_url'],
      getValue: (p) => p.contact.gitHubUrl || ''
    },
    {
      targetPath: 'contact.portfolioUrl',
      keywords: ['portfolio', 'website', 'personal site', 'portfolio url', 'personal website'],
      exactMatches: ['portfolio', 'website', 'portfolio_url', 'personal_website'],
      autocomplete: ['url'],
      getValue: (p) => p.contact.portfolioUrl || p.contact.personalWebsite || ''
    },

    // --- ADDRESS ---
    {
      targetPath: 'personal.address',
      keywords: ['address', 'street', 'street address', 'address line 1'],
      exactMatches: ['address', 'street', 'street_address', 'address_line_1'],
      autocomplete: ['street-address', 'address-line1'],
      getValue: (p) => p.personal.address
    },
    {
      targetPath: 'personal.city',
      keywords: ['city', 'town', 'municipality'],
      exactMatches: ['city', 'town'],
      autocomplete: ['address-level2'],
      getValue: (p) => p.personal.city
    },
    {
      targetPath: 'personal.state',
      keywords: ['state', 'province', 'region'],
      exactMatches: ['state', 'province', 'region'],
      autocomplete: ['address-level1'],
      getValue: (p) => p.personal.state
    },
    {
      targetPath: 'personal.postalCode',
      keywords: ['zip', 'zip code', 'postal code', 'postcode', 'pin code', 'pincode'],
      exactMatches: ['zip', 'zipcode', 'zip_code', 'postal_code', 'postcode', 'pincode', 'pin_code'],
      autocomplete: ['postal-code'],
      getValue: (p) => p.personal.postalCode
    },
    {
      targetPath: 'personal.country',
      keywords: ['country', 'nation', 'nationality'],
      exactMatches: ['country', 'country_name', 'nation'],
      autocomplete: ['country-name'],
      getValue: (p) => p.personal.country
    },

    // --- EDUCATION ---
    {
      targetPath: 'education.institution',
      keywords: ['school', 'university', 'college', 'institution', 'academy'],
      exactMatches: ['school', 'university', 'college', 'institution', 'education_school'],
      getValue: (p) => p.education[0]?.institution || ''
    },
    {
      targetPath: 'education.degree',
      keywords: ['degree', 'highest degree', 'qualification', 'education level'],
      exactMatches: ['degree', 'highest_degree', 'education_degree'],
      getValue: (p) => p.education[0]?.degree || ''
    },
    {
      targetPath: 'education.fieldOfStudy',
      keywords: ['major', 'field of study', 'discipline', 'branch', 'specialization'],
      exactMatches: ['major', 'field_of_study', 'discipline', 'branch'],
      getValue: (p) => p.education[0]?.fieldOfStudy || ''
    },
    {
      targetPath: 'education.graduationYear',
      keywords: ['graduation year', 'grad year', 'year of graduation', 'end year'],
      exactMatches: ['graduation_year', 'grad_year', 'end_year'],
      getValue: (p) => p.education[0]?.graduationYear || ''
    },
    {
      targetPath: 'education.cgpa',
      keywords: ['gpa', 'cgpa', 'percentage', 'grade point'],
      exactMatches: ['gpa', 'cgpa', 'percentage'],
      getValue: (p) => p.education[0]?.cgpa || p.education[0]?.percentage || ''
    },

    // --- EXPERIENCE ---
    {
      targetPath: 'experience.company',
      keywords: ['current company', 'employer', 'most recent company', 'organization', 'company name'],
      exactMatches: ['company', 'employer', 'current_company', 'recent_company'],
      getValue: (p) => p.experience[0]?.company || ''
    },
    {
      targetPath: 'experience.jobTitle',
      keywords: ['job title', 'current title', 'designation', 'position', 'role'],
      exactMatches: ['title', 'job_title', 'current_title', 'designation', 'position'],
      getValue: (p) => p.experience[0]?.jobTitle || ''
    },

    // --- COMPENSATION (Strict: Expected vs Current) ---
    {
      targetPath: 'additional.expectedSalary',
      keywords: ['expected salary', 'desired compensation', 'salary expectations', 'expected compensation', 'target salary'],
      exactMatches: ['expected_salary', 'desired_salary', 'salary_expectation'],
      getValue: (p) => p.additional.expectedSalary || '',
      disambiguationCheck: (f, p) => {
        const text = `${f.name} ${f.label} ${f.placeholder}`.toLowerCase();
        if (text.includes('current salary') || text.includes('current compensation')) {
          return {
            isAmbiguous: true,
            reason: 'Current salary requested; cannot auto-fill with expected salary.'
          };
        }
        return { isAmbiguous: false };
      }
    },
    {
      targetPath: 'additional.currentSalary',
      keywords: ['current salary', 'current compensation', 'present salary'],
      exactMatches: ['current_salary', 'present_salary'],
      getValue: (p) => p.additional.currentSalary || '',
      disambiguationCheck: (f, p) => {
        if (!p.additional.currentSalary && p.additional.expectedSalary) {
          return {
            isAmbiguous: true,
            reason: 'Current salary requested; only expected salary recorded in profile.'
          };
        }
        return { isAmbiguous: false };
      }
    },

    // --- NOTICE PERIOD & AVAILABILITY ---
    {
      targetPath: 'additional.noticePeriod',
      keywords: ['notice period', 'notice', 'availability', 'earliest start'],
      exactMatches: ['notice_period', 'notice', 'availability'],
      getValue: (p) => p.additional.noticePeriod || p.additional.earliestStartDate || ''
    },
    {
      targetPath: 'additional.earliestStartDate',
      keywords: ['start date', 'available date', 'earliest start date', 'when can you start'],
      exactMatches: ['start_date', 'earliest_start_date', 'available_start_date'],
      getValue: (p) => p.additional.earliestStartDate || ''
    },

    // --- WORK AUTHORIZATION & SPONSORSHIP ---
    {
      targetPath: 'additional.workAuthorization',
      keywords: ['authorized to work', 'legal right to work', 'work authorization', 'eligible to work'],
      exactMatches: ['work_authorized', 'authorized_to_work', 'work_authorization'],
      getValue: (p) => p.additional.workAuthorization || 'yes'
    },
    {
      targetPath: 'additional.requiresSponsorship',
      keywords: ['require sponsorship', 'require visa', 'need sponsorship', 'sponsorship in the future'],
      exactMatches: ['requires_sponsorship', 'visa_sponsorship', 'sponsorship_required'],
      getValue: (p) => p.additional.requiresSponsorship || 'no'
    },

    // --- RELOCATION ---
    {
      targetPath: 'additional.willingnessToRelocate',
      keywords: ['relocate', 'willing to relocate', 'open to relocation', 'relocation'],
      exactMatches: ['willing_to_relocate', 'relocate', 'open_to_relocation'],
      getValue: (p) => p.additional.willingnessToRelocate ? 'yes' : 'no'
    }
  ];

  /**
   * Main matching logic: matches a detected form field against profile,
   * learned mappings, and custom fields.
   */
  public static matchField(
    field: DetectedFormField,
    profile: UserProfile,
    customFields: CustomField[] = [],
    learnedMappings: LearnedFieldMapping[] = [],
    currentDomain: string = ''
  ): MatchedFormField {
    const normName = field.name.toLowerCase().trim();
    const normId = field.id.toLowerCase().trim();
    const normLabel = field.label.toLowerCase().trim();
    const normPlaceholder = field.placeholder.toLowerCase().trim();
    const normAutocomplete = field.autocomplete.toLowerCase().trim();
    const combinedIdentifiers = `${normName} ${normId} ${normLabel} ${normPlaceholder} ${normAutocomplete}`;

    // 1. Check Universal Field Memory (Learned Mappings)
    const learned = learnedMappings.find(
      (m) =>
        (m.websiteDomain === currentDomain || m.websiteDomain === '*') &&
        (m.fieldSignature === normName ||
         m.fieldSignature === normId ||
         (normLabel && m.fieldSignature === normLabel))
    );

    if (learned) {
      let val: any = undefined;
      if (learned.matchedProfilePath.startsWith('custom.')) {
        const customKey = learned.matchedProfilePath.replace('custom.', '');
        const cf = customFields.find(c => c.fieldKey === customKey || c.id === customKey);
        if (cf) val = cf.value;
      } else {
        val = this.resolveProfileValue(profile, learned.matchedProfilePath);
      }

      if (val !== undefined && val !== '') {
        return {
          detectedField: field,
          profilePath: learned.matchedProfilePath,
          suggestedValue: val,
          confidence: 'high',
          confidenceScore: 0.95,
          matchReason: `Learned memory from previous applications (${learned.websiteDomain})`,
          isAmbiguous: false,
          isExact: true
        };
      }
    }

    // 2. Check Custom Fields
    for (const cf of customFields) {
      const cfKey = cf.fieldKey.toLowerCase();
      const cfLabel = cf.displayLabel.toLowerCase();

      if (
        normName === cfKey ||
        normId === cfKey ||
        (normLabel && normLabel.includes(cfLabel)) ||
        (cfLabel && normLabel && cfLabel.includes(normLabel))
      ) {
        return {
          detectedField: field,
          matchedCustomFieldId: cf.id,
          profilePath: `custom.${cf.fieldKey}`,
          suggestedValue: cf.value,
          confidence: 'high',
          confidenceScore: 0.9,
          matchReason: `Matched custom profile field: ${cf.displayLabel}`,
          isAmbiguous: false,
          isExact: true
        };
      }
    }

    // 3. Evaluate Built-in Semantic Rules with Scoring
    let bestMatch: {
      rule: MatchRule;
      score: number;
      reason: string;
      isExact: boolean;
    } | null = null;

    for (const rule of this.rules) {
      // Security & Unrelated Field Guard: Do not fill unrelated numeric fields (OTP, salary, pincode, age) with phone number
      const isPhoneRule = rule.targetPath.startsWith('contact.phone') || rule.targetPath === 'contact.mobileNumber';
      if (isPhoneRule) {
        const isUnrelatedNumeric = /\b(otp|2fa|mfa|token|verification|captcha|salary|ctc|compensation|pay|pincode|pin code|zip|zipcode|postal|age|birth_year|grad_year|graduation_year|experience|notice|cgpa|gpa|percentage)\b/i.test(
          combinedIdentifiers
        );
        if (isUnrelatedNumeric) {
          continue; // Strictly bypass phone rule
        }
      }

      let score = 0;
      let reason = '';
      let isExact = false;

      // Autocomplete match (Highest weight: 1.0)
      if (normAutocomplete && rule.autocomplete?.includes(normAutocomplete)) {
        score = 1.0;
        reason = `HTML autocomplete attribute exact match: ${normAutocomplete}`;
        isExact = true;
      }

      // Exact name or ID match (Weight: 0.95)
      if (rule.exactMatches?.some(em => normName === em || normId === em)) {
        if (score < 0.95) {
          score = 0.95;
          reason = `Exact field identifier match for ${rule.targetPath}`;
          isExact = true;
        }
      }

      // Label match
      if (normLabel) {
        for (const kw of rule.keywords) {
          if (normLabel === kw) {
            if (score < 0.92) {
              score = 0.92;
              reason = `Exact label match: "${normLabel}"`;
              isExact = true;
            }
          } else if (normLabel.includes(kw)) {
            const labelScore = 0.75 + (kw.length / (normLabel.length + 5)) * 0.15;
            if (labelScore > score) {
              score = labelScore;
              reason = `Label contains keyword: "${kw}"`;
            }
          }
        }
      }

      // Name or placeholder contains keyword (Word boundary match to avoid false substring positives)
      const fieldIdentifiers = `${normName} ${normId} ${normPlaceholder}`.replace(/[_-]/g, ' ');
      for (const kw of rule.keywords) {
        const regex = new RegExp(`\\b${kw.replace(/[_-]/g, '\\s+')}\\b`, 'i');
        if (regex.test(fieldIdentifiers)) {
          const idScore = 0.65;
          if (idScore > score) {
            score = idScore;
            reason = `Field attributes match: "${kw}"`;
          }
        }
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { rule, score, reason, isExact };
      }
    }

    if (bestMatch && bestMatch.score >= 0.5) {
      const rule = bestMatch.rule;
      let val = rule.getValue(profile);
      let isAmbiguous = false;
      let reason = bestMatch.reason;

      // Check strict disambiguation requirements
      if (rule.disambiguationCheck) {
        const check = rule.disambiguationCheck(field, profile);
        if (check.valueOverride !== undefined) {
          val = check.valueOverride;
        }
        if (check.isAmbiguous) {
          isAmbiguous = true;
          bestMatch.score = Math.min(bestMatch.score, 0.65);
          if (check.reason) reason = `${reason} (Review needed: ${check.reason})`;
        }
      }

      // Determine confidence level
      const confidence = bestMatch.score >= 0.8 && !isAmbiguous ? 'high' : 'medium';

      return {
        detectedField: field,
        profilePath: rule.targetPath,
        suggestedValue: val,
        confidence,
        confidenceScore: Number(bestMatch.score.toFixed(2)),
        matchReason: reason,
        isAmbiguous,
        isExact: bestMatch.isExact
      };
    }

    // No confident match: classified as low confidence / missing
    return {
      detectedField: field,
      suggestedValue: '',
      confidence: 'low',
      confidenceScore: 0.1,
      matchReason: 'No reliable profile match found for this field',
      isAmbiguous: true,
      isExact: false
    };
  }

  /**
   * Resolves nested path on UserProfile object (e.g. "personal.firstName" or "education.0.institution")
   */
  private static resolveProfileValue(profile: UserProfile, path: string): any {
    const parts = path.split('.');
    let curr: any = profile;
    for (const p of parts) {
      if (curr === undefined || curr === null) return undefined;
      curr = curr[p];
    }
    return curr;
  }
}
