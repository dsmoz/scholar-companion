// src/api/author.ts
import { apiFetch } from './client';

export interface AuthorProfile {
  author: string;
  items: Array<{ key: string; title: string; date: string }>;
  coauthors: string[];
}

export async function fetchAuthorProfile(authorName: string): Promise<AuthorProfile> {
  return apiFetch<AuthorProfile>(`/author/${encodeURIComponent(authorName)}`);
}
