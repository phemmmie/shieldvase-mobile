// Team profiles shown on /about (Meet the team section). Verbatim port of web
// src/data/team.ts — public-read subset only (admin mutations stay web-side).
//
// Data is draft-sourced: anything not yet verified is flagged with the
// `*Verified` booleans so admins can complete review before publishing.
// Do not add photos, roles, or credentials that have not been supplied —
// missing photos render as initials avatars.

export type TeamOrg = 'optiforge' | 'shieldvase';

export const ORG_LABELS: Record<TeamOrg, string> = {
  optiforge: 'OptiForge',
  shieldvase: 'ShieldVase Marketplace',
};

export interface TeamMember {
  /** Stable slug used as React key / anchor id */
  id: string;
  name: string;
  /** Job title as supplied; kept in sync with roleVerified */
  role: string;
  /** false = role still needs admin confirmation before it's treated as final */
  roleVerified: boolean;
  /** Organisations the person represents — may span both */
  organisations: TeamOrg[];
  /** false = which org(s) they represent still needs confirmation */
  affiliationVerified: boolean;
  /** Grouping label used for the Department headings on /about */
  department: string;
  /** null = biography pending; card renders an explicit placeholder note */
  bio: string | null;
  expertise: string[];
  /** Public path or absolute URL to an uploaded portrait. Omit when none supplied. */
  photoUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
}

export const teamMembers: TeamMember[] = [
  {
    id: 'femi-sobakin',
    name: 'Femi Sobakin',
    role: 'Role to be confirmed',
    roleVerified: false,
    organisations: ['optiforge', 'shieldvase'],
    affiliationVerified: false,
    department: 'Leadership',
    bio: 'Profile pending: a short professional biography, key expertise, relevant projects, and organisation affiliation will be added once verified.',
    expertise: [],
  },
  {
    id: 'olaoye-oluwasegun-oladele',
    name: 'Olaoye Oluwasegun Oladele',
    role: 'Professional Accountant',
    roleVerified: false,
    organisations: ['optiforge', 'shieldvase'],
    affiliationVerified: false,
    department: 'Finance',
    bio: 'An accounting professional with expertise to be confirmed in financial reporting, budgeting, financial controls, and business financial management.',
    expertise: ['Financial Reporting', 'Budgeting', 'Financial Controls', 'Business Financial Management'],
  },
  {
    id: 'john-olorunfemi-solomon',
    name: 'John Olorunfemi Solomon',
    role: 'Data Scientist & Software Developer',
    roleVerified: false,
    organisations: ['optiforge', 'shieldvase'],
    affiliationVerified: false,
    department: 'Engineering & Data',
    bio: 'A software and data professional experienced in AI-powered applications, data engineering, machine learning, and scalable digital platforms. His background includes marketplace systems, biometric attendance solutions, educational technology, and LLM-powered data workflows.',
    expertise: ['AI Applications', 'Data Engineering', 'Machine Learning', 'Scalable Platforms'],
  },
  {
    id: 'victor-makinde',
    name: 'Victor Makinde',
    role: 'AI Engineer & Full-Stack Developer',
    roleVerified: false,
    organisations: ['optiforge', 'shieldvase'],
    affiliationVerified: false,
    department: 'Engineering & Data',
    bio: 'A technology professional with experience building web applications, backend services, REST API integrations, and AI-driven automation. His background includes digital platforms, application performance optimisation, and scalable software solutions.',
    expertise: ['Web Applications', 'Backend Services', 'REST API Integrations', 'AI-Driven Automation'],
  },
  {
    id: 'israel-oyeniyi',
    name: 'Israel Oyeniyi',
    role: 'Sustainability & Programme Management',
    roleVerified: false,
    organisations: ['optiforge'],
    affiliationVerified: false,
    department: 'Sustainability & Programmes',
    bio: 'A sustainability professional experienced in environmental programme delivery, climate education, stakeholder partnerships, and youth development. His background includes coordinating environmental initiatives, managing cross-functional teams, and supporting community-impact projects across Nigeria.',
    expertise: ['Environmental Programmes', 'Climate Education', 'Stakeholder Partnerships', 'Youth Development'],
  },
];

/** Initials avatar fallback — e.g. "John Olorunfemi Solomon" → "JS". */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Members representing a given org; 'all' returns everyone. */
export const filterTeamByOrg = (
  members: TeamMember[],
  org: TeamOrg | 'all',
): TeamMember[] =>
  org === 'all' ? members : members.filter(m => m.organisations.includes(org));

/** Preserve declaration order while grouping members under their department. */
export const groupTeamByDepartment = (
  members: TeamMember[],
): { department: string; members: TeamMember[] }[] => {
  const order: string[] = [];
  const map = new Map<string, TeamMember[]>();
  for (const m of members) {
    if (!map.has(m.department)) {
      map.set(m.department, []);
      order.push(m.department);
    }
    map.get(m.department)!.push(m);
  }
  return order.map(department => ({ department, members: map.get(department)! }));
};

// ---------------------------------------------------------------------------
// DB-backed profiles
// ---------------------------------------------------------------------------

/** Row shape of public.team_members (managed via admin dashboard). */
export interface TeamMemberRow {
  id: string;
  name: string;
  role: string;
  role_verified: boolean;
  organisations: string[];
  affiliation_verified: boolean;
  department: string;
  bio: string | null;
  extended_bio: string | null;
  expertise: string[];
  photo_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  display_order: number;
  status: 'draft' | 'published' | 'archived';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const isTeamOrg = (value: string): value is TeamOrg =>
  value === 'optiforge' || value === 'shieldvase';

/** Map a team_members row to the public TeamMember shape used by cards. */
export const rowToTeamMember = (row: TeamMemberRow): TeamMember => ({
  id: row.id,
  name: row.name,
  role: row.role,
  roleVerified: row.role_verified,
  organisations: (row.organisations || []).filter(isTeamOrg),
  affiliationVerified: row.affiliation_verified,
  department: row.department,
  bio: row.bio,
  expertise: row.expertise || [],
  photoUrl: row.photo_url ?? undefined,
  linkedinUrl: row.linkedin_url ?? undefined,
  portfolioUrl: row.portfolio_url ?? undefined,
});
