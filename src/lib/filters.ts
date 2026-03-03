import { Project, FilterState } from './types';

export function filterProjects(projects: Project[], filters: FilterState): Project[] {
  return projects.filter(project => {
    // Search query matching
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const searchable = [
        project.name,
        project.location.city,
        project.location.state,
        project.notes,
        ...project.contacts.map(c => c.name),
      ].join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    // Stage filter (multi-select, empty = all)
    if (filters.stages.length > 0 && !filters.stages.includes(project.stage)) {
      return false;
    }

    // Health status filter
    if (filters.healthStatuses.length > 0 && !filters.healthStatuses.includes(project.healthStatus)) {
      return false;
    }

    // Priority filter
    if (filters.priorities.length > 0 && !filters.priorities.includes(project.priority)) {
      return false;
    }

    return true;
  });
}

export function getActiveFilterCount(filters: FilterState): number {
  let count = 0;
  if (filters.searchQuery) count++;
  if (filters.stages.length > 0) count++;
  if (filters.healthStatuses.length > 0) count++;
  if (filters.priorities.length > 0) count++;
  return count;
}
