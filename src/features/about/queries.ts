import { useQuery } from '@tanstack/react-query';
import { fetchPublishedTeamMembers } from './api';
import { TeamMember } from './team';

// Same query key + 60s staleTime as web usePublishedTeamMembers.
export const usePublishedTeamMembers = () =>
  useQuery<TeamMember[]>({
    queryKey: ['team-members', 'published'],
    queryFn: fetchPublishedTeamMembers,
    staleTime: 60_000,
  });
