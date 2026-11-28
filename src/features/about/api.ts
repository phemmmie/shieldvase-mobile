import { supabase } from '@/api/supabase';
import { rowToTeamMember, TeamMember, TeamMemberRow } from './team';

// team_members is not yet in the generated Database types — mirrors the
// `as any` localisation in web src/hooks/useTeamMembers.ts.
const table = () => (supabase.from as any)('team_members') as any;

const sortRows = (rows: TeamMemberRow[]) =>
  [...rows].sort(
    (a, b) => a.display_order - b.display_order || a.created_at.localeCompare(b.created_at),
  );

/** Public /about data: only published profiles. */
export const fetchPublishedTeamMembers = async (): Promise<TeamMember[]> => {
  const { data, error } = await table().select('*').eq('status', 'published');
  if (error) throw error;
  return sortRows((data || []) as TeamMemberRow[]).map(rowToTeamMember);
};
